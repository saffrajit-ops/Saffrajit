import axios from 'axios';
import { useAuthStore } from '@/lib/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://canagold-backend.onrender.com/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Only redirect to login if:
    // 1. It's a 401 error
    // 2. User is currently authenticated (has a token)
    // 3. Not already on the login page
    if (error.response?.status === 401) {
      const token = useAuthStore.getState().token;
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      // Only logout and redirect if user was authenticated and not on login/register pages
      if (token && !currentPath.includes('/login') && !currentPath.includes('/register')) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      // Return error in a consistent format instead of throwing
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
        error: error.response?.data || error
      };
    }
  },

  register: async (name: string, email: string, password: string, phone?: string) => {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
      phone,
    });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  googleAuth: async (token: string) => {
    const response = await apiClient.post('/auth/google', { token });
    return response.data;
  },
};

// User API functions
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: { name?: string; phone?: string }) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removeProfileImage: async () => {
    const response = await apiClient.delete('/users/profile/image');
    return response.data;
  },

  addAddress: async (address: {
    label?: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isDefault?: boolean;
  }) => {
    const response = await apiClient.post('/users/addresses', address);
    return response.data;
  },

  updateAddress: async (addressId: string, address: {
    label?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    isDefault?: boolean;
  }) => {
    const response = await apiClient.put(`/users/addresses/${addressId}`, address);
    return response.data;
  },

  deleteAddress: async (addressId: string) => {
    const response = await apiClient.delete(`/users/addresses/${addressId}`);
    return response.data;
  },
};

// Order API functions
export const orderAPI = {
  getUserOrders: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (orderId: string) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  cancelOrder: async (orderId: string, reason?: string) => {
    const response = await apiClient.put(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },

  requestReturn: async (
    orderId: string,
    reason: string,
    bankDetails?: {
      accountHolderName: string;
      accountNumber: string;
      routingNumber: string;
      bankName: string;
      accountType: 'checking' | 'savings';
    },
    items?: Array<{ product: string; quantity: number; reason: string }>
  ) => {
    const response = await apiClient.post(`/orders/${orderId}/return`, {
      reason,
      items,
      bankDetails
    });
    return response.data;
  },

  cancelReturnRequest: async (orderId: string) => {
    const response = await apiClient.delete(`/orders/${orderId}/return`);
    return response.data;
  },

  createReview: async (orderId: string, productId: string, rating: number, comment?: string, images?: Array<{ url: string; publicId: string }>) => {
    const response = await apiClient.post(`/reviews/orders/${orderId}/reviews`, {
      productId,
      rating,
      comment,
      images
    });
    return response.data;
  },

  getOrderReviews: async (orderId: string) => {
    const response = await apiClient.get(`/reviews/orders/${orderId}/reviews`);
    return response.data;
  },

  getProductReviews: async (productId: string, params?: { page?: number; limit?: number; sort?: string }) => {
    const response = await apiClient.get(`/reviews/products/${productId}/reviews`, { params });
    return response.data;
  },
};

// Product API functions
export const productAPI = {
  getAllProducts: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    featured?: boolean;
    search?: string;
  }) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductById: async (id: string) => {
    const response = await apiClient.get(`/products/id/${id}`);
    return response.data;
  },

  getProductBySlug: async (slug: string) => {
    const response = await apiClient.get(`/products/slug/${slug}`);
    return response.data;
  },

  getProductsByCategory: async (category: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    const response = await apiClient.get(`/products/category/${category}`, { params });
    return response.data;
  },

  getSimilarProducts: async (id: string, limit?: number) => {
    const response = await apiClient.get(`/products/${id}/similar`, { params: { limit } });
    return response.data;
  },

  searchProducts: async (query: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => {
    const response = await apiClient.get('/products/search', {
      params: { q: query, ...params }
    });
    return response.data;
  },

  getAllCategories: async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  },
};

