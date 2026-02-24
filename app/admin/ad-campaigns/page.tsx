'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { TrendingUp, DollarSign, MousePointer, ShoppingCart, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CampaignRow {
  id: string;
  name: string;
  platform: string;
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  revenue: number;
  roas: number;
  status: 'active' | 'paused' | 'ended';
}

export default function AdCampaignsPage() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: events } = await supabase
        .from('mi_analytics_events')
        .select('event_type, metadata');

      const map = new Map<string, CampaignRow>();

      (events || []).forEach((event) => {
        const metadata = (event.metadata || {}) as Record<string, string | number>;
        const name = (metadata.campaign ||
          metadata.utm_campaign ||
          'Unattributed') as string;
        const platform = (metadata.source || metadata.utm_source || 'Unknown') as string;
        const key = `${name}::${platform}`;

        if (!map.has(key)) {
          map.set(key, {
            id: key,
            name,
            platform,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            spend: Number(metadata.spend || 0),
            revenue: Number(metadata.revenue || 0),
            roas: 0,
            status: 'active',
          });
        }

        const campaign = map.get(key)!;
        if (event.event_type === 'page_view') campaign.impressions += 1;
        if (event.event_type === 'product_view') campaign.clicks += 1;
        if (event.event_type === 'purchase') {
          campaign.revenue += Number(metadata.revenue || 0);
        }
      });

      const rows = Array.from(map.values()).map((campaign) => {
        const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0;
        const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
        return { ...campaign, ctr, roas };
      });

      setCampaigns(rows);
    };

    fetchCampaigns();
  }, [supabase]);

  const totalSpend = useMemo(() => campaigns.reduce((sum, c) => sum + c.spend, 0), [campaigns]);
  const totalRevenue = useMemo(
    () => campaigns.reduce((sum, c) => sum + c.revenue, 0),
    [campaigns]
  );
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const avgCtr =
    campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length : 0;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Ad Campaigns</h1>
          <button disabled className="px-4 py-2 bg-gold-500 text-[#1a1a2e] text-sm font-semibold rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed">
            <Plus className="w-4 h-4" />
            New Campaign (Coming Soon)
          </button>
        </div>
        <p className="text-sm text-gray-500">Track and optimize advertising performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-danger" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Spend</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">${totalSpend.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm font-medium text-gray-500">Revenue</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-gold-500" />
            </div>
            <span className="text-sm font-medium text-gray-500">ROAS</span>
          </div>
          <p className="text-3xl font-bold text-gold-500">{totalRoas.toFixed(2)}x</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-info/15 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-info" />
            </div>
            <span className="text-sm font-medium text-gray-500">Avg CTR</span>
          </div>
          <p className="text-3xl font-bold text-[#1a1a2e]">{avgCtr.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Spend
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  ROAS
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 px-4 text-sm text-gray-500">
                    No campaign data yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <p className="text-sm font-semibold text-[#1a1a2e]">{campaign.name}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {campaign.platform}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] font-variant-tabular">
                    {campaign.impressions.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] font-variant-tabular">
                    {campaign.clicks.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-700 font-variant-tabular">
                    {campaign.ctr.toFixed(2)}%
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-danger font-semibold font-variant-tabular">
                    ${campaign.spend.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-success font-semibold font-variant-tabular">
                    ${campaign.revenue.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        campaign.roas >= 3
                          ? 'text-success'
                          : campaign.roas >= 2
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {campaign.roas.toFixed(2)}x
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={campaign.status} />
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
