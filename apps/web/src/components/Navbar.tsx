'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, LogOut, LayoutDashboard, CreditCard, History } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const navLinks = user ? [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/gift-cards', label: 'Gift Cards', icon: CreditCard },
  ] : [];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight" style={{ color: '#2B3FE0', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            stashly
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all hover:shadow-lg"
                style={{ backgroundColor: '#2B3FE0' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-2">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                pathname === link.href ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 w-full"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm text-gray-600">Log In</Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-blue-700">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
