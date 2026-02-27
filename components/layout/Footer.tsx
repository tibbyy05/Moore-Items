'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaInstagram, FaFacebookF, FaTiktok, FaLinkedin } from 'react-icons/fa';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCategories } from '@/components/providers/CategoriesProvider';

export function Footer() {
  const { categories } = useCategories();
  const serviceLinks = [
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Returns & Refunds', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Track Order', href: '/order/confirmation' },
  ];
  const companyLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  const shopLinks = useMemo(
    () => categories.map((category) => ({ label: category.name, href: `/category/${category.slug}` })),
    [categories]
  );

  return (
    <footer className="bg-[#0f1629] text-warm-50">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="text-center lg:text-left">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/TransparentLogo.png"
                alt="MooreItems"
                width={560}
                height={190}
                className="w-auto h-24"
                priority
              />
            </Link>
            <p className="text-base text-warm-100/80 mb-6 leading-relaxed">
              Curated finds for modern living.
            </p>
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <a
                href="https://www.instagram.com/mooreitems"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold-500 hover:text-gold-500 transition-all"
                aria-label="Instagram"
              >
                <FaInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61588518505684"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold-500 hover:text-gold-500 transition-all"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@mooreitems"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold-500 hover:text-gold-500 transition-all"
                aria-label="TikTok"
              >
                <FaTiktok className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/mooreitems"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:border-gold-500 hover:text-gold-500 transition-all"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <h3 className="text-sm font-bold text-warm-50 uppercase tracking-wider mb-4">
              Shop
            </h3>
            <ul className="space-y-3">
              {shopLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <h3 className="text-sm font-bold text-warm-50 uppercase tracking-wider mb-4">
              Customer Service
            </h3>
            <ul className="space-y-3">
              {serviceLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:block">
            <h3 className="text-sm font-bold text-warm-50 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:hidden">
            <Accordion type="multiple" className="space-y-2">
              <AccordionItem value="shop">
                <AccordionTrigger className="text-warm-50 text-sm font-semibold">
                  Shop
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3">
                    {shopLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="service">
                <AccordionTrigger className="text-warm-50 text-sm font-semibold">
                  Customer Service
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3">
                    {serviceLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="company">
                <AccordionTrigger className="text-warm-50 text-sm font-semibold">
                  Company
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-3">
                    {companyLinks.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="text-sm text-warm-100/80 hover:text-gold-500 transition-colors"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col items-center text-center gap-4">
          <p className="text-sm text-warm-100/70">© 2026 MooreItems. All rights reserved.</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {['Visa', 'Mastercard', 'Amex', 'Apple Pay'].map((label) => (
              <span
                key={label}
                className="px-3 py-1 rounded-md border border-white/15 text-xs text-warm-100/70 bg-white/5"
              >
                {label}
              </span>
            ))}
          </div>
          <span className="text-xs text-warm-500 mt-4">
            Powered by{' '}
            <a
              href="https://ai-genda.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warm-500 hover:text-gold-500 transition-colors"
            >
              Ai-genda.com
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
