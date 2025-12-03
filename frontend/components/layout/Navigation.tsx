'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import CartDrawer from './CartDrawer';
import { AddToCartToast } from '@/components/ui/add-to-cart-toast';
import { productAPI } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toggleCart, getTotalItems } = useCartStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const totalItems = getTotalItems();

  // Prevent hydration mismatch by only showing cart count after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to view your bag', {
        description: 'You need to be logged in to access your shopping bag',
        action: {
          label: 'Login',
          onClick: () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`),
        },
      });
      return;
    }
    toggleCart();
  };

  const handleSearchClick = () => {
    if (pathname === '/products') {
      // If already on products page, just scroll to search
      const searchInput = document.querySelector('input[type="text"][placeholder="Search products..."]');
      if (searchInput) {
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (searchInput as HTMLInputElement).focus();
      }
    } else {
      // Navigate to products page with search flag
      router.push('/products?focus=search');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 50);

      // Show nav when scrolling up, hide when scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const [recentProducts, setRecentProducts] = useState<Array<{
    _id: string;
    title: string;
    slug: string;
    price: number;
    images: Array<{ url: string; alt?: string }>;
  }>>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch recent products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await productAPI.getAllProducts({
          limit: 4,
          sort: '-createdAt',
        });
        if (response.success && response.data?.products) {
          setRecentProducts(response.data.products);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const menuItems = {
    'PRODUCTS': {
      categories: ['Saffron', 'Shilajit', 'Wellness Bundles'],
      benefits: ['Energy & Stamina', 'Immunity & Health', 'Memory & Focus'],
    },
  };

  // Helper function to check if a link is active based on pathname
  const isActive = (href: string) => {
    // Special handling for home page and general sections
    if (href === '/') return pathname === '/';
    // Check if the current pathname starts with the link's href (e.g., /skincare/product-slug is active for /skincare)
    return pathname.startsWith(href) && href !== '/';
  };

  // Custom Link Component for reusability with active bar logic
  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`text-xs tracking-[0.2em] transition-opacity font-medium relative ${active ? 'text-black' : 'text-black/80 group-hover:text-black'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {children}
        <span className={`absolute left-0 bottom-0 w-0 h-[1px] bg-black transition-all duration-300 ease-out -mb-1 ${active ? 'w-full' : 'group-hover:w-full'}`}></span>
      </Link>
    );
  };

  // Custom Mobile Link Component for consistency
  const MobileNavLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={`block text-sm tracking-wider font-semibold pb-4 ${className} ${active ? 'text-black' : 'text-gray-700'}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        {children}
        {/* Simple visual indicator for active link in mobile menu, though not a "bar" here for cleaner mobile UX */}
        {active && <span className="ml-2 text-xs text-black/50">●</span>}
      </Link>
    );
  };


  return (
    <>
      <motion.header
        // Changed bg-white to bg-gray-50 for off-white
        className="fixed top-0 left-0 right-0 bg-gray-50 z-50 shadow-sm"
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          {/* Top Bar */}
          <div className="flex items-center justify-between h-24 ">
            <div className="flex items-center space-x-3 lg:space-x-8">
              <button
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              </button>

              {/* Mobile Logo - shown only on mobile */}
              <Link href="/" className="lg:hidden flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Saffrajit Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                />
                <h1 className="font-serif text-lg tracking-wider">
                  SAFFRAJIT
                </h1>
              </Link>

              {/* <div className="hidden lg:block text-xs tracking-wider text-gray-600">
                US | EN
              </div> */}
            </div>

            {/* Desktop Logo - centered, hidden on mobile */}
            <Link href="/" className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 flex-col items-center">
              <div className="flex items-center gap-3 mb-1">
                <Image
                  src="/logo.png"
                  alt="Saffrajit Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h1 className="font-serif text-2xl lg:text-3xl tracking-wider">
                  SAFFRAJIT
                </h1>
              </div>
              <p className="text-[10px] tracking-[0.3em] text-center text-gray-600">
                THE POWER OF PURITY
              </p>
            </Link>

            <div className="flex items-center space-x-4 lg:space-x-8">
              <button
                onClick={handleSearchClick}
                className="hover:opacity-60 transition-opacity"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              {!mounted ? (
                <div className="w-[18px] h-[18px] hidden lg:block" />
              ) : (
                <>
                  {isAuthenticated ? (
                    <Link href="/profile" className="hover:opacity-60 transition-opacity hidden lg:block">
                      <User size={18} strokeWidth={1.5} />
                    </Link>
                  ) : (
                    <Link href="/login" className="hover:opacity-60 transition-opacity hidden lg:block">
                      <User size={18} strokeWidth={1.5} />
                    </Link>
                  )}
                </>
              )}
              <button
                onClick={handleCartClick}
                className="hover:opacity-60 transition-opacity relative"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                {mounted && isAuthenticated && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-16 py-3">
            <div className="relative group">
              <NavLink href="/products">PRODUCTS</NavLink>
            </div>

            <div className="relative group">
              <NavLink href="/about">ABOUT</NavLink>
            </div>

            <div className="relative group">
              <NavLink href="/wellness-guide">WELLNESS GUIDE</NavLink>
            </div>

            <div className="relative group">
              <NavLink href="/blog">BLOG</NavLink>
            </div>
          </nav>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              // Changed bg-white to bg-gray-50 for off-white
              className="absolute top-full left-0 right-0 bg-gray-50 shadow-lg border-t border-gray-100"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onMouseEnter={() => setActiveMenu(activeMenu)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <div className="max-w-[1600px] mx-auto px-12 py-12">
                {activeMenu === 'PRODUCTS' && (
                  <div className="flex justify-center">
                    <div className="grid grid-cols-4 gap-8 max-w-5xl">
                      <div>
                        <h3 className="text-xs font-semibold tracking-wider mb-6 text-gray-900 uppercase">
                          Shop by Product
                        </h3>
                        {productsLoading ? (
                          <ul className="space-y-3 text-left">
                            {[1, 2, 3, 4].map((i) => (
                              <li key={i}>
                                <Skeleton className="h-4 w-full" />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="space-y-3 text-left">
                            {recentProducts.map((item) => (
                              <li key={item._id}>
                                <Link
                                  href={`/product/${item.slug}`}
                                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors block"
                                  onClick={() => setActiveMenu(null)}
                                >
                                  {item.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Featured Products */}
                      {productsLoading ? (
                        <>
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="group cursor-pointer">
                              <Skeleton className="h-[200px] w-[200px] mb-3" />
                              <Skeleton className="h-3 w-[200px] mb-1" />
                              <Skeleton className="h-4 w-[80px]" />
                            </div>
                          ))}
                        </>
                      ) : (
                        recentProducts.slice(0, 3).map((product) => (
                          <Link
                            key={product._id}
                            href={`/product/${product.slug}`}
                            className="group cursor-pointer"
                            onClick={() => setActiveMenu(null)}
                          >
                            <div className="relative h-[200px] w-[200px] overflow-hidden bg-gray-50 mb-3">
                              {product.images?.[0]?.url ? (
                                <Image
                                  src={product.images[0].url}
                                  alt={product.title}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 200px"
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-400 text-xs">No Image</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-900 mb-1 text-left line-clamp-2 w-[200px]">{product.title}</p>
                            <p className="text-sm font-medium text-left">${product.price.toFixed(2)}</p>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              // Changed bg-white to bg-gray-50 for off-white
              className="lg:hidden absolute top-24 left-0 right-0 bg-gray-50 shadow-lg max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="px-6 py-8 space-y-6">
                {/* Products Section */}
                <div className="border-b border-gray-200 pb-4">
                  <MobileNavLink href="/products">PRODUCTS</MobileNavLink>
                  {productsLoading ? (
                    <div className="pl-4 space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-3 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="pl-4 space-y-2">
                      {recentProducts.map((item) => (
                        <Link
                          key={item._id}
                          href={`/product/${item.slug}`}
                          className="block text-xs text-gray-600"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Links */}
                {mounted && (
                  <>
                    {isAuthenticated ? (
                      <MobileNavLink href="/profile" className="border-b border-gray-200">
                        MY PROFILE
                      </MobileNavLink>
                    ) : (
                      <MobileNavLink href="/login" className="border-b border-gray-200">
                        LOGIN
                      </MobileNavLink>
                    )}
                  </>
                )}
                <MobileNavLink href="/about" className="border-b border-gray-200">
                  ABOUT
                </MobileNavLink>
                <MobileNavLink href="/wellness-guide" className="border-b border-gray-200">
                  WELLNESS GUIDE
                </MobileNavLink>
                <MobileNavLink href="/blog">
                  BLOG
                </MobileNavLink>
                {/* Logout Button for authenticated users */}
                {isAuthenticated && (
                  <Button
                    onClick={() => {
                      toast('Are you sure you want to logout?', {
                        action: {
                          label: 'Logout',
                          onClick: async () => {
                            setIsLoggingOut(true);
                            setIsMobileMenuOpen(false);

                            // Simulate async logout with a small delay for better UX
                            await new Promise(resolve => setTimeout(resolve, 500));

                            logout();
                            router.push('/');

                            setIsLoggingOut(false);
                            toast.success('Logged out successfully');
                          },
                        },
                        cancel: {
                          label: 'Cancel',
                          onClick: () => { },
                        },
                      });
                    }}
                    disabled={isLoggingOut}
                    className="w-full mt-4 bg-black hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isLoggingOut ? 'LOGGING OUT...' : 'LOGOUT'}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Add to Cart Toast */}
      <AddToCartToast />

      {/* Spacer to prevent content jump */}
      <div className="h-24 lg:h-[144px]" />
    </>
  );
}