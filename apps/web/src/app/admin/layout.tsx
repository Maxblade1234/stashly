import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

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
    { label: 'Overview', href: '/admin' },
    { label: 'Inventory', href: '/admin/inventory' },
    { label: 'Retailers', href: '/admin/retailers' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center gap-2 mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Admin
        </h1>
        <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      <nav className="flex gap-1 mb-8 bg-gray-50 rounded-xl p-1">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-gray-900 hover:bg-white transition-all"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
