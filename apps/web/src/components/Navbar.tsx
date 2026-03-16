'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, LogOut, LayoutDashboard, CreditCard } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

const DARK_ROUTES = ['/', '/login', '/signup', '/privacy', '/terms'];

const APP_ROUTES_PREFIX = ['/dashboard', '/gift-cards', '/settings', '/history', '/admin'];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isDarkMode = DARK_ROUTES.includes(pathname);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // App pages nav links (logged-in user on dashboard, etc.)
  const appNavLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/gift-cards', label: 'Gift Cards', icon: CreditCard },
  ];

  if (isDarkMode) {
    return (
      <DarkNav
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        scrolled={scrolled}
        onSignOut={handleSignOut}
      />
    );
  }

  // Light mode nav for app pages
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-lg font-semibold tracking-tight"
            style={{ color: '#1A1A1A' }}
          >
            stashly
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {appNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-full transition-all hover:shadow-lg"
                style={{ backgroundColor: '#1A1A1A' }}
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
          {appNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                pathname === link.href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500'
              }`}
            >
              <link.icon size={18} />
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 w-full"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm text-gray-500"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-900"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

/* =====================================================
   Dark Navbar (Homepage, Login, Signup, Privacy, Terms)
   ===================================================== */
function DarkNav({
  user,
  menuOpen,
  setMenuOpen,
  scrolled,
  onSignOut,
}: {
  user: User | null;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  scrolled: boolean;
  onSignOut: () => void;
}) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(26, 26, 26, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span
            className="text-lg tracking-tight"
            style={{ fontWeight: 600, color: '#FFFFFF' }}
          >
            stashly
          </span>
        </Link>

        {/* Desktop center links */}
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm transition-colors"
                style={{ color: '#B0B0B0' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#FFFFFF')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#B0B0B0')
                }
              >
                Dashboard
              </Link>
              <Link
                href="/gift-cards"
                className="text-sm transition-colors"
                style={{ color: '#B0B0B0' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#FFFFFF')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#B0B0B0')
                }
              >
                Gift Cards
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/gift-cards"
                className="text-sm transition-colors"
                style={{ color: '#B0B0B0' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#FFFFFF')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#B0B0B0')
                }
              >
                Gift Cards
              </Link>
              <a
                href="#how-it-works"
                className="text-sm transition-colors"
                style={{ color: '#B0B0B0' }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = '#FFFFFF')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = '#B0B0B0')
                }
              >
                How It Works
              </a>
            </>
          )}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center">
          {user ? (
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-5 py-2 rounded-full text-sm transition-all"
              style={{
                color: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  'rgba(255, 255, 255, 0.3)';
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          ) : (
            <Link
              href="/signup"
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                color: '#FFFFFF',
                border: '1.5px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'transparent',
                fontSize: '14px',
                borderRadius: '999px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor =
                  'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor =
                  'rgba(255, 255, 255, 0.3)';
              }}
            >
              Get Started Free
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2"
          style={{ color: '#FFFFFF' }}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 py-4 space-y-2"
          style={{
            backgroundColor: 'rgba(26, 26, 26, 0.98)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm"
                style={{ color: '#B0B0B0' }}
              >
                Dashboard
              </Link>
              <Link
                href="/gift-cards"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm"
                style={{ color: '#B0B0B0' }}
              >
                Gift Cards
              </Link>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-3 text-sm w-full"
                style={{ color: '#B0B0B0' }}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/gift-cards"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm"
                style={{ color: '#B0B0B0' }}
              >
                Gift Cards
              </Link>
              <a
                href="#how-it-works"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm"
                style={{ color: '#B0B0B0' }}
              >
                How It Works
              </a>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium"
                style={{ color: '#FFFFFF' }}
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
