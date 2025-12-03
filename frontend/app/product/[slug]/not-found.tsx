import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-light text-gray-900 mb-6">404</h1>
        <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/skincare">
            <Button
              size="lg"
              className="bg-gray-900 hover:bg-gray-800 text-white px-10 h-12 rounded-none text-xs tracking-[0.15em] font-light"
            >
              VIEW ALL PRODUCTS
            </Button>
          </Link>
          <Link href="/">
            <Button
              size="lg"
              variant="outline"
              className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-10 h-12 rounded-none text-xs tracking-[0.15em] font-light"
            >
              GO HOME
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
