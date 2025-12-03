'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ButtonLoader } from '@/components/ui/loader';
import { useCheckoutStore, CheckoutAddress } from '@/lib/checkout-store';
import LocationSelector from '@/components/ui/location-selector';

interface AddressFormProps {
  onClose: () => void;
  onSave: (address: Partial<CheckoutAddress>) => void;
  isSaving?: boolean;
}

export default function AddressForm({ onClose, onSave, isSaving = false }: AddressFormProps) {
  const { newAddress, setNewAddress } = useCheckoutStore();

  // Track country and state codes separately for the selector
  const [countryCode, setCountryCode] = useState(newAddress.country === 'US' ? 'US' : '');
  const [stateCode, setStateCode] = useState('');

  const handleChange = (field: keyof CheckoutAddress, value: string | boolean) => {
    setNewAddress({ [field]: value });
  };

  const handleCountryChange = (code: string, name: string) => {
    setCountryCode(code);
    setStateCode('');
    // Update all fields at once
    setNewAddress({ country: name, state: '', city: '' });
  };

  const handleStateChange = (code: string, name: string) => {
    setStateCode(code);
    // Update state and reset city
    setNewAddress({ state: name, city: '' });
  };

  const handleCityChange = (name: string) => {
    setNewAddress({ city: name });
  };

  const isFormValid = newAddress.line1 && newAddress.city && newAddress.state && newAddress.zip && newAddress.country;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onSave(newAddress);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden border border-gray-200 rounded-lg bg-gray-50 p-6 space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">ADD NEW ADDRESS</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
          ADDRESS LABEL
        </label>
        <Input
          value={newAddress.label || ''}
          onChange={(e) => handleChange('label', e.target.value)}
          placeholder="e.g., Home, Office"
          className="text-xs h-10"
        />
      </div>

      {/* Location Selector */}
      <LocationSelector
        selectedCountry={countryCode}
        selectedState={stateCode}
        selectedCity={newAddress.city || ''}
        onCountryChange={handleCountryChange}
        onStateChange={handleStateChange}
        onCityChange={handleCityChange}
        required={true}
        variant="compact"
      />

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
          STREET ADDRESS *
        </label>
        <Input
          value={newAddress.line1 || ''}
          onChange={(e) => handleChange('line1', e.target.value)}
          placeholder="123 Main Street"
          className="text-xs h-10"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
          APARTMENT, SUITE, ETC. (OPTIONAL)
        </label>
        <Input
          value={newAddress.line2 || ''}
          onChange={(e) => handleChange('line2', e.target.value)}
          placeholder="Apartment or suite"
          className="text-xs h-10"
        />
      </div>



      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2 tracking-wide">
          ZIP CODE *
        </label>
        <Input
          value={newAddress.zip || ''}
          onChange={(e) => handleChange('zip', e.target.value)}
          placeholder="10001"
          className="text-xs h-10"
          required
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={newAddress.isDefault || false}
          onChange={(e) => handleChange('isDefault', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <label htmlFor="isDefault" className="text-xs text-gray-700">
          Set as default address
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={!isFormValid || isSaving}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white h-10 text-xs tracking-[0.15em] font-light rounded-none disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <ButtonLoader />
              <span>SAVING...</span>
            </>
          ) : (
            'SAVE ADDRESS'
          )}
        </Button>
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="flex-1 border-gray-300 text-gray-600 hover:bg-gray-50 h-10 text-xs tracking-[0.15em] font-light rounded-none"
        >
          CANCEL
        </Button>
      </div>
    </motion.form>
  );
}
