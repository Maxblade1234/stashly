'use client';

import { useEffect, useState } from 'react';
import { Loader2, Store, ToggleLeft, ToggleRight, Pencil, X, Check } from 'lucide-react';

interface Retailer {
  id: string;
  name: string;
  domain: string;
  is_active: boolean;
  available_denominations: number[];
  per_user_daily_limit_usd: number;
  max_gift_cards_per_order: number | null;
}

export default function AdminRetailersPage() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    per_user_daily_limit_usd: '',
    max_gift_cards_per_order: '',
  });

  const fetchRetailers = () => {
    fetch('/api/admin/retailers')
      .then(res => res.json())
      .then(data => {
        setRetailers(data.retailers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchRetailers(); }, []);

  const toggleActive = async (retailer: Retailer) => {
    await fetch('/api/admin/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...retailer, is_active: !retailer.is_active }),
    });
    fetchRetailers();
  };

  const startEdit = (r: Retailer) => {
    setEditingId(r.id);
    setEditForm({
      per_user_daily_limit_usd: r.per_user_daily_limit_usd.toString(),
      max_gift_cards_per_order: r.max_gift_cards_per_order?.toString() || '',
    });
  };

  const saveEdit = async (r: Retailer) => {
    await fetch('/api/admin/retailers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...r,
        per_user_daily_limit_usd: parseFloat(editForm.per_user_daily_limit_usd) || r.per_user_daily_limit_usd,
        max_gift_cards_per_order: editForm.max_gift_cards_per_order
          ? parseInt(editForm.max_gift_cards_per_order)
          : null,
      }),
    });
    setEditingId(null);
    fetchRetailers();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
        <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: 13,
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    outline: 'none',
    width: 100,
  };

  return (
    <div>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 24,
        }}
      >
        Retailer Configuration
      </h2>

      {retailers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Store size={40} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No retailers configured</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {retailers.map(r => (
            <div
              key={r.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                transition: 'box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.name}
                    </h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: r.is_active ? 'var(--green-bg)' : 'var(--bg-warm)',
                        color: r.is_active ? 'var(--green)' : 'var(--text-muted)',
                      }}
                    >
                      {r.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{r.domain}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {editingId === r.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(r)}
                        style={{ color: 'var(--green)', cursor: 'pointer', padding: 4 }}
                        title="Save"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(r)}
                      style={{ color: 'var(--text-light)', cursor: 'pointer', padding: 4 }}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => toggleActive(r)}
                    style={{ color: r.is_active ? 'var(--green)' : 'var(--text-light)', cursor: 'pointer', padding: 4 }}
                  >
                    {r.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                  </button>
                </div>
              </div>

              {/* Details row */}
              <div
                style={{
                  display: 'flex',
                  gap: 24,
                  marginTop: 14,
                  fontSize: 13,
                  color: 'var(--text-body)',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Denominations:</strong>{' '}
                  {r.available_denominations.map(d => `$${d}`).join(', ')}
                </span>

                {editingId === r.id ? (
                  <>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Daily limit:</strong>
                      <input
                        type="number"
                        value={editForm.per_user_daily_limit_usd}
                        onChange={e => setEditForm(f => ({ ...f, per_user_daily_limit_usd: e.target.value }))}
                        style={inputStyle}
                      />
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Max cards/order:</strong>
                      <input
                        type="number"
                        value={editForm.max_gift_cards_per_order}
                        onChange={e => setEditForm(f => ({ ...f, max_gift_cards_per_order: e.target.value }))}
                        style={inputStyle}
                        placeholder="None"
                      />
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Daily limit:</strong>{' '}
                      ${r.per_user_daily_limit_usd}
                    </span>
                    {r.max_gift_cards_per_order && (
                      <span>
                        <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Max cards/order:</strong>{' '}
                        {r.max_gift_cards_per_order}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
