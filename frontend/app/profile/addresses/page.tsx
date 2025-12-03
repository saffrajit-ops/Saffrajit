'use client';

import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import LocationSelector from '@/components/ui/location-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Address {
  _id: string;
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: false,
  });
  
  // Track country and state codes for the selector
  const [countryCode, setCountryCode] = useState('US');
  const [stateCode, setStateCode] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getProfile();
      if (response.success && response.data?.user?.addresses) {
        setAddresses(response.data.user.addresses);
      }
    } catch (error: any) {
      console.error('Failed to load addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountryChange = (code: string, name: string) => {
    setCountryCode(code);
    setAddressForm(prev => ({ ...prev, country: name, state: '', city: '' }));
    setStateCode('');
  };

  const handleStateChange = (code: string, name: string) => {
    setStateCode(code);
    setAddressForm(prev => ({ ...prev, state: name, city: '' }));
  };

  const handleCityChange = (name: string) => {
    setAddressForm(prev => ({ ...prev, city: name }));
  };

  const handleAddAddress = async () => {
    // Debug: Log form data
    console.log('Address Form Data:', addressForm);
    console.log('Validation:', {
      line1: !!addressForm.line1,
      city: !!addressForm.city,
      state: !!addressForm.state,
      zip: !!addressForm.zip,
      country: !!addressForm.country
    });

    if (!addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.zip || !addressForm.country) {
      const missingFields = [];
      if (!addressForm.line1) missingFields.push('Street Address');
      if (!addressForm.city) missingFields.push('City');
      if (!addressForm.state) missingFields.push('State');
      if (!addressForm.zip) missingFields.push('ZIP Code');
      if (!addressForm.country) missingFields.push('Country');
      
      toast.error(`Please fill in: ${missingFields.join(', ')}`);
      return;
    }

    try {
      setIsSaving(true);
      const response = await userAPI.addAddress(addressForm);

      if (response.success && response.data?.user) {
        setAddresses(response.data.user.addresses || []);
        setIsAddingAddress(false);
        setAddressForm({
          label: '',
          line1: '',
          line2: '',
          city: '',
          state: '',
          zip: '',
          country: 'United States',
          isDefault: false,
        });
        setCountryCode('US');
        setStateCode('');
        toast.success('Address added successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      setIsSaving(true);
      const response = await userAPI.deleteAddress(addressId);

      if (response.success && response.data?.user) {
        setAddresses(response.data.user.addresses || []);
        toast.success('Address deleted successfully');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      setIsSaving(true);
      const response = await userAPI.updateAddress(addressId, { isDefault: true });

      if (response.success && response.data?.user) {
        setAddresses(response.data.user.addresses || []);
        toast.success('Default address updated');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update address');
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your shipping addresses ({addresses.length} addresses)
          </p>
        </div>
        <Button onClick={() => setIsAddingAddress(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add New Address
        </Button>
      </div>

      {/* Addresses Grid */}
      {addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No addresses yet</h3>
          <p className="text-sm text-gray-600 mb-6">
            Add your first shipping address to make checkout faster
          </p>
          <Button onClick={() => setIsAddingAddress(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <Card
              key={address._id}
              className={`p-6 ${address.isDefault ? 'border-2 border-gray-900' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {address.label || 'Address'}
                  </span>
                </div>
                {address.isDefault && (
                  <Badge variant="default" className="bg-gray-900">
                    Default
                  </Badge>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} {address.zip}
                </p>
                <p>{address.country}</p>
              </div>

              <div className="flex gap-2">
                {!address.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefaultAddress(address._id)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Set Default
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAddress(address._id)}
                  disabled={isSaving}
                  className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Address Dialog */}
      <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
            <DialogDescription>
              Add a new shipping address to your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Label (e.g., Home, Work)</label>
              <Input
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder="Home"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Address Line 1 *</label>
              <Input
                value={addressForm.line1}
                onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                placeholder="Street address"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Address Line 2</label>
              <Input
                value={addressForm.line2}
                onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                placeholder="Apartment, suite, etc. (optional)"
              />
            </div>

            {/* Location Selector */}
            <LocationSelector
              selectedCountry={countryCode}
              selectedState={stateCode}
              selectedCity={addressForm.city}
              onCountryChange={handleCountryChange}
              onStateChange={handleStateChange}
              onCityChange={handleCityChange}
              required={true}
            />

            <div>
              <label className="text-sm font-medium mb-2 block">ZIP Code *</label>
              <Input
                value={addressForm.zip}
                onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })}
                placeholder="ZIP Code"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressForm.isDefault}
                onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
                Set as default address
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingAddress(false);
                setAddressForm({
                  label: '',
                  line1: '',
                  line2: '',
                  city: '',
                  state: '',
                  zip: '',
                  country: 'United States',
                  isDefault: false,
                });
                setCountryCode('US');
                setStateCode('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleAddAddress} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
