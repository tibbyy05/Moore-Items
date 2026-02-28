'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Tag, Plus, Search, Copy, Check, Eye, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, ArrowLeft, DollarSign, Users, TrendingUp, BarChart3, ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────
interface DiscountCode {
  id: string;
  code: string;
  type: string; // 'percentage' | 'fixed'
  value: number;
  is_active: boolean;
  min_order_amount: number;
  code_type: string; // 'general' | 'influencer'
  influencer_name: string | null;
  influencer_email: string | null;
  influencer_platform: string | null;
  payout_per_use: number | null;
  payout_percent: number | null;
  total_uses: number;
  total_revenue: number;
  total_discount_given: number;
  max_uses: number | null;
  starts_at: string | null;
  expires_at: string | null;
  notes: string | null;
  used_count: number;
  created_at: string;
  updated_at: string;
}

interface UsageRow {
  id: string;
  code: string;
  order_number: string | null;
  customer_email: string | null;
  discount_amount: number;
  order_subtotal: number;
  order_total: number;
  influencer_payout: number;
  payout_status: string;
  used_at: string;
}

interface PayoutSummary {
  totalPayout: number;
  pendingPayout: number;
  paidPayout: number;
  pendingCount: number;
}

interface Summary {
  total: number;
  active: number;
  totalUses: number;
  totalRevenue: number;
}

type FilterTab = 'all' | 'general' | 'influencer';
type ViewMode = 'list' | 'detail' | 'create' | 'edit';

// ─── Helpers ─────────────────────────────────────────────────
function getCodeStatus(code: DiscountCode): { label: string; className: string } {
  if (!code.is_active) {
    return { label: 'Inactive', className: 'bg-gray-100 text-gray-500 border-gray-200' };
  }
  if (code.expires_at && new Date(code.expires_at) < new Date()) {
    return { label: 'Expired', className: 'bg-danger/15 text-danger border-danger/30' };
  }
  if (code.max_uses && code.total_uses >= code.max_uses) {
    return { label: 'Maxed', className: 'bg-warning/15 text-warning border-warning/30' };
  }
  return { label: 'Active', className: 'bg-success/15 text-success border-success/30' };
}

function formatDiscount(code: DiscountCode) {
  return code.type === 'percentage' ? `${code.value}%` : `$${Number(code.value).toFixed(2)}`;
}

function formatCurrency(val: number) {
  return `$${Number(val || 0).toFixed(2)}`;
}

