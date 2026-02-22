'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

interface Address {
  id: string;
  label: string;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

const EMPTY_ADDRESS: Omit<Address, 'id'> = {
  label: 'Home',
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  is_default: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, 'id'>>(EMPTY_ADDRESS);
  const [saving, setSaving] = useState(false);
  const { user, customerId, loading: authLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user || !customerId) {
        router.replace('/login');
        return;
      }
      const supabase = createClient();
      const { data: addrs } = await supabase
        .from('mi_customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false });
      setAddresses(addrs || []);
      setLoading(false);
    };
    load();
  }, [router, user, customerId, authLoading]);

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.state || !form.postal_code) return;
    setSaving(true);
    if (!customerId) {
      setSaving(false);
      return;
    }
    const supabase = createClient();

    if (form.is_default) {
      await supabase
        .from('mi_customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);
    }

    if (editing === 'new') {
      const { data: newAddr } = await supabase
        .from('mi_customer_addresses')
        .insert({ ...form, customer_id: customerId })
        .select()
        .single();
      if (newAddr) setAddresses((prev) => [...prev, newAddr]);
    } else {
      const { data: updated } = await supabase
        .from('mi_customer_addresses')
        .update(form)
        .eq('id', editing!)
        .select()
        .single();
      if (updated) setAddresses((prev) => prev.map((a) => (a.id === editing ? updated : a)));
    }

    setEditing(null);
    setForm(EMPTY_ADDRESS);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from('mi_customer_addresses').delete().eq('id', id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const startEdit = (address: Address) => {
    setEditing(address.id);
    setForm({
      label: address.label,
      name: address.name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default,
    });
  };

  if (loading || authLoading) return <p className="text-warm-600 py-12">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-playfair font-semibold text-warm-900">Saved Addresses</h2>
        {editing === null && (
          <button
            onClick={() => {
              setEditing('new');
              setForm(EMPTY_ADDRESS);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add Address
          </button>
        )}
      </div>

      {editing !== null && (
        <div className="bg-warm-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-warm-900 mb-4">
            {editing === 'new' ? 'Add New Address' : 'Edit Address'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-warm-900 mb-1">Label</label>
              <select
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              >
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-warm-900 mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="John Doe"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-warm-900 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                value={form.line1}
                onChange={(e) => setForm({ ...form, line1: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="123 Main St"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-warm-900 mb-1">
                Address Line 2 <span className="text-warm-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={form.line2}
                onChange={(e) => setForm({ ...form, line2: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="Apt 4B"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="Fort Lauderdale"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="FL"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-1">ZIP Code</label>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
                placeholder="33301"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-1">Country</label>
              <select
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-warm-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-warm-300 text-gold-500 focus:ring-gold-500"
                />
                Set as default shipping address
              </label>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              onClick={() => {
                setEditing(null);
                setForm(EMPTY_ADDRESS);
              }}
              className="px-6 py-2.5 rounded-lg border border-warm-200 text-warm-700 hover:bg-warm-50 transition text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && editing === null ? (
        <div className="bg-warm-50 rounded-xl p-8 text-center">
          <MapPin className="w-8 h-8 text-warm-400 mx-auto mb-3" />
          <p className="text-warm-600 mb-4">No saved addresses yet.</p>
          <button
            onClick={() => {
              setEditing('new');
              setForm(EMPTY_ADDRESS);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm"
          >
            <Plus className="w-4 h-4" /> Add Your First Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-warm-50 rounded-xl p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-warm-900">{addr.label}</p>
                  {addr.is_default && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-warm-700">{addr.name}</p>
                <p className="text-sm text-warm-600">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}
                </p>
                <p className="text-sm text-warm-600">
                  {addr.city}, {addr.state} {addr.postal_code}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(addr)}
                  className="p-2 rounded-lg hover:bg-warm-100 text-warm-500 hover:text-warm-700 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-warm-500 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
