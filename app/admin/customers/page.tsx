'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Mail, Phone, MapPin, Calendar, ShoppingCart, Users, UserPlus } from 'lucide-react';

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orderCount: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  joinedAt: string;
}

interface LeadRow {
  id: string;
  email: string;
  source: string;
  addedAt: string | null;
  abandonedCarts: number;
}

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'leads'>('customers');
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/customers');
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch {
        // Keep default empty state
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers?tab=leads');
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []);
      setLeadsLoaded(true);
    } catch {
      // Keep default empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leads' && !leadsLoaded) {
      fetchLeads();
    }
  }, [activeTab, leadsLoaded, fetchLeads]);

  const totalLtv = useMemo(
    () => customers.reduce((sum, customer) => sum + customer.totalSpent, 0),
    [customers]
  );

  const activeThisMonth = customers.filter((c) => c.status === 'active').length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Customers</h1>
        <p className="text-sm text-gray-500">Manage customer accounts and relationships</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Paying Customers</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{customers.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active This Month</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{activeThisMonth}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total LTV</span>
          </div>
          <p className="text-3xl font-bold text-gold-500">
            ${totalLtv.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setActiveTab('customers')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'customers'
              ? 'bg-[#c8a45e]/10 text-[#c8a45e] border border-[#c8a45e]/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          Customers
          {customers.length > 0 && (
            <span className="ml-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {customers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'leads'
              ? 'bg-[#c8a45e]/10 text-[#c8a45e] border border-[#c8a45e]/30'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Leads
          {leads.length > 0 && (
            <span className="ml-1 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {leads.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'customers' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                      No paying customers yet
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-gold-500">
                              {customer.name.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1a1a2e]">{customer.name}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[200px]">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span>{customer.location}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] font-variant-tabular">
                        {customer.orderCount}
                      </td>
                      <td className="py-4 px-4 text-right text-sm font-semibold text-gold-500 font-variant-tabular">
                        ${customer.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(customer.joinedAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Date Added
                  </th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Abandoned Carts
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && !leadsLoaded ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-400">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                      No leads yet
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {lead.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          lead.source === 'abandoned-cart'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {lead.source === 'abandoned-cart' ? 'Abandoned Cart' :
                           lead.source === 'popup' ? 'Popup' :
                           lead.source === 'footer' ? 'Footer' :
                           lead.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {lead.addedAt
                          ? new Date(lead.addedAt).toLocaleDateString()
                          : '\u2014'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {lead.abandonedCarts > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <ShoppingCart className="w-3 h-3" />
                            {lead.abandonedCarts}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">0</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
