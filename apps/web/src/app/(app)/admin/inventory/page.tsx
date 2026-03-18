'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Package, X } from 'lucide-react';

interface InventorySummary {
  retailer: string;
  denomination: number;
  available: number;
  reserved: number;
  sold: number;
}

export default function AdminInventoryPage() {
  const [summary, setSummary] = useState<InventorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    retailer_name: '',
    denomination: '',
    code: '',
    discount_percent: '',
  });
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState('');

  const fetchSummary = () => {
    setLoading(true);
    fetch('/api/admin/inventory')
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retailer_name: addForm.retailer_name,
          denomination: parseFloat(addForm.denomination),
          code: addForm.code,
          discount_percent: parseFloat(addForm.discount_percent),
        }),
      });

      if (res.ok) {
        setMessage('Card added successfully');
        setAddForm({ retailer_name: '', denomination: '', code: '', discount_percent: '' });
        fetchSummary();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to add card');
      }
    } catch {
      setMessage('Failed to connect to inventory service');
    } finally {
      setAdding(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
    fontSize: 14,
    color: 'var(--text-primary)',
    background: 'var(--surface)',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    width: '100%',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Inventory
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 'var(--radius-pill)',
            background: 'var(--dark)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          {showAddForm ? <X size={14} /> : <Plus size={14} />}
          {showAddForm ? 'Cancel' : 'Add Card'}
        </button>
      </div>

      {/* Add card form */}
      {showAddForm && (
        <form
          onSubmit={handleAdd}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 28,
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 20,
            }}
          >
            Add Gift Card to Inventory
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Retailer name"
              value={addForm.retailer_name}
              onChange={e => setAddForm(f => ({ ...f, retailer_name: e.target.value }))}
              required
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Denomination ($)"
              value={addForm.denomination}
              onChange={e => setAddForm(f => ({ ...f, denomination: e.target.value }))}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Gift card code"
              value={addForm.code}
              onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
              required
              style={inputStyle}
            />
            <input
              type="number"
              placeholder="Discount %"
              value={addForm.discount_percent}
              onChange={e => setAddForm(f => ({ ...f, discount_percent: e.target.value }))}
              required
              step="0.1"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="submit"
              disabled={adding}
              style={{
                padding: '10px 24px',
                borderRadius: 'var(--radius-pill)',
                background: 'var(--dark)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                opacity: adding ? 0.5 : 1,
                cursor: adding ? 'not-allowed' : 'pointer',
              }}
            >
              {adding ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                'Add Card'
              )}
            </button>
            {message && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: message.includes('success') ? 'var(--green)' : '#DC2626',
                }}
              >
                {message}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Inventory table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0' }}>
          <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : summary.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Package size={40} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No inventory data available</p>
          <p style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 4 }}>
            Make sure the inventory service is running
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-warm)' }}>
                <th style={thStyle}>Retailer</th>
                <th style={thStyle}>Denomination</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Available</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Reserved</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Sold</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ ...tdStyle, fontWeight: 500, color: 'var(--text-primary)' }}>{row.retailer}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>${row.denomination}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <CountBadge value={row.available} bg="var(--green-bg)" color="var(--green)" />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <CountBadge value={row.reserved} bg="var(--bg-warm)" color="var(--text-muted)" />
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <CountBadge value={row.sold} bg="var(--bg-sky)" color="var(--text-body)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 20px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 20px',
  color: 'var(--text-body)',
};

function CountBadge({ value, bg, color }: { value: number; bg: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 28,
        height: 24,
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color: color,
        fontSize: 12,
        fontWeight: 700,
        padding: '0 8px',
      }}
    >
      {value}
    </span>
  );
}