// ─── Main Page ───────────────────────────────────────────────
export default function PromoCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, active: 0, totalUses: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('list');
  const [selectedCode, setSelectedCode] = useState<DiscountCode | null>(null);
  const [detailUsage, setDetailUsage] = useState<UsageRow[]>([]);
  const [detailPayout, setDetailPayout] = useState<PayoutSummary | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const emptyForm = {
    code: '', type: 'percentage', value: '', is_active: true,
    min_order_amount: '', code_type: 'general' as string,
    influencer_name: '', influencer_email: '', influencer_platform: '',
    payout_per_use: '', payout_percent: '', max_uses: '',
    starts_at: '', expires_at: '', notes: '',
  };
  const [form, setForm] = useState(emptyForm);

  const fetchCodes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('type', tab);
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/promo-codes?${params}`);
      const data = await res.json();
      setCodes(data.codes || []);
      setSummary(data.summary || { total: 0, active: 0, totalUses: 0, totalRevenue: 0 });
    } catch {
      // Keep current state
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const filteredCodes = useMemo(() => codes, [codes]);

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDetail = async (code: DiscountCode) => {
    setSelectedCode(code);
    setView('detail');
    try {
      const res = await fetch(`/api/admin/promo-codes/${code.id}`);
      const data = await res.json();
      setSelectedCode(data.code);
      setDetailUsage(data.usage || []);
      setDetailPayout(data.payoutSummary || null);
    } catch {
      // Keep what we have
    }
  };

  const openEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setForm({
      code: code.code,
      type: code.type,
      value: String(code.value),
      is_active: code.is_active,
      min_order_amount: String(code.min_order_amount || ''),
      code_type: code.code_type || 'general',
      influencer_name: code.influencer_name || '',
      influencer_email: code.influencer_email || '',
      influencer_platform: code.influencer_platform || '',
      payout_per_use: code.payout_per_use ? String(code.payout_per_use) : '',
      payout_percent: code.payout_percent ? String(code.payout_percent) : '',
      max_uses: code.max_uses ? String(code.max_uses) : '',
      starts_at: code.starts_at ? code.starts_at.slice(0, 16) : '',
      expires_at: code.expires_at ? code.expires_at.slice(0, 16) : '',
      notes: code.notes || '',
    });
    setShowModal(true);
    setError('');
  };

  const openCreate = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setShowModal(true);
    setError('');
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required'); return; }
    if (!form.value || Number(form.value) <= 0) { setError('Value must be greater than 0'); return; }

    setSaving(true);
    setError('');

    const payload: Record<string, any> = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      is_active: form.is_active,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      code_type: form.code_type,
      influencer_name: form.code_type === 'influencer' ? (form.influencer_name || null) : null,
      influencer_email: form.code_type === 'influencer' ? (form.influencer_email || null) : null,
      influencer_platform: form.code_type === 'influencer' ? (form.influencer_platform || null) : null,
      payout_per_use: form.code_type === 'influencer' && form.payout_per_use ? Number(form.payout_per_use) : null,
      payout_percent: form.code_type === 'influencer' && form.payout_percent ? Number(form.payout_percent) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      notes: form.notes || null,
    };

    try {
      const url = editingCode
        ? `/api/admin/promo-codes/${editingCode.id}`
        : '/api/admin/promo-codes';
      const method = editingCode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
        return;
      }

      setShowModal(false);
      fetchCodes();
      // If we were on detail view of the edited code, refresh it
      if (editingCode && selectedCode?.id === editingCode.id) {
        openDetail(data.code);
      }
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (code: DiscountCode) => {
    try {
      await fetch(`/api/admin/promo-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !code.is_active }),
      });
      fetchCodes();
    } catch {
      // Silent fail
    }
  };

  const deleteCode = async (id: string) => {
    try {
      await fetch(`/api/admin/promo-codes/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      if (view === 'detail' && selectedCode?.id === id) {
        setView('list');
        setSelectedCode(null);
      }
      fetchCodes();
    } catch {
      // Silent fail
    }
  };

  const markAllPaid = async (codeId: string) => {
    try {
      await fetch(`/api/admin/promo-codes/${codeId}/mark-paid`, { method: 'POST' });
      if (selectedCode) openDetail(selectedCode);
    } catch {
      // Silent fail
    }
  };

  // ─── Detail View ─────────────────────────────────────────
  if (view === 'detail' && selectedCode) {
    const status = getCodeStatus(selectedCode);
    return (
      <>
        <button
          onClick={() => { setView('list'); setSelectedCode(null); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1a1a2e] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Promo Codes
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">{selectedCode.code}</h1>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${status.className}`}>
                {status.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${
                selectedCode.code_type === 'influencer'
                  ? 'bg-purple-100 text-purple-700 border-purple-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {selectedCode.code_type === 'influencer' ? 'Influencer' : 'General'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDiscount(selectedCode)} off
              {selectedCode.min_order_amount ? ` on orders over ${formatCurrency(selectedCode.min_order_amount)}` : ''}
            </p>
          </div>
          <button
            onClick={() => openEdit(selectedCode)}
            className="px-4 py-2 bg-[#c8a45e] hover:bg-[#b8943e] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Edit Code
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Total Uses</span>
            <p className="text-3xl font-bold text-[#1a1a2e] mt-1">{selectedCode.total_uses || 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Revenue Generated</span>
            <p className="text-3xl font-bold text-gold-500 mt-1">{formatCurrency(selectedCode.total_revenue)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <span className="text-sm font-medium text-gray-500">Total Discounted</span>
            <p className="text-3xl font-bold text-[#1a1a2e] mt-1">{formatCurrency(selectedCode.total_discount_given)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <span className="text-sm font-medium text-gray-500">
              {selectedCode.max_uses ? 'Uses Remaining' : 'Max Uses'}
            </span>
            <p className="text-3xl font-bold text-[#1a1a2e] mt-1">
              {selectedCode.max_uses
                ? Math.max(0, selectedCode.max_uses - (selectedCode.total_uses || 0))
                : 'Unlimited'}
            </p>
          </div>
        </div>

        {/* Influencer Payout Banner */}
        {selectedCode.code_type === 'influencer' && detailPayout && detailPayout.pendingCount > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-900">
                {detailPayout.pendingCount} pending payout{detailPayout.pendingCount !== 1 ? 's' : ''} totaling {formatCurrency(detailPayout.pendingPayout)}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {selectedCode.influencer_name} — {selectedCode.influencer_email}
                {selectedCode.influencer_platform ? ` (${selectedCode.influencer_platform})` : ''}
              </p>
            </div>
            <button
              onClick={() => markAllPaid(selectedCode.id)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Mark All Paid
            </button>
          </div>
        )}

        {/* Influencer Info */}
        {selectedCode.code_type === 'influencer' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
            <h3 className="text-sm font-semibold text-[#1a1a2e] mb-4">Influencer Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name</span>
                <p className="font-medium text-[#1a1a2e]">{selectedCode.influencer_name || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Email</span>
                <p className="font-medium text-[#1a1a2e]">{selectedCode.influencer_email || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Platform</span>
                <p className="font-medium text-[#1a1a2e]">{selectedCode.influencer_platform || '—'}</p>
              </div>
              <div>
                <span className="text-gray-500">Payout</span>
                <p className="font-medium text-[#1a1a2e]">
                  {selectedCode.payout_per_use
                    ? `$${Number(selectedCode.payout_per_use).toFixed(2)}/use`
                    : selectedCode.payout_percent
                      ? `${selectedCode.payout_percent}% of subtotal`
                      : '—'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Usage History */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">Usage History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  {selectedCode.code_type === 'influencer' && (
                    <>
                      <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Payout</th>
                      <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </>
                  )}
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {detailUsage.length === 0 ? (
                  <tr>
                    <td colSpan={selectedCode.code_type === 'influencer' ? 8 : 6} className="py-12 text-center text-sm text-gray-400">
                      No usage recorded yet
                    </td>
                  </tr>
                ) : (
                  detailUsage.map((u) => (
                    <tr key={u.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-[#1a1a2e]">{u.order_number || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{u.customer_email || '—'}</td>
                      <td className="py-3 px-4 text-sm text-right text-gray-600">{formatCurrency(u.order_subtotal)}</td>
                      <td className="py-3 px-4 text-sm text-right text-danger font-medium">-{formatCurrency(u.discount_amount)}</td>
                      <td className="py-3 px-4 text-sm text-right font-semibold text-[#1a1a2e]">{formatCurrency(u.order_total)}</td>
                      {selectedCode.code_type === 'influencer' && (
                        <>
                          <td className="py-3 px-4 text-sm text-right text-purple-600 font-medium">{formatCurrency(u.influencer_payout)}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              u.payout_status === 'paid'
                                ? 'bg-success/15 text-success'
                                : u.payout_status === 'void'
                                  ? 'bg-gray-100 text-gray-500'
                                  : 'bg-warning/15 text-warning'
                            }`}>
                              {u.payout_status}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(u.used_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  // ─── List View ───────────────────────────────────────────
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Promo Codes</h1>
          <p className="text-sm text-gray-500">Manage discount codes and influencer tracking</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#c8a45e] hover:bg-[#b8943e] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Code
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Codes</span>
            <Tag className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{summary.total}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active Codes</span>
            <ToggleRight className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-success">{summary.active}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Uses</span>
            <Users className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{summary.totalUses}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Revenue via Codes</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gold-500">{formatCurrency(summary.totalRevenue)}</p>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(['all', 'general', 'influencer'] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t
                  ? 'bg-[#c8a45e] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All' : t === 'general' ? 'General' : 'Influencer'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search codes or influencers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e] w-72"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Uses</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">Loading...</td>
                </tr>
              ) : filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                    {search ? 'No codes match your search' : 'No promo codes yet'}
                  </td>
                </tr>
              ) : (
                filteredCodes.map((code) => {
                  const status = getCodeStatus(code);
                  return (
                    <tr
                      key={code.id}
                      className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-semibold text-[#1a1a2e]">{code.code}</span>
                          <button
                            onClick={() => copyCode(code.code, code.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy code"
                          >
                            {copiedId === code.id
                              ? <Check className="w-3.5 h-3.5 text-success" />
                              : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-[#1a1a2e]">
                        {formatDiscount(code)}
                        {code.min_order_amount ? (
                          <span className="text-xs text-gray-400 ml-1">min {formatCurrency(code.min_order_amount)}</span>
                        ) : null}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${
                          code.code_type === 'influencer'
                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {code.code_type === 'influencer' ? 'Influencer' : 'General'}
                        </span>
                        {code.code_type === 'influencer' && code.influencer_name && (
                          <p className="text-xs text-gray-400 mt-0.5">{code.influencer_name}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-right text-[#1a1a2e] tabular-nums">
                        {code.total_uses || 0}
                        {code.max_uses ? <span className="text-gray-400">/{code.max_uses}</span> : null}
                      </td>
                      <td className="py-4 px-4 text-sm text-right font-semibold text-gold-500 tabular-nums">
                        {formatCurrency(code.total_revenue)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetail(code)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#1a1a2e] hover:bg-gray-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(code)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#1a1a2e] hover:bg-gray-100 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleActive(code)}
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#1a1a2e] hover:bg-gray-100 transition-colors"
                            title={code.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {code.is_active
                              ? <ToggleRight className="w-4 h-4 text-success" />
                              : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          {deleteConfirm === code.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteCode(code.id)}
                                className="px-2 py-1 text-xs font-semibold text-white bg-danger rounded transition-colors hover:bg-danger/80"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded transition-colors hover:bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(code.id)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1a1a2e]">
                {editingCode ? 'Edit Code' : 'Create Code'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-danger/10 border border-danger/20 text-danger text-sm rounded-lg">
                  {error}
                </div>
              )}

              {/* Code & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code Type</label>
                  <div className="relative">
                    <select
                      value={form.code_type}
                      onChange={(e) => setForm({ ...form, code_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                    >
                      <option value="general">General (Store Promo)</option>
                      <option value="influencer">Influencer (Affiliate)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                  <div className="relative">
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] appearance-none focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === 'percentage' ? '15' : '5.00'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
              </div>

              {/* Min Order & Max Uses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Amount</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
              </div>

              {/* Scheduling */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starts At</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                  <input
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                  />
                </div>
              </div>

              {/* Influencer Fields */}
              {form.code_type === 'influencer' && (
                <div className="border-t border-gray-200 pt-5 space-y-4">
                  <h3 className="text-sm font-semibold text-purple-700">Influencer Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={form.influencer_name}
                        onChange={(e) => setForm({ ...form, influencer_name: e.target.value })}
                        placeholder="Jane Smith"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.influencer_email}
                        onChange={(e) => setForm({ ...form, influencer_email: e.target.value })}
                        placeholder="jane@example.com"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                      <input
                        type="text"
                        value={form.influencer_platform}
                        onChange={(e) => setForm({ ...form, influencer_platform: e.target.value })}
                        placeholder="Instagram, TikTok, YouTube..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      />
                    </div>
                    <div />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payout Per Use ($)</label>
                      <input
                        type="number"
                        value={form.payout_per_use}
                        onChange={(e) => setForm({ ...form, payout_per_use: e.target.value })}
                        placeholder="5.00"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payout Percent (%)</label>
                      <input
                        type="number"
                        value={form.payout_percent}
                        onChange={(e) => setForm({ ...form, payout_percent: e.target.value })}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
                      />
                      <p className="text-xs text-gray-400 mt-1">Flat $ takes priority if both are set</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Internal notes..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e] resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_active ? 'bg-success' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    form.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#c8a45e] hover:bg-[#b8943e] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingCode ? 'Update Code' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
