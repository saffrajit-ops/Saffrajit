'use client';

import { useState, useEffect } from 'react';
import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

interface LocationSelectorProps {
  selectedCountry: string;
  selectedState: string;
  selectedCity: string;
  onCountryChange: (countryCode: string, countryName: string) => void;
  onStateChange: (stateCode: string, stateName: string) => void;
  onCityChange: (cityName: string) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'compact'; // default for profile, compact for checkout
}

export default function LocationSelector({
  selectedCountry,
  selectedState,
  selectedCity,
  onCountryChange,
  onStateChange,
  onCityChange,
  required = false,
  disabled = false,
  variant = 'default'
}: LocationSelectorProps) {
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);

  // Load all countries on mount
  useEffect(() => {
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  // Load states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry);
      setStates(countryStates);
      
      // Reset state and city if country changes
      if (countryStates.length === 0) {
        setStates([]);
        setCities([]);
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  // Load cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const stateCities = City.getCitiesOfState(selectedCountry, selectedState);
      setCities(stateCities);
      
      if (stateCities.length === 0) {
        setCities([]);
      }
    } else {
      setCities([]);
    }
  }, [selectedCountry, selectedState]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    const country = countries.find(c => c.isoCode === countryCode);
    onCountryChange(countryCode, country?.name || '');
    // Reset state and city when country changes
    onStateChange('', '');
    onCityChange('');
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateCode = e.target.value;
    const state = states.find(s => s.isoCode === stateCode);
    onStateChange(stateCode, state?.name || '');
    // Reset city when state changes
    onCityChange('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    onCityChange(cityName);
  };

  // Styling based on variant
  const labelClass = variant === 'compact' 
    ? "block text-xs font-medium text-gray-700 mb-2 tracking-wide"
    : "block text-sm font-medium text-gray-700 mb-2";
  
  const selectClass = variant === 'compact'
    ? "w-full h-10 px-3 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
    : "w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed";

  const labelText = variant === 'compact' ? {
    country: 'COUNTRY',
    state: 'STATE',
    city: 'CITY'
  } : {
    country: 'Country',
    state: 'State',
    city: 'City'
  };

  return (
    <div className="space-y-4">
      {/* Country Selector */}
      <div>
        <label className={labelClass}>
          {labelText.country} {required && '*'}
        </label>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          required={required}
          disabled={disabled}
          className={selectClass}
        >
          <option value="">Select Country</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* State Selector */}
      <div>
        <label className={labelClass}>
          {labelText.state} {required && '*'}
        </label>
        <select
          value={selectedState}
          onChange={handleStateChange}
          required={required}
          disabled={disabled || !selectedCountry || states.length === 0}
          className={selectClass}
        >
          <option value="">
            {!selectedCountry ? 'Select country first' : states.length === 0 ? 'No states available' : 'Select State'}
          </option>
          {states.map((state) => (
            <option key={state.isoCode} value={state.isoCode}>
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Selector */}
      <div>
        <label className={labelClass}>
          {labelText.city} {required && '*'}
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          required={required}
          disabled={disabled || !selectedState || cities.length === 0}
          className={selectClass}
        >
          <option value="">
            {!selectedState ? 'Select state first' : cities.length === 0 ? 'No cities available' : 'Select City'}
          </option>
          {cities.map((city) => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
