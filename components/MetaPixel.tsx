'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const STORAGE_KEY = 'mi_cookie_consent';

export default function MetaPixel() {
  const [consentGiven, setConsentGiven] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === 'accepted') {
      setConsentGiven(true);
      return;
    }

    function onAccept() {
      setConsentGiven(true);
    }

    window.addEventListener('mi:cookie-consent-accepted', onAccept);
    return () => window.removeEventListener('mi:cookie-consent-accepted', onAccept);
  }, []);

  if (!META_PIXEL_ID) return null;

  return (
    <>
      {/* fbq stub — sets up the queue, no network call */}
      <Script id="meta-pixel-stub" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[]}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>

      {/* Actual fbevents.js — only loaded after consent */}
      {consentGiven && (
        <Script
          id="meta-pixel-sdk"
          src="https://connect.facebook.net/en_US/fbevents.js"
          strategy="afterInteractive"
        />
      )}

      {consentGiven && (
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      )}
    </>
  );
}
