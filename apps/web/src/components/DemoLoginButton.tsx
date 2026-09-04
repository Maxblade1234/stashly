'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';

interface DemoLoginButtonProps {
  variant?: 'primary' | 'secondary' | 'link';
  label?: string;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * One-click demo account. Asks the server for a fresh, pre-seeded throwaway
 * user, signs in with it, and lands on the dashboard — no signup, no email
 * confirmation. Built for people evaluating the product (recruiters,
 * partners) who shouldn't have to create an account to see it work.
 */
export default function DemoLoginButton({
  variant = 'primary',
  label = 'Try the live demo',
  style,
  className,
}: DemoLoginButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/demo/login', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Demo account unavailable right now.');
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) throw new Error(signInError.message);

      router.push('/dashboard?demo=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  const base: React.CSSProperties =
    variant === 'link'
      ? {
          background: 'none',
          color: 'var(--text-primary, #1A1A1A)',
          fontWeight: 500,
          fontSize: 14,
          padding: 0,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }
      : {
          background: variant === 'primary' ? '#1A1A1A' : 'transparent',
          color: variant === 'primary' ? '#fff' : '#1A1A1A',
          border: variant === 'primary' ? 'none' : '1.5px solid #E8E3DB',
          padding: '14px 32px',
          borderRadius: 999,
          fontWeight: 500,
          fontSize: 16,
          transition: 'all 0.2s ease',
        };

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          ...base,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? 'wait' : 'pointer',
          ...style,
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? 'Setting up your demo account…' : label}
      </button>
      {error && (
        <span style={{ fontSize: 13, color: '#D32F2F', maxWidth: 320, textAlign: 'center' }}>{error}</span>
      )}
    </div>
  );
}
