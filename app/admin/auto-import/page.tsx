'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';

interface Suggestion {
  id: string;
  batch_id: string;
  cj_pid: string;
  product_name: string;
  product_image: string | null;
  cj_category: string | null;
  cj_price: number;
  shipping_cost: number;
  retail_price: number;
  margin_percent: number;
  warehouse: string;
  us_stock: number;
  variant_count: number;
  ai_score: number;
  ai_reasoning: string;
  ai_season_ok: boolean;
  ai_brand_fit: boolean;
  ai_quality_ok: boolean;
  status: string;
  imported_product_id: string | null;
  error_message: string | null;
  created_at: string;
}

interface Batch {
  batch_id: string;
  created_at: string;
  count: number;
  items: Suggestion[];
}

async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

function ScoreBadge({ score }: { score: number }) {
  let bg: string, text: string;
  if (score >= 70) {
    bg = 'bg-green-100'; text = 'text-green-700';
  } else if (score >= 50) {
    bg = 'bg-yellow-100'; text = 'text-yellow-700';
  } else {
    bg = 'bg-red-100'; text = 'text-red-700';
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${bg} ${text}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    imported: 'bg-green-100 text-green-700',
    rejected: 'bg-gray-100 text-gray-500',
    error: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function AutoImportPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [approveProgress, setApproveProgress] = useState('');

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter
        ? `/api/auto-import?status=${statusFilter}`
        : '/api/auto-import';
      const res = await fetch(url);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setBatches(data.batches || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleRunNow = async () => {
    setSuggesting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auto-import/suggest', { method: 'POST' });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Suggest failed');
      setMessage(`Found ${data.suggested} new suggestions`);
      fetchSuggestions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSuggesting(false);
    }
  };

  const updateSuggestionStatus = (id: string, status: string, errorMessage?: string) => {
    setBatches((prev) =>
      prev.map((batch) => ({
        ...batch,
        items: batch.items.map((item) =>
          item.id === id ? { ...item, status, error_message: errorMessage || null } : item
        ),
      }))
    );
  };

  const handleApprove = async () => {
    if (selected.size === 0) return;
    setApproving(true);
    setMessage('');
    setError('');

    const ids = Array.from(selected);
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < ids.length; i++) {
      setApproveProgress(`Importing product ${i + 1} of ${ids.length}...`);
      try {
        const res = await fetch('/api/auto-import/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestion_id: ids[i] }),
        });
        const data = await safeJson(res);
        if (data.success) {
          imported++;
          updateSuggestionStatus(ids[i], 'imported');
        } else {
          failed++;
          const errMsg = data.error || 'Import failed';
          errors.push(errMsg);
          updateSuggestionStatus(ids[i], 'error', errMsg);
        }
      } catch (err: any) {
        failed++;
        const errMsg = err.message || 'Import failed';
        errors.push(errMsg);
        updateSuggestionStatus(ids[i], 'error', errMsg);
      }
    }

    const parts: string[] = [];
    if (imported > 0) parts.push(`${imported} imported`);
    if (failed > 0) parts.push(`${failed} failed`);
    setMessage(parts.join(', '));
    if (errors.length > 0) setError(errors[0]);

    setSelected(new Set());
    setApproving(false);
    setApproveProgress('');
  };

  const handleReject = async () => {
    if (selected.size === 0) return;
    setRejecting(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/auto-import/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion_ids: Array.from(selected) }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Reject failed');
      setMessage(`Rejected ${data.rejected} suggestion${data.rejected !== 1 ? 's' : ''}`);
      setSelected(new Set());
      fetchSuggestions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRejecting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (items: Suggestion[]) => {
    const pendingItems = items.filter((s) => s.status === 'pending');
    const allSelected = pendingItems.every((s) => selected.has(s.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pendingItems.forEach((s) => next.delete(s.id));
      } else {
        pendingItems.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const allSuggestions = batches.flatMap((b) => b.items);
  const pendingCount = allSuggestions.filter((s) => s.status === 'pending').length;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a2e]">Auto-Import Suggestions</h1>
            <p className="text-sm text-gray-500">AI-scored product candidates from CJ</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleRunNow}
            disabled={suggesting}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-60 flex items-center gap-2"
          >
            {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {suggesting ? 'Finding products...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        {['pending', 'imported', 'rejected', 'error', ''].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              statusFilter === s
                ? 'bg-[#1a1a2e] text-white border-[#1a1a2e]'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {approveProgress && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {approveProgress}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty */}
      {!loading && allSuggestions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No suggestions found</p>
          <p className="text-gray-400 text-xs mt-1">Click &quot;Run Now&quot; to discover new products</p>
        </div>
      )}

      {/* Batches */}
      {!loading &&
        batches.map((batch) => {
          const batchDate = new Date(batch.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          });
          const batchPending = batch.items.filter((s) => s.status === 'pending');
          const allBatchSelected = batchPending.length > 0 && batchPending.every((s) => selected.has(s.id));

          return (
            <div key={batch.batch_id} className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                    {batchDate}
                  </h2>
                  <span className="text-xs text-gray-400">
                    {batch.count} suggestion{batch.count !== 1 ? 's' : ''}
                  </span>
                </div>
                {batchPending.length > 0 && (
                  <button
                    onClick={() => toggleSelectAll(batch.items)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {allBatchSelected ? 'Deselect all' : 'Select all pending'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {batch.items.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-white rounded-xl border transition-all ${
                      selected.has(s.id)
                        ? 'border-purple-400 ring-2 ring-purple-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex gap-4">
                        {/* Checkbox + Image */}
                        <div className="flex flex-col items-center gap-2">
                          {s.status === 'pending' && (
                            <button
                              onClick={() => toggleSelect(s.id)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selected.has(s.id)
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300 hover:border-purple-400'
                              }`}
                            >
                              {selected.has(s.id) && <Check className="w-3 h-3 text-white" />}
                            </button>
                          )}
                          {s.product_image ? (
                            <img
                              src={s.product_image}
                              alt={s.product_name}
                              className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-[#1a1a2e] line-clamp-2">
                              {s.product_name}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <ScoreBadge score={s.ai_score} />
                              <StatusBadge status={s.status} />
                            </div>
                          </div>

                          {s.cj_category && (
                            <p className="text-xs text-gray-400 mb-2">{s.cj_category}</p>
                          )}

                          {/* Pricing */}
                          <div className="flex items-center gap-3 text-sm mb-2">
                            <span className="text-gray-500">
                              CJ ${Number(s.cj_price).toFixed(2)}
                            </span>
                            <span className="text-gray-300">&rarr;</span>
                            <span className="font-semibold text-[#1a1a2e]">
                              ${Number(s.retail_price).toFixed(2)}
                            </span>
                            <span className={`font-semibold ${Number(s.margin_percent) >= 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                              {Number(s.margin_percent).toFixed(1)}%
                            </span>
                          </div>

                          {/* AI Indicators */}
                          <div className="flex gap-1.5 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.ai_season_ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              Season
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.ai_brand_fit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              Brand
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.ai_quality_ok ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              Quality
                            </span>
                            {s.variant_count > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500">
                                {s.variant_count} variants
                              </span>
                            )}
                          </div>

                          {/* AI Reasoning */}
                          <p className="text-xs text-gray-500 line-clamp-2">{s.ai_reasoning}</p>

                          {/* Error message */}
                          {s.error_message && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3" />
                              {s.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

      {/* Bottom action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">{selected.size}</span> product{selected.size !== 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={rejecting || approving}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject Selected
              </button>
              <button
                onClick={handleApprove}
                disabled={approving || rejecting}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve &amp; Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
