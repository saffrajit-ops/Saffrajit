'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ProfileSidebar } from '@/components/profile/ProfileSidebar';
import { Spinner } from '@/components/ui/spinner';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, hasHydrated, isLoading } = useAuthStore();

    useEffect(() => {
        if (hasHydrated && !isAuthenticated && !isLoading) {
            router.push('/login?redirect=/profile');
        }
    }, [isAuthenticated, hasHydrated, isLoading, router]);

    // Show loading while checking authentication
    if (!hasHydrated || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            {/* Main Content with Sidebar - Only affects content area */}
            <div className="bg-gray-50 min-h-screen">
                <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Sidebar */}
                        <aside className="lg:w-64 flex-shrink-0">
                            <div className="lg:sticky lg:top-24">
                                <ProfileSidebar />
                            </div>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1 min-w-0">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}
