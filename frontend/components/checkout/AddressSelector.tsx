'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCheckoutStore, CheckoutAddress } from '@/lib/checkout-store';
import { Skeleton } from '@/components/ui/skeleton';
import AddressForm from './AddressForm';

interface AddressSelectorProps {
  addresses: CheckoutAddress[];
  isLoading: boolean;
  onAddAddress: (address: Partial<CheckoutAddress>) => Promise<void>;
  isSavingAddress?: boolean;
}

export default function AddressSelector({
  addresses,
  isLoading,
  onAddAddress,
  isSavingAddress = false
}: AddressSelectorProps) {
  const { selectedAddressId, showAddressForm, setSelectedAddressId, setShowAddressForm, resetNewAddress } = useCheckoutStore();

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
  };

  const handleAddressSubmit = async (address: Partial<CheckoutAddress>) => {
    try {
      await onAddAddress(address);
      setShowAddressForm(false);
      resetNewAddress();
    } catch (error: any) {
      console.error('Error saving address:', error);
      // Error is already logged in handleAddAddress, don't re-throw
      // The form will stay open so user can fix and retry
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Addresses */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <motion.button
              key={address._id}
              type="button"
              onClick={() => handleSelectAddress(address._id || '')}
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              className={`w-full text-left p-4 border rounded-lg transition-all ${
                selectedAddressId === address._id
                  ? 'border-gray-900 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedAddressId === address._id
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedAddressId === address._id && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-gray-900">{address.label}</p>
                    {address.isDefault && (
                      <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded">
                        DEFAULT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{address.line1}</p>
                  {address.line2 && (
                    <p className="text-xs text-gray-600">{address.line2}</p>
                  )}
                  <p className="text-xs text-gray-600">
                    {address.city}, {address.state} {address.zip}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{address.country}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Add Address Form */}
      <AnimatePresence mode="wait">
        {showAddressForm ? (
          <AddressForm
            key="form"
            onClose={() => {
              setShowAddressForm(false);
              resetNewAddress();
            }}
            onSave={handleAddressSubmit}
            isSaving={isSavingAddress}
          />
        ) : (
          <motion.button
            key="button"
            type="button"
            onClick={() => setShowAddressForm(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm text-gray-700 font-light"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            ADD NEW ADDRESS
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
