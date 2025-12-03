'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { userAPI } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Shield, Bell, Lock, Camera, Trash2, User } from 'lucide-react';
import Image from 'next/image';

export default function SettingsPage() {
    const { user, updateUser } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
    });
    const [notifications, setNotifications] = useState({
        orderUpdates: true,
        promotions: false,
        newsletter: false,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const response = await userAPI.getProfile();
            if (response.success && response.data?.user) {
                const userData = response.data.user;
                setUserData(userData);
                setProfileForm({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                });
            }
        } catch (error: any) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            const response = await userAPI.updateProfile({
                name: profileForm.name,
                phone: profileForm.phone,
            });

            if (response.success && response.data?.user) {
                updateUser(response.data.user);
                setUserData(response.data.user);
                toast.success('Profile updated successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        try {
            setIsUploadingImage(true);
            const response = await userAPI.uploadProfileImage(file);

            if (response.success && response.data?.profileImage) {
                // Update user data with new profile image
                const updatedUser = {
                    ...userData,
                    profileImage: response.data.profileImage
                };
                setUserData(updatedUser);
                updateUser(updatedUser);
                toast.success('Profile image updated successfully!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        } finally {
            setIsUploadingImage(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = async () => {
        try {
            setIsUploadingImage(true);
            const response = await userAPI.removeProfileImage();

            if (response.success) {
                // Update user data to remove profile image
                const updatedUser = {
                    ...userData,
                    profileImage: undefined
                };
                setUserData(updatedUser);
                updateUser(updatedUser);
                toast.success('Profile image removed successfully');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove image');
        } finally {
            setIsUploadingImage(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner className="w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600 mt-1">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* Profile Image */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Picture
                    </CardTitle>
                    <CardDescription>
                        Upload or change your profile picture
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        {/* Profile Image Display */}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                                {userData?.profileImage?.url ? (
                                    <Image
                                        src={userData.profileImage.url}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                        <User className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            {isUploadingImage && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                                    <Spinner className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Upload Controls */}
                        <div className="flex-1 space-y-3">
                            <div className="flex gap-2">
                                <Button
                                    onClick={triggerFileInput}
                                    disabled={isUploadingImage}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Camera className="w-4 h-4" />
                                    {userData?.profileImage?.url ? 'Change Photo' : 'Upload Photo'}
                                </Button>
                                {userData?.profileImage?.url && (
                                    <Button
                                        onClick={handleRemoveImage}
                                        disabled={isUploadingImage}
                                        variant="outline"
                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                JPG, PNG or GIF. Max size 5MB. Recommended: 400x400px
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Account Information
                    </CardTitle>
                    <CardDescription>
                        Update your personal information
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Full Name</label>
                        <Input
                            value={profileForm.name}
                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <Input
                            type="email"
                            value={profileForm.email}
                            disabled
                            className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Phone</label>
                        <Input
                            value={profileForm.phone}
                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                            placeholder="Enter your phone number"
                        />
                    </div>
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Notification Preferences
                    </CardTitle>
                    <CardDescription>
                        Choose what notifications you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Order Updates</p>
                            <p className="text-sm text-gray-600">
                                Get notified about your order status
                            </p>
                        </div>
                        <Switch
                            checked={notifications.orderUpdates}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, orderUpdates: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Promotions</p>
                            <p className="text-sm text-gray-600">
                                Receive special offers and discounts
                            </p>
                        </div>
                        <Switch
                            checked={notifications.promotions}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, promotions: checked })
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Newsletter</p>
                            <p className="text-sm text-gray-600">
                                Get our weekly newsletter
                            </p>
                        </div>
                        <Switch
                            checked={notifications.newsletter}
                            onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, newsletter: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Security */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Security
                    </CardTitle>
                    <CardDescription>
                        Manage your account security
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Password</p>
                            <p className="text-sm text-gray-600">
                                Last changed 30 days ago
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Change Password
                        </Button>
                    </div>
                    {/* <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600">
                                Add an extra layer of security
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Enable
                        </Button>
                    </div> */}
                </CardContent>
            </Card>

            {/* Account Actions */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Account Actions</CardTitle>
                    <CardDescription>
                        Manage your account
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Download Your Data</p>
                            <p className="text-sm text-gray-600">
                                Get a copy of your account data
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            Download
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-red-600">Delete Account</p>
                            <p className="text-sm text-gray-600">
                                Permanently delete your account
                            </p>
                        </div>
                        <Button variant="destructive" size="sm">
                            Delete
                        </Button>
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
}
