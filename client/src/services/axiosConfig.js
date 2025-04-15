import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL, AUTH_TOKEN_NAME } from '../config/constants';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - adds auth token if available
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem(AUTH_TOKEN_NAME);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for handling common errors
instance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Prevent infinite loops with retry flag
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token silently
        const response = await axios.post(`${API_BASE_URL}/users/refresh-token`, {}, {
          withCredentials: true
        });
        
        if (response.data?.token) {
          localStorage.setItem(AUTH_TOKEN_NAME, response.data.token);
          
          // Update the original request and retry
          originalRequest.headers['Authorization'] = `Bearer ${response.data.token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, logout user
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }
    
    // Continue with normal error handling
    const { response } = error;
    
    // Network errors (no response from server)
    if (!response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject({ message: 'Network error', originalError: error });
    }
    
    // Handle different error status codes
    switch (response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        const authError = response.data?.message || 'Your session has expired';
        toast.error(authError);
        
        // Clear any stale tokens before logout
        localStorage.removeItem(AUTH_TOKEN_NAME);
        setTimeout(() => {
          store.dispatch(logout());
          window.location.href = '/login'; // Force navigation to login page
        }, 1000);
        break;
        
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
        
      case 404:
        toast.error('Resource not found.');
        break;
        
      case 422:
        // Validation errors
        const validationErrors = response.data?.errors || response.data?.message;
        if (typeof validationErrors === 'string') {
          toast.error(validationErrors);
        } else {
          toast.error('Please check the form for errors.');
        }
        break;
        
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Our team has been notified.');
        break;
        
      default:
        toast.error(response.data?.message || 'Something went wrong.');
    }
    
    return Promise.reject(response.data || error);
  }
);

export default instance;