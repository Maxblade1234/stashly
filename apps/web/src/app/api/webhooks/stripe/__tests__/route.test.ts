import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPaymentService = {
  handleWebhook: vi.fn(),
};

vi.mock('@/services/payment', () => ({
  createPaymentService: vi.fn(() => mockPaymentService),
  PaymentError: class PaymentError extends Error {
    code: string;
    isRetryable: boolean;
    constructor(msg: string, code: string) {
      super(msg);
      this.code = code;
      this.name = 'PaymentError';
      this.isRetryable = false;
    }
  },
}));

function createChainMock(resolvedValue: any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  chain.insert = vi.fn().mockResolvedValue({ error: null });
  chain.update = vi.fn().mockReturnValue(chain);
  return chain;
}

const mockAdminClient = {
  from: vi.fn().mockReturnValue(createChainMock({ data: null })),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockAdminClient),
}));

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock return
    mockAdminClient.from.mockReturnValue(createChainMock({ data: null }));
  });

  it('returns 400 if stripe-signature header is missing', async () => {
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing signature');
  });

  it('returns 400 if signature verification fails', async () => {
    const { PaymentError } = await import('@/services/payment');
    mockPaymentService.handleWebhook.mockRejectedValue(
      new PaymentError('Invalid', 'webhook_error'),
    );

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'bad' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('returns 200 for valid events and records them', async () => {
    mockPaymentService.handleWebhook.mockResolvedValue({
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: { id: 'pi_123', metadata: { transactionId: 'txn_abc' } },
    });
    // First from call: check for existing event (none found)
    // Second from call: insert webhook event
    // Third from call: handlePaymentSucceeded -> select transaction
    const selectChain = createChainMock({ data: null });
    const insertChain = createChainMock({ data: null });
    const txnSelectChain = createChainMock({ data: null }); // no txn found
    mockAdminClient.from
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce(insertChain)
      .mockReturnValueOnce(txnSelectChain);

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it('skips duplicate events', async () => {
    mockPaymentService.handleWebhook.mockResolvedValue({
      id: 'evt_dup',
      type: 'payment_intent.succeeded',
      data: {},
    });
    // Return existing event for the select query
    mockAdminClient.from.mockReturnValue(
      createChainMock({ data: { id: 'evt_dup' } }),
    );

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'valid' },
    });
    const res = await POST(req as any);
    const body = await res.json();
    expect(body.duplicate).toBe(true);
  });
});
