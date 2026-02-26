import './globals.css';
import type { Metadata } from 'next';
import { Playfair_Display, DM_Sans } from 'next/font/google';
import Script from 'next/script';
import MetaPixel from '@/components/MetaPixel';
import { CartProvider } from '@/components/providers/CartProvider';
import { WishlistProvider } from '@/components/providers/WishlistProvider';
import { ToastProvider } from '@/components/storefront/ToastProvider';
import { ShoppingAssistantWrapper } from '@/components/storefront/ShoppingAssistantWrapper';
import { AbortErrorSuppressor } from '@/components/system/AbortErrorSuppressor';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CategoriesProvider } from '@/components/providers/CategoriesProvider';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mooreitems.com'),
  title: 'MooreItems.com - More Items, Moore Value',
  description: 'Discover curated products across fashion, home, beauty, electronics and more at unbeatable prices. Free shipping on orders over $50.',
  keywords: 'online shopping, e-commerce, fashion, home goods, electronics, beauty products',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'MooreItems.com - More Items, Moore Value',
    description: 'Discover curated products at unbeatable prices. Free shipping on orders over $50.',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body className="font-sans antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-23H54T894J"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-23H54T894J');
          `}
        </Script>
        <MetaPixel />
        <ToastProvider>
          <AuthProvider>
            <CategoriesProvider>
              <CartProvider>
                <WishlistProvider>
                  <AbortErrorSuppressor />
                  {children}
                  <ShoppingAssistantWrapper />
                </WishlistProvider>
              </CartProvider>
            </CategoriesProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
