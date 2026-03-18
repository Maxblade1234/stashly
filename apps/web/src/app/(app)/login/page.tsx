'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-sky, #E8EFF7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid var(--border, #E8E3DB)',
          padding: '48px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
          <Image src="/images/stashly-icon.png" alt="Stashly" width={28} height={28} />
          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary, #1A1A1A)' }}>Stashly</span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary, #1A1A1A)', textAlign: 'center', margin: '0 0 8px 0' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-body, #6B6B6B)', textAlign: 'center', margin: '0 0 32px 0' }}>
          Sign in to your Stashly account
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1A1A1A)', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              style={{
                width: '100%',
                border: '1px solid var(--border, #E8E3DB)',
                borderRadius: 'var(--radius-sm, 12px)',
                padding: '14px 16px',
                fontSize: '15px',
                color: 'var(--text-primary, #1A1A1A)',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--dark, #1A1A1A)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border, #E8E3DB)')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1A1A1A)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Your password"
              style={{
                width: '100%',
                border: '1px solid var(--border, #E8E3DB)',
                borderRadius: 'var(--radius-sm, 12px)',
                padding: '14px 16px',
                fontSize: '15px',
                color: 'var(--text-primary, #1A1A1A)',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--dark, #1A1A1A)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border, #E8E3DB)')}
            />
          </div>

          {/* Forgot password link */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link
              href="/forgot-password"
              style={{ fontSize: '14px', color: 'var(--text-body, #6B6B6B)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              Forgot password?
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#FEF2F2',
                color: '#DC2626',
                borderRadius: 'var(--radius-sm, 12px)',
                padding: '12px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--dark, #1A1A1A)',
              color: '#fff',
              borderRadius: 'var(--radius-pill, 999px)',
              padding: '14px',
              fontSize: '15px',
              fontWeight: 500,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: loading ? 0.5 : 1,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--dark-hover, #333)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--dark, #1A1A1A)'; }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Sign In <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ fontSize: '14px', color: 'var(--text-body, #6B6B6B)', textAlign: 'center', marginTop: '24px' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--text-primary, #1A1A1A)', fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
