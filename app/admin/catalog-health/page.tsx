'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  Wrench,
  XCircle,
} from 'lucide-react';

interface CheckItem {
  id: string;
  name: string;
}

interface CheckResult {
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  found: number;
  autoFixed: number;
  items: CheckItem[];
}

interface HealthData {
  timestamp: string;
  total_active_products: number;
  checks: CheckResult[];
  summary: {
    total_issues: number;
    auto_fixed: number;
    needs_attention: number;
    health_score: number;
  };
}

const SEVERITY_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const SEVERITY_STYLES: Record<string, { badge: string; border: string }> = {
  HIGH: {
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-200',
  },
  MEDIUM: {
    badge: 'bg-amber-100 text-amber-700',
    border: 'border-amber-200',
  },
  LOW: {
    badge: 'bg-gray-100 text-gray-600',
    border: 'border-gray-200',
  },
};

function scoreColor(score: number) {
  if (score >= 95) return 'text-success';
  if (score >= 80) return 'text-warning';
  return 'text-danger';
}

function scoreBg(score: number) {
  if (score >= 95) return 'bg-success/10';
  if (score >= 80) return 'bg-warning/10';
  return 'bg-danger/10';
}

export default function CatalogHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/catalog/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Health check failed');
      const result = await res.json();
      setData(result);
      setExpanded(new Set());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const sortedChecks = data
    ? [...data.checks].sort(
        (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
      )
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Catalog Health</h1>
          {data && (
            <p className="text-sm text-gray-500 mt-1">
              Last checked: {new Date(data.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Run Health Check
            </>
          )}
        </button>
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-2">No health check data yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Run a health check to scan your catalog for issues.
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && !data && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Scanning catalog...</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Health Score */}
            <div
              className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative`}
            >
              <div
                className={`absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center ${scoreBg(data.summary.health_score)}`}
              >
                <Shield className={`w-5 h-5 ${scoreColor(data.summary.health_score)}`} />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2">Health Score</p>
              <p
                className={`text-[28px] font-bold mb-1 font-variant-tabular ${scoreColor(data.summary.health_score)}`}
              >
                {data.summary.health_score}%
              </p>
              <p className="text-xs text-gray-400">
                {data.total_active_products} active products
              </p>
            </div>

            {/* Total Issues */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative">
              <div className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center bg-red-50">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2">Total Issues</p>
              <p className="text-[28px] font-bold text-[#1a1a2e] font-variant-tabular">
                {data.summary.total_issues}
              </p>
            </div>

            {/* Auto-Fixed */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative">
              <div className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center bg-green-50">
                <Wrench className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2">Auto-Fixed</p>
              <p className="text-[28px] font-bold text-[#1a1a2e] font-variant-tabular">
                {data.summary.auto_fixed}
              </p>
            </div>

            {/* Needs Attention */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative">
              <div className="absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2">Needs Attention</p>
              <p className="text-[28px] font-bold text-[#1a1a2e] font-variant-tabular">
                {data.summary.needs_attention}
              </p>
            </div>
          </div>

          {/* Check cards */}
          <div className="space-y-3">
            {sortedChecks.map((check) => {
              const isOpen = expanded.has(check.name);
              const styles = SEVERITY_STYLES[check.severity] || SEVERITY_STYLES.LOW;
              const hasItems = check.items.length > 0;

              return (
                <div
                  key={check.name}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => hasItems && toggle(check.name)}
                    className={`w-full flex items-center gap-3 p-4 text-left ${hasItems ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'} transition-colors`}
                  >
                    {/* Expand icon */}
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {hasItems ? (
                        isOpen ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )
                      ) : (
                        <CheckCircle className="w-4 h-4 text-success" />
                      )}
                    </div>

                    {/* Severity badge */}
                    <span
                      className={`px-2 py-0.5 text-xs font-bold rounded ${styles.badge}`}
                    >
                      {check.severity}
                    </span>

                    {/* Check name */}
                    <span className="text-sm font-semibold text-[#1a1a2e] flex-1">
                      {check.name}
                    </span>

                    {/* Counts */}
                    <div className="flex items-center gap-3 text-sm">
                      {check.found > 0 ? (
                        <span className="text-red-600 font-semibold">{check.found} found</span>
                      ) : (
                        <span className="text-success font-semibold">All clear</span>
                      )}
                      {check.autoFixed > 0 && (
                        <span className="text-green-600 font-medium">
                          {check.autoFixed} fixed
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded items list */}
                  {isOpen && hasItems && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 max-h-64 overflow-y-auto">
                      <div className="space-y-1.5">
                        {check.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <span className="text-gray-700 truncate mr-4">{item.name}</span>
                            <Link
                              href={`/admin/products/edit/${item.id}`}
                              className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-700 font-medium flex-shrink-0 text-xs"
                            >
                              Edit
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
