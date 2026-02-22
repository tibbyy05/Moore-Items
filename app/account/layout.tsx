'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { Package, Heart, User, MapPin, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const accountNav = [
  { label: 'Dashboard', href: '/account', icon: User },
  { label: 'Order History', href: '/account/orders', icon: Package },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin },
  { label: 'Settings', href: '/account/settings', icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-white min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <h1 className="text-3xl font-playfair font-semibold text-warm-900 mb-8">My Account</h1>
          <div className="flex flex-col md:flex-row gap-8">
            <nav className="md:w-64 flex-shrink-0">
              <div className="bg-warm-50 rounded-xl p-2 space-y-1">
                {accountNav.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition',
                        isActive
                          ? 'bg-white text-warm-900 shadow-sm'
                          : 'text-warm-600 hover:text-warm-900 hover:bg-white/50'
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-warm-600 hover:text-red-600 hover:bg-white/50 transition w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </nav>
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
