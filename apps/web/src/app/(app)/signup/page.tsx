'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

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

        {/* Plan badge */}
        {plan && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <span
              style={{
                background: 'var(--green-bg, #E8F5E9)',
                color: 'var(--green, #2D7A2F)',
                fontSize: '13px',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '6px',
              }}
            >
              Starting with {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
            </span>
          </div>
        )}

        {/* Heading */}
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary, #1A1A1A)', textAlign: 'center', margin: '0 0 8px 0' }}>
          Create your account
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-body, #6B6B6B)', textAlign: 'center', margin: '0 0 32px 0' }}>
          Start saving on gift cards today
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1A1A1A)', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
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

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text-primary, #1A1A1A)', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Confirm your password"
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
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={16} /></>}
          </button>
        </form>

        {/* Sign in link */}
        <p style={{ fontSize: '14px', color: 'var(--text-body, #6B6B6B)', textAlign: 'center', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--text-primary, #1A1A1A)', fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
