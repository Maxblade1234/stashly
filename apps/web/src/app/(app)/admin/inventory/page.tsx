'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Package } from 'lucide-react';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Inventory
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-medium hover:shadow-md transition-all"
          style={{ backgroundColor: '#2B3FE0' }}
        >
          <Plus size={14} />
          Add Card
        </button>
      </div>

      {/* Add card form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Add Gift Card to Inventory</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              placeholder="Retailer name"
              value={addForm.retailer_name}
              onChange={e => setAddForm(f => ({ ...f, retailer_name: e.target.value }))}
              required
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="number"
              placeholder="Denomination ($)"
              value={addForm.denomination}
              onChange={e => setAddForm(f => ({ ...f, denomination: e.target.value }))}
              required
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="text"
              placeholder="Gift card code"
              value={addForm.code}
              onChange={e => setAddForm(f => ({ ...f, code: e.target.value }))}
              required
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <input
              type="number"
              placeholder="Discount %"
              value={addForm.discount_percent}
              onChange={e => setAddForm(f => ({ ...f, discount_percent: e.target.value }))}
              required
              step="0.1"
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#2B3FE0' }}
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : 'Add Card'}
            </button>
            {message && (
              <span className={`text-xs ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </span>
            )}
          </div>
        </form>
      )}

      {/* Inventory table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : summary.length === 0 ? (
        <div className="text-center py-12">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">No inventory data available</p>
          <p className="text-gray-400 text-xs mt-1">Make sure the inventory service is running</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Denomination</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Available</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Reserved</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{row.retailer}</td>
                  <td className="px-5 py-3 text-gray-600" style={{ fontFamily: 'var(--font-mono)' }}>${row.denomination}</td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                      {row.available}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold">
                      {row.reserved}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                      {row.sold}
                    </span>
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
