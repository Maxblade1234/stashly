import { createClient } from '@/lib/supabase/server';
import { DollarSign, Package, Users, TrendingUp } from 'lucide-react';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Fetch summary stats
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: retailerCount } = await supabase
    .from('retailers')
    .select('*', { count: 'exact', head: true });

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, total_paid, savings, status, created_at, retailer_id, retailers(name)')
    .order('created_at', { ascending: false });

  const completedTx = (transactions || []).filter(t => t.status === 'completed');
  const totalRevenue = completedTx.reduce((sum, t) => sum + (t.total_paid || 0), 0);
  const totalSavingsDelivered = completedTx.reduce((sum, t) => sum + (t.savings || 0), 0);

  const cards = [
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconBg: 'var(--green-bg)',
      iconColor: 'var(--green)',
    },
    {
      label: 'Cards Sold',
      value: completedTx.length.toString(),
      icon: Package,
      iconBg: 'var(--bg-sky)',
      iconColor: '#3B82F6',
    },
    {
      label: 'Total Users',
      value: (userCount || 0).toString(),
      icon: Users,
      iconBg: 'var(--bg-warm)',
      iconColor: 'var(--text-muted)',
    },
    {
      label: 'Retailers',
      value: (retailerCount || 0).toString(),
      icon: TrendingUp,
      iconBg: 'var(--bg-warm)',
      iconColor: 'var(--text-muted)',
    },
  ];

  // Recent transactions (last 10)
  const recentTx = (transactions || []).slice(0, 10);

  return (
    <div>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(card => (
          <div
            key={card.label}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  background: card.iconBg,
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <card.icon size={18} style={{ color: card.iconColor }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                {card.label}
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 28,
          marginBottom: 32,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 16,
          }}
        >
          Quick Stats
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            {
              label: 'Total savings delivered to users',
              value: `$${totalSavingsDelivered.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              valueColor: 'var(--green)',
            },
            {
              label: 'Total transactions',
              value: (transactions || []).length.toString(),
              valueColor: 'var(--text-primary)',
            },
            {
              label: 'Completion rate',
              value: transactions && transactions.length > 0
                ? `${((completedTx.length / transactions.length) * 100).toFixed(0)}%`
                : 'N/A',
              valueColor: 'var(--text-primary)',
            },
          ].map((stat, i, arr) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--text-body)' }}>{stat.label}</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: stat.valueColor,
                }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Recent Transactions
          </h2>
        </div>

        {recentTx.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: 14 }}>
            No transactions yet
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-warm)' }}>
                <th style={thStyle}>Retailer</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Savings</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                      {(tx.retailers as unknown as { name: string })?.name || 'Unknown'}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)' }}>
                    ${(tx.total_paid || 0).toFixed(2)}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                    ${(tx.savings || 0).toFixed(2)}
                  </td>
                  <td style={tdStyle}>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    completed: { bg: 'var(--green-bg)', color: 'var(--green)' },
    pending: { bg: 'var(--bg-warm)', color: 'var(--text-muted)' },
    failed: { bg: '#FEE2E2', color: '#DC2626' },
    refunded: { bg: 'var(--bg-sky)', color: '#3B82F6' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: s.bg,
        color: s.color,
        textTransform: 'capitalize',
      }}
    >
      {status}
    </span>
  );
}
