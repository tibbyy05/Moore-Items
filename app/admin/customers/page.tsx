'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Mail, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';

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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/admin/customers');
        if (!res.ok) throw new Error('Failed to fetch customers');
        const data = await res.json();
        setCustomers(data.customers || []);
      } catch {
        // Keep default empty state
      }
    };

    fetchCustomers();
  }, []);

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
            <span className="text-sm font-medium text-gray-500">Total Customers</span>
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
              {customers.map((customer) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
