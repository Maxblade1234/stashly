import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LayoutDashboard, Package, Store } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Inventory', href: '/admin/inventory', icon: Package },
    { label: 'Retailers', href: '/admin/retailers', icon: Store },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Admin Dashboard
        </h1>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            background: 'var(--dark)',
            color: '#fff',
            padding: '3px 10px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          Admin
        </span>
      </div>

      {/* Tab Nav */}
      <nav
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 32,
          background: 'var(--bg-warm)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
        }}
      >
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-body)',
              transition: 'all 0.2s ease',
            }}
            className="hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
          >
            <item.icon size={15} />
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
