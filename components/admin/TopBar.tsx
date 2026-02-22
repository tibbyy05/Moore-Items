'use client';

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Package, ShoppingCart, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifications = [
    { id: 1, icon: ShoppingCart, text: 'New order #MI-10247 placed', time: '2 min ago', unread: true },
    { id: 2, icon: Package, text: 'Low stock alert: Wireless Earbuds', time: '1 hour ago', unread: true },
    { id: 3, icon: AlertCircle, text: 'CJ API sync completed', time: '15 min ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search products, orders, customers..."
            className="w-full pl-10 pr-16 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-500 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-6">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-[#1a1a2e]">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => {
                    const Icon = notification.icon;
                    return (
                      <button
                        key={notification.id}
                        className={cn(
                          'w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0',
                          notification.unread && 'bg-gray-50'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-gold-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm text-[#1a1a2e]">{notification.text}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notification.time}</p>
                        </div>
                        {notification.unread && (
                          <div className="w-2 h-2 rounded-full bg-gold-500 flex-shrink-0 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <span className="text-[#1a1a2e] font-bold text-sm">DM</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[#1a1a2e]">Danny M.</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                <button className="w-full px-4 py-2 text-left text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors">
                  View Profile
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-[#1a1a2e] hover:bg-gray-50 transition-colors">
                  Settings
                </button>
                <div className="my-1 border-t border-gray-200" />
                <button className="w-full px-4 py-2 text-left text-sm text-danger hover:bg-gray-50 transition-colors">
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
