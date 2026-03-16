'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [savingsTotal, setSavingsTotal] = useState(0);
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email || '');

      supabase
        .from('profiles')
        .select('savings_total, created_at')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setSavingsTotal(data.savings_total || 0);
            setMemberSince(
              new Date(data.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            );
          }
          setLoading(false);
        });
    });
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-10">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
        Settings
      </h1>
      <p className="text-sm text-gray-500 mb-8">Manage your account</p>

      {/* Account info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900 font-medium">{email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900">{memberSince}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total savings</span>
            <span className="text-green-600 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
              ${savingsTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-6"
      >
        {signingOut ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            <LogOut size={16} />
            Sign Out
          </>
        )}
      </button>

      {/* Danger zone */}
      <div className="bg-red-50 rounded-2xl border border-red-100 p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-600 mb-3">
          These actions are irreversible. Proceed with caution.
        </p>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors">
            Export My Data
          </button>
          <button className="w-full px-4 py-2 text-sm text-red-700 font-medium border border-red-300 rounded-xl hover:bg-red-200 transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
