'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { userAPI } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { User, Mail, Phone, Calendar, MapPin, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, updateUser, hasHydrated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
  });

  // Fetch user data
  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!hasHydrated || authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, authLoading, hasHydrated, router]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      if (response.success && response.data?.user) {
        const userData = response.data.user;
        setUserData(userData);
        setProfileForm({
          name: userData.name || '',
          phone: userData.phone || '',
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setIsSaving(true);
      const response = await userAPI.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
      });

      if (response.success && response.data?.user) {
        updateUser(response.data.user);
        setUserData(response.data.user);
        setIsEditingProfile(false);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking auth or waiting for hydration
  if (!hasHydrated || authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const displayUser = userData || user;
  const nameParts = displayUser?.name?.split(' ') || [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Personal Information</CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Manage your account details
              </CardDescription>
            </div>
            {!isEditingProfile && (
              <Button
                onClick={() => setIsEditingProfile(true)}
                disabled={isSaving}
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-md"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Full Name
                </label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={displayUser?.email || ''}
                  disabled
                  className="border-gray-300 bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Phone Number
                </label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleProfileSave}
                  disabled={isSaving}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileForm({
                      name: displayUser?.name || '',
                      phone: displayUser?.phone || '',
                    });
                  }}
                  disabled={isSaving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm text-gray-900">{displayUser?.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm text-gray-900 break-all">{displayUser?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm text-gray-900">{displayUser?.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1">Member Since</p>
                  <p className="text-sm text-gray-900">
                    {displayUser?.createdAt
                      ? new Date(displayUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/profile/orders">
          <Card className="border-gray-200 hover:border-gray-400 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Orders</h3>
                  <p className="text-sm text-gray-600">View and track your orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile/addresses">
          <Card className="border-gray-200 hover:border-gray-400 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">My Addresses</h3>
                  <p className="text-sm text-gray-600">Manage shipping addresses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
