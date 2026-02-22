'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  CreditCard,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  variant_id: string | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  email: string | null;
  shipping_address: any;
  payment_status: 'pending' | 'paid' | 'expired';
  fulfillment_status: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  discount_code: string | null;
  total: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  cj_order_id: string | null;
  cj_order_number: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  carrier: string | null;
  cj_status: string | null;
  notes: string | null;
  mi_order_items: OrderItem[];
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  summary: {
    total: number;
    paid: number;
    pending: number;
    unfulfilled: number;
    processing: number;
    shipped: number;
  };
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const PaymentBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
  };
  const icons: Record<string, any> = {
    paid: CheckCircle,
    pending: Clock,
    expired: XCircle,
  };
  const Icon = icons[status] || AlertCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const FulfillmentBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    unfulfilled: 'bg-gray-50 text-gray-600 border-gray-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<OrdersResponse['summary']>({
    total: 0,
    paid: 0,
    pending: 0,
    unfulfilled: 0,
    processing: 0,
    shipped: 0,
  });
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [fulfillLoading, setFulfillLoading] = useState<Record<string, boolean>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (['paid', 'pending', 'expired'].includes(activeFilter)) {
        params.set('status', activeFilter);
      }
      if (['unfulfilled', 'processing', 'shipped', 'delivered'].includes(activeFilter)) {
        params.set('fulfillment', activeFilter);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const res = await fetch(`/api/admin/orders?${params}`);
      const data: OrdersResponse = await res.json();

      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
      setSummary(
        data.summary || {
          total: 0,
          paid: 0,
          pending: 0,
          unfulfilled: 0,
          processing: 0,
          shipped: 0,
        }
      );
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalOrders / limit);

  const filterTabs = [
    { key: 'all', label: 'All Orders', count: summary.total },
    { key: 'paid', label: 'Paid', count: summary.paid },
    { key: 'pending', label: 'Pending', count: summary.pending },
    { key: 'unfulfilled', label: 'Unfulfilled', count: summary.unfulfilled },
    { key: 'processing', label: 'Processing', count: summary.processing },
    { key: 'shipped', label: 'Shipped', count: summary.shipped },
  ];

  const parseShippingAddress = (address: any) => {
    if (!address) return null;
    try {
      return typeof address === 'string' ? JSON.parse(address) : address;
    } catch {
      return null;
    }
  };

  const handleFulfillRetry = async (orderId: string) => {
    setFulfillLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch('/api/admin/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || data?.result?.message || 'Fulfillment failed');
      }
      toast.success('CJ fulfillment started');
      await fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to retry fulfillment');
    } finally {
      setFulfillLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleCheckTracking = async (orderId: string) => {
    setTrackingLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch('/api/admin/orders/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || 'Tracking check failed');
      }
      toast.success('Tracking updated');
      await fetchOrders();
    } catch (error: any) {
      toast.error(error?.message || 'Unable to check tracking');
    } finally {
      setTrackingLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-[#1a1a2e]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and fulfill customer orders</p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c8a45e]/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#c8a45e]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{summary.total}</p>
              <p className="text-xs text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{summary.paid}</p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{summary.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1a1a2e]">{summary.unfulfilled}</p>
              <p className="text-xs text-gray-500">Needs Fulfillment</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-wrap gap-1">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveFilter(tab.key);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeFilter === tab.key
                      ? 'bg-[#c8a45e]/10 text-[#c8a45e] border border-[#c8a45e]/30'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search order # or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/30 focus:border-[#c8a45e]"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-200 rounded w-24" />
                  <div className="h-4 bg-gray-200 rounded w-40" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#1a1a2e] mb-2">No orders yet</h3>
              <p className="text-sm text-gray-500">
                Your first sale is coming! Orders will appear here once customers check out.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#f3f4f6] text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8" />
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Total
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Fulfillment
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const address = parseShippingAddress(order.shipping_address);

                  return (
                    <>
                      <tr
                        key={order.id}
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        className="hover:bg-gray-50/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {order.mi_order_items?.[0]?.image_url ? (
                              <img
                                src={order.mi_order_items[0].image_url}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#1a1a2e] truncate max-w-[200px]">
                                {order.mi_order_items?.[0]?.name || 'Unknown item'}
                              </p>
                              {(order.mi_order_items?.length || 0) > 1 && (
                                <p className="text-xs text-gray-400">
                                  +{order.mi_order_items.length - 1} more item
                                  {order.mi_order_items.length - 1 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-600">
                            {order.order_number}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-sm ${
                              order.email ? 'text-gray-700' : 'text-gray-400 italic'
                            }`}
                          >
                            {order.email || 'No email'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-[#1a1a2e]">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PaymentBadge status={order.payment_status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <FulfillmentBadge status={order.fulfillment_status} />
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr key={`${order.id}-detail`} className="bg-gray-50/70">
                          <td colSpan={8} className="px-6 py-5">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              <div className="lg:col-span-2">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                  Line Items
                                </h4>
                                <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                                  {order.mi_order_items?.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3">
                                      {item.image_url ? (
                                        <img
                                          src={item.image_url}
                                          alt={item.name}
                                          className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                        />
                                      ) : (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                          <Package className="w-5 h-5 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#1a1a2e] truncate">
                                          {item.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {formatCurrency(item.unit_price)} × {item.quantity}
                                        </p>
                                      </div>
                                      <p className="text-sm font-medium text-[#1a1a2e]">
                                        {formatCurrency(item.total)}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-3 bg-white rounded-lg border border-gray-200 p-3 space-y-1.5">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span className="text-gray-700">
                                      {formatCurrency(order.subtotal)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="text-gray-700">
                                      {formatCurrency(order.shipping_cost)}
                                    </span>
                                  </div>
                                  {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">
                                        Discount{' '}
                                        {order.discount_code && (
                                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                            {order.discount_code}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-emerald-600">
                                        -{formatCurrency(order.discount_amount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-1.5">
                                    <span className="text-[#1a1a2e]">Total</span>
                                    <span className="text-[#1a1a2e]">
                                      {formatCurrency(order.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Order Number
                                  </h4>
                                  <p className="text-xs font-mono text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 break-all">
                                    {order.order_number}
                                  </p>
                                </div>

                                {address && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                      Shipping Address
                                    </h4>
                                    <div className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 space-y-0.5">
                                      {address.line1 && <p>{address.line1}</p>}
                                      {address.line2 && <p>{address.line2}</p>}
                                      <p>
                                        {[address.city, address.state, address.postal_code]
                                          .filter(Boolean)
                                          .join(', ')}
                                      </p>
                                      {address.country && <p>{address.country}</p>}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Stripe
                                  </h4>
                                  <div className="space-y-2">
                                    {order.stripe_payment_intent_id && (
                                      <a
                                        href={`https://dashboard.stripe.com/test/payments/${order.stripe_payment_intent_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(event) => event.stopPropagation()}
                                        className="flex items-center gap-1.5 text-xs text-[#c8a45e] hover:text-[#a8883e] transition-colors"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        View Payment
                                      </a>
                                    )}
                                    {order.stripe_session_id && (
                                      <p className="text-[10px] font-mono text-gray-400 break-all">
                                        Session: {order.stripe_session_id}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {(order.tracking_number || order.tracking_url || order.carrier) && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                      Tracking
                                    </h4>
                                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 space-y-1">
                                      {order.tracking_number && (
                                        <p className="font-mono text-xs text-gray-700">
                                          {order.tracking_number}
                                        </p>
                                      )}
                                      {order.carrier && (
                                        <p className="text-xs text-gray-500">{order.carrier}</p>
                                      )}
                                      {order.tracking_url && (
                                        <a
                                          href={order.tracking_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(event) => event.stopPropagation()}
                                          className="inline-flex items-center gap-1.5 text-xs text-[#c8a45e] hover:text-[#a8883e] transition-colors"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          View tracking
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {(order.cj_order_id || order.cj_status || order.cj_order_number) && (
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                      CJ Details
                                    </h4>
                                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 space-y-1">
                                      {order.cj_order_id && (
                                        <p className="font-mono">CJ Order ID: {order.cj_order_id}</p>
                                      )}
                                      {order.cj_order_number && (
                                        <p className="font-mono">
                                          CJ Order #: {order.cj_order_number}
                                        </p>
                                      )}
                                      {order.cj_status && <p>Status: {order.cj_status}</p>}
                                    </div>
                                  </div>
                                )}

                                {order.notes && (
                                  <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg px-3 py-2">
                                    {order.notes}
                                  </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  {order.fulfillment_status === 'unfulfilled' &&
                                    !order.cj_order_id &&
                                    order.payment_status === 'paid' &&
                                    order.notes?.includes('manual fulfillment') && (
                                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200">
                                        <Package className="w-3.5 h-3.5" />
                                        Manual Fulfillment Required
                                      </span>
                                    )}
                                  {order.fulfillment_status === 'processing' &&
                                    !order.cj_order_id && (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleFulfillRetry(order.id);
                                        }}
                                        disabled={Boolean(fulfillLoading[order.id])}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-[#c8a45e] hover:bg-[#b89345] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <RefreshCw
                                          className={`w-3.5 h-3.5 ${
                                            fulfillLoading[order.id] ? 'animate-spin' : ''
                                          }`}
                                        />
                                        Retry CJ Fulfillment
                                      </button>
                                    )}
                                  {order.cj_order_number && (
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleCheckTracking(order.id);
                                      }}
                                      disabled={Boolean(trackingLoading[order.id])}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#1a1a2e] bg-white border border-[#c8a45e]/40 hover:border-[#c8a45e] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <RefreshCw
                                        className={`w-3.5 h-3.5 ${
                                          trackingLoading[order.id] ? 'animate-spin' : ''
                                        }`}
                                      />
                                      Check Tracking
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalOrders)} of{' '}
              {totalOrders}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
