import Link from 'next/link';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/custom-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Image
          src="/TransparentLogo.png"
          alt="MooreItems"
          width={420}
          height={140}
          className="w-auto h-20 mx-auto mb-6"
        />
        <h1 className="text-3xl font-playfair font-semibold text-warm-900 mb-3">
          Oops! This page doesn&apos;t exist
        </h1>
        <p className="text-warm-600 mb-8">
          Let&apos;s get you back to something beautiful.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CustomButton variant="primary" asChild>
            <Link href="/">Back to Home</Link>
          </CustomButton>
          <CustomButton variant="secondary" asChild>
            <Link href="/category/womens-fashion">Browse Categories</Link>
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