// Review API functions
export const reviewAPI = {
  getReviewsByProduct: async (productId: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    rating?: number;
    verifiedOnly?: boolean;
  }) => {
    const response = await apiClient.get(`/reviews/product/${productId}`, { params });
    return response.data;
  },

  getReviewById: async (reviewId: string) => {
    const response = await apiClient.get(`/reviews/${reviewId}`);
    return response.data;
  },

  createReview: async (data: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }) => {
    const response = await apiClient.post('/reviews', data);
    return response.data;
  },

  updateReview: async (reviewId: string, data: {
    rating?: number;
    title?: string;
    comment?: string;
  }) => {
    const response = await apiClient.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  deleteReview: async (reviewId: string) => {
    const response = await apiClient.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  addComment: async (reviewId: string, data: {
    comment: string;
    parentCommentId?: string;
  }) => {
    const response = await apiClient.post(`/reviews/${reviewId}/comments`, data);
    return response.data;
  },

  deleteComment: async (reviewId: string, commentId: string) => {
    const response = await apiClient.delete(`/reviews/${reviewId}/comments/${commentId}`);
    return response.data;
  },
};

// Cart API functions
export const cartAPI = {
  getCart: async () => {
    const response = await apiClient.get('/cart');
    return response.data;
  },

  addToCart: async (productId: string, qty: number = 1, variant?: Record<string, any>) => {
    const response = await apiClient.post('/cart/add', {
      productId,
      qty,
      variant: variant || {},
    });
    return response.data;
  },

  updateCartItem: async (itemId: string, qty: number) => {
    const response = await apiClient.put(`/cart/items/${itemId}`, { qty });
    return response.data;
  },

  increaseQuantity: async (itemId: string, amount: number = 1) => {
    const response = await apiClient.put(`/cart/items/${itemId}/increase`, { amount });
    return response.data;
  },

  decreaseQuantity: async (itemId: string, amount: number = 1) => {
    const response = await apiClient.put(`/cart/items/${itemId}/decrease`, { amount });
    return response.data;
  },

  removeFromCart: async (itemId: string) => {
    const response = await apiClient.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await apiClient.delete('/cart/clear');
    return response.data;
  },

  getCartTotal: async () => {
    const response = await apiClient.get('/cart/total');
    return response.data;
  },
};

// Coupon API functions
export const couponAPI = {
  validateCoupon: async (code: string, subtotal: number, items?: Array<{ productId: string; qty: number }>) => {
    const response = await apiClient.post('/coupons/validate', {
      code,
      subtotal,
      items: items || [],
    });
    return response.data;
  },
};

// Payment API functions
export const paymentAPI = {
  createCheckoutSession: async (
    items: Array<{ productId: string; qty: number }>,
    couponCode?: string,
    shippingAddress?: {
      label?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }
  ) => {
    const response = await apiClient.post('/payments/checkout-session', {
      items,
      couponCode,
      shippingAddress,
    });
    return response.data;
  },

  createCODOrder: async (
    items: Array<{ productId: string; qty: number }>,
    couponCode?: string,
    shippingAddress?: {
      label?: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    }
  ) => {
    const response = await apiClient.post('/payments/cod-order', {
      items,
      couponCode,
      shippingAddress,
    });
    return response.data;
  },

  verifySession: async (sessionId: string) => {
    const response = await apiClient.post('/payments/verify-session', {
      sessionId,
    });
    return response.data;
  },
};

// Blog API functions
export const blogAPI = {
  getAllBlogPosts: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    category?: string;
    tags?: string[];
    published?: boolean;
  }) => {
    const response = await apiClient.get('/blog', { params });
    // Transform response to match frontend expectations
    if (response.data.success && response.data.data?.blogPosts) {
      return {
        ...response.data,
        data: {
          ...response.data.data,
          posts: response.data.data.blogPosts
        }
      };
    }
    return response.data;
  },

  getBlogBySlug: async (slug: string) => {
    const response = await apiClient.get(`/blog/slug/${slug}`);
    return response.data;
  },

  searchBlogPosts: async (query: string, params?: {
    page?: number;
    limit?: number;
    category?: string;
  }) => {
    const response = await apiClient.get('/blog/search', {
      params: { q: query, ...params }
    });
    // Transform response to match frontend expectations
    if (response.data.success && response.data.data?.blogPosts) {
      return {
        ...response.data,
        data: {
          ...response.data.data,
          posts: response.data.data.blogPosts
        }
      };
    }
    return response.data;
  },
};

export default apiClient;

