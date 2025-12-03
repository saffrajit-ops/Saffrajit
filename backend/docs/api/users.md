# Users API

## Overview
User profile management, address handling, and account preferences for authenticated users.

## Profile Management

### Get User Profile
Retrieve current user's profile information.

**Endpoint:** `GET /api/users/profile`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "user",
      "profileImage": "https://...",
      "isActive": true,
      "provider": "local",
      "addresses": [
        {
          "_id": "address_id",
          "label": "Home",
          "line1": "123 Main St",
          "line2": "Apt 4B",
          "city": "New York",
          "state": "NY",
          "zip": "10001",
          "country": "US",
          "isDefault": true
        }
      ],
      "preferences": {
        "newsletter": true,
        "smsAlerts": false,
        "orderUpdates": true
      },
      "stats": {
        "totalOrders": 5,
        "totalSpent": 459.95,
        "avgOrderValue": 91.99,
        "loyaltyPoints": 150
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### Update User Profile
Update user's profile information.

**Endpoint:** `PUT /api/users/profile`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "name": "John Updated",           // Optional: 2-50 characters
  "phone": "+1987654321",          // Optional: valid phone format
  "preferences": {                 // Optional: user preferences
    "newsletter": false,
    "smsAlerts": true,
    "orderUpdates": true
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      // ... updated user object
    }
  }
}
```

---

### Upload Profile Image
Upload and set user's profile image.

**Endpoint:** `POST /api/users/profile/image`
**Authentication:** Required (Bearer token)
**Content-Type:** `multipart/form-data`

#### Request Body (Form Data)
```javascript
{
  image: File  // Required: Image file (jpg, png, webp), max 5MB, min 100x100px
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Profile image updated successfully",
  "data": {
    "profileImage": "https://cdn.canagold.com/users/profile_image.jpg"
  }
}
```

---

### Change Password
Change user's password.

**Endpoint:** `PUT /api/users/profile/change-password`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "currentPassword": "oldpassword123",  // Required
  "newPassword": "newpassword123"       // Required: min 6 characters
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

## Address Management

### Add Address
Add a new address to user's profile.

**Endpoint:** `POST /api/users/addresses`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "label": "Home",                  // Required: Home, Work, Other
  "line1": "123 Main St",          // Required: street address
  "line2": "Apt 4B",               // Optional: apartment, suite, etc.
  "city": "New York",              // Required
  "state": "NY",                   // Required: state/province
  "zip": "10001",                  // Required: postal code
  "country": "US",                 // Required: ISO country code
  "isDefault": true                // Optional: set as default address
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Address added successfully",
  "data": {
    "address": {
      "_id": "address_id",
      "label": "Home",
      "line1": "123 Main St",
      "line2": "Apt 4B",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

### Update Address
Update an existing address.

**Endpoint:** `PUT /api/users/addresses/{addressId}`
**Authentication:** Required (Bearer token)

#### Request Body
Same as Add Address (all fields optional)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "address": {
      // ... updated address object
    }
  }
}
```

---

### Delete Address
Remove an address from user's profile.

**Endpoint:** `DELETE /api/users/addresses/{addressId}`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

#### Error Response
```json
// 400 - Cannot Delete Default Address
{
  "success": false,
  "message": "Cannot delete default address. Set another address as default first."
}
```

## Frontend Integration Examples

### React User Profile Hook
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken } = useAuth();

  const fetchProfile = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data.user);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data.user);
        return data.data.user;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (imageFile) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await fetch('/api/users/profile/image', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProfile(prev => ({
          ...prev,
          profileImage: data.data.profileImage
        }));
        return data.data.profileImage;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return true;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessToken]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadProfileImage,
    changePassword,
    refreshProfile: fetchProfile
  };
};
```

### Address Management Hook
```javascript
export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken } = useAuth();

  const addAddress = async (addressData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(addressData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAddresses(prev => [...prev, data.data.address]);
        return data.data.address;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAddress = async (addressId, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAddresses(prev => 
          prev.map(addr => 
            addr._id === addressId ? data.data.address : addr
          )
        );
        return data.data.address;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/users/addresses/${addressId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAddresses(prev => prev.filter(addr => addr._id !== addressId));
        return true;
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    addresses,
    loading,
    error,
    addAddress,
    updateAddress,
    deleteAddress
  };
};
```
