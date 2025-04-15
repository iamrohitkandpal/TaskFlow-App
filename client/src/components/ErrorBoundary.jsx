import React, { Component } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isReportingError: false,
      reportSuccess: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Save error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to server if online
    if (navigator.onLine) {
      this.reportErrorToServer(error, errorInfo);
    }
    
    // Check for common request errors
    if (error?.isAxiosError) {
      // Handle network errors specially
      if (!error.response) {
        this.setState({ 
          isNetworkError: true,
          errorMessage: "Network error. Please check your connection."
        });
      } else if (error.response.status === 401) {
        // Auth errors
        this.setState({ 
          isAuthError: true,
          errorMessage: "Your session has expired. Please log in again."
        });
        
        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    }
  }
  
  reportErrorToServer = async (error, errorInfo) => {
    try {
      this.setState({ isReportingError: true });
      
      await axios.post(`${API_BASE_URL}/error-report`, {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: errorInfo,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
      
      this.setState({ reportSuccess: true });
    } catch (err) {
      console.error('Failed to report error to server:', err);
    } finally {
      this.setState({ isReportingError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-semibold text-center text-gray-900">Application Error</h3>
            
            {this.state.isNetworkError ? (
              <div>
                <p className="mt-2 text-center text-gray-600">Unable to connect to the server.</p>
                <p className="mt-1 text-sm text-center text-gray-500">Please check your internet connection and try again.</p>
              </div>
            ) : this.state.isAuthError ? (
              <div>
                <p className="mt-2 text-center text-gray-600">Your session has expired.</p>
                <p className="mt-1 text-sm text-center text-gray-500">Redirecting to login page...</p>
              </div>
            ) : (
              <p className="mt-2 text-center text-gray-600">
                {this.state.errorMessage || "The application has encountered an unexpected error."}
              </p>
            )}
            
            {/* Error reporting status */}
            {this.state.isReportingError && (
              <p className="mt-2 text-sm text-center text-blue-500">
                Reporting issue to our team...
              </p>
            )}
            
            {this.state.reportSuccess && (
              <p className="mt-2 text-sm text-center text-green-500">
                Error report sent. Our team has been notified.
              </p>
            )}
            
            <div className="mt-6 flex space-x-4 justify-center">
              <button
                className="px-4 py-2 bg-gray-200 rounded text-gray-700 hover:bg-gray-300 transition"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </button>
              
              <button
                className="px-4 py-2 bg-blue-500 rounded text-white hover:bg-blue-600 transition"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;