'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Package, MapPin, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  section?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    label: 'Overview',
    href: '/profile/overview',
    icon: <User className="w-4 h-4" />,
    section: 'ACCOUNT',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <User className="w-4 h-4" />,
  },
  {
    label: 'Orders',
    href: '/profile/orders',
    icon: <Package className="w-4 h-4" />,
    section: 'ORDERS',
  },
  {
    label: 'Addresses',
    href: '/profile/addresses',
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    label: 'Settings',
    href: '/profile/settings',
    icon: <Settings className="w-4 h-4" />,
  },
];

export function ProfileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    toast('Are you sure you want to logout?', {
      action: {
        label: 'Logout',
        onClick: async () => {
          setIsLoggingOut(true);
          
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
        onClick: () => {},
      },
    });
  };

  const groupedItems = sidebarItems.reduce((acc, item) => {
    const section = item.section || 'OTHER';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold text-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">Account</p>
            <p className="text-sm text-gray-600">{user?.name || 'User'}</p>
          </div>
        </div>
      </div>

      <nav className="p-4">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            {section !== 'OTHER' && (
              <p className="text-xs font-semibold text-gray-500 mb-2 px-3">
                {section}
              </p>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </nav>
    </div>
  );
}
