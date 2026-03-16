import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase — build a chainable mock
function createChainMock(resolvedValue: any) {
  const chain: any = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(resolvedValue);
  chain.insert = vi.fn().mockResolvedValue({ error: null });
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  return chain;
}

const mockSupabase = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

const mockPaymentService = {
  listPaymentMethods: vi.fn(),
  createCustomer: vi.fn(),
  savePaymentMethod: vi.fn(),
  deletePaymentMethod: vi.fn(),
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

describe('GET /api/payment-methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated requests', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { GET } = await import('../route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns empty array if no processor customer id', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockSupabase.from.mockReturnValue(createChainMock({ data: null }));
    const { GET } = await import('../route');
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.methods).toEqual([]);
  });

  it('returns methods from payment service', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1' } },
    });
    mockSupabase.from.mockReturnValue(
      createChainMock({ data: { processor_customer_id: 'cus_123' } }),
    );
    mockPaymentService.listPaymentMethods.mockResolvedValue([
      { id: 'pm_1', last4: '4242', brand: 'visa', isDefault: true },
    ]);
    const { GET } = await import('../route');
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.methods).toHaveLength(1);
    expect(body.methods[0].last4).toBe('4242');
  });
});

describe('POST /api/payment-methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } });
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ token: 'pm_test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });

  it('returns 400 if token is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'a@b.com' } },
    });
    mockSupabase.from.mockReturnValue(
      createChainMock({ data: { processor_customer_id: 'cus_existing' } }),
    );
    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it('creates customer and saves payment method for new users', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u2', email: 'new@user.com' } },
    });
    // First call: profile lookup returns no customer id
    // Second call: update profile
    // Third call: insert payment method
    const profileChain = createChainMock({ data: null });
    const updateChain = createChainMock({ data: null });
    const insertChain = createChainMock({ data: null });
    mockSupabase.from
      .mockReturnValueOnce(profileChain) // select profile
      .mockReturnValueOnce(updateChain) // update profile with customer id
      .mockReturnValueOnce(insertChain); // insert payment method

    mockPaymentService.createCustomer.mockResolvedValue({
      customerId: 'cus_new',
      processorRef: 'cus_new',
    });
    mockPaymentService.savePaymentMethod.mockResolvedValue({
      paymentMethodId: 'pm_new',
      last4: '1234',
      brand: 'mastercard',
    });

    const { POST } = await import('../route');
    const req = new Request('http://localhost/api/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ token: 'tok_test' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as any);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.last4).toBe('1234');
    expect(body.brand).toBe('mastercard');
    expect(mockPaymentService.createCustomer).toHaveBeenCalledWith({
      email: 'new@user.com',
      metadata: { userId: 'u2' },
    });
    expect(mockPaymentService.savePaymentMethod).toHaveBeenCalledWith({
      customerId: 'cus_new',
      tokenizedCard: 'tok_test',
    });
  });
});
