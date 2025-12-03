# Authentication API

## Overview
Complete authentication system with JWT tokens, role-based access control, and OAuth integration.

## Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`
**Authentication:** None required

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890" // Optional
}
```

#### Validation Rules
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `password`: Required, min 6 characters
- `phone`: Optional, valid phone format

#### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}

// 409 - User Already Exists
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### Login User
Authenticate user and get access tokens.

**Endpoint:** `POST /api/auth/login`
**Authentication:** None required

#### Request Body
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "profileImage": "https://...",
      "isActive": true
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Error Responses
```json
// 401 - Invalid Credentials
{
  "success": false,
  "message": "Invalid email or password"
}

// 403 - Account Inactive
{
  "success": false,
  "message": "Account is deactivated"
}
```

---

### Google OAuth Login
Login with Google account.

**Endpoint:** `POST /api/auth/google`
**Authentication:** None required

#### Request Body
```json
{
  "token": "google_id_token"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@gmail.com",
      "profileImage": "https://...",
      "provider": "google",
      "role": "user"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### Refresh Access Token
Get new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`
**Authentication:** None required

#### Request Body
```json
{
  "refreshToken": "refresh_token"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### Error Responses
```json
// 401 - Invalid Refresh Token
{
  "success": false,
  "message": "Invalid refresh token"
}
```

---

### Get Current User
Get authenticated user's profile.

**Endpoint:** `GET /api/auth/me`
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
      "addresses": [...],
      "preferences": {
        "newsletter": true,
        "smsAlerts": false
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

---

### Logout User
Logout user and invalidate refresh token.

**Endpoint:** `POST /api/auth/logout`
**Authentication:** Required (Bearer token)

#### Request Body
```json
{
  "refreshToken": "refresh_token"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Logout All Devices
Logout user from all devices by invalidating all refresh tokens.

**Endpoint:** `POST /api/auth/logout-all`
**Authentication:** Required (Bearer token)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out from all devices"
}
```

---

## Frontend Integration Examples

### React Authentication Hook
```javascript
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      return data.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message);
      }
      
      setUser(data.data.user);
      setAccessToken(data.data.accessToken);
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      
      return data.data;
    } catch (error) {
      throw error;
    }
  };

  // Auto-refresh token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAccessToken(data.data.accessToken);
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data.accessToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.data.user);
          setAccessToken(token);
        } else {
          // Try to refresh token
          await refreshToken();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const value = {
    user,
    accessToken,
    loading,
    login,
    logout,
    register,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### API Client with Auto Token Refresh
```javascript
class ApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add authorization header if token exists
    const accessToken = localStorage.getItem('accessToken');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && accessToken) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry original request with new token
          headers.Authorization = `Bearer ${newToken}`;
          return fetch(url, { ...options, headers });
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data.accessToken;
      }
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    
    return null;
  }
}

export const apiClient = new ApiClient();
```

## Token Management
- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens
- Store tokens securely (httpOnly cookies recommended for production)
- Implement auto-refresh logic for seamless user experience

## Security Best Practices
1. Always use HTTPS in production
2. Store tokens securely (avoid localStorage in production)
3. Implement proper CSRF protection
4. Validate all inputs on both client and server
5. Use secure password policies
6. Implement rate limiting on login attempts
