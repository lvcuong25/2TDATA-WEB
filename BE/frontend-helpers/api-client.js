/**
 * 🌐 API Client for Multi-Site Architecture
 * Automatically handles domain-based site detection
 */

class ApiClient {
  constructor() {
    this.baseURL = this.getCurrentApiBase();
    this.currentSite = null;
  }

  /**
   * Get API base URL based on current domain
   */
  getCurrentApiBase() {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/api`;
  }

  /**
   * Get current domain info
   */
  getCurrentDomain() {
    return {
      hostname: window.location.hostname,
      host: window.location.host,
      port: window.location.port,
      protocol: window.location.protocol
    };
  }

  /**
   * Make API request without manually setting Host header
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // ❌ DO NOT set Host header - browser handles this automatically
      },
      ...options
    };

    });

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return data;
    } catch (error) {
      console.error('❌ API Request failed:', {
        url,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get current site information
   */
  async getCurrentSite() {
    try {
      const response = await this.request('/sites/current');
      this.currentSite = response.data;
      return this.currentSite;
    } catch (error) {
      console.error('Failed to get current site:', error);
      throw error;
    }
  }

  /**
   * Authentication methods
   */
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * User methods
   */
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/user?${queryString}` : '/user';
    return this.request(endpoint);
  }

  async createUser(userData) {
    return this.request('/user', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  /**
   * Service methods
   */
  async getServices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/service?${queryString}` : '/service';
    return this.request(endpoint);
  }

  async createService(serviceData) {
    return this.request('/service', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }

  /**
   * Set authentication token
   */
  setAuthToken(token) {
    this.authToken = token;
  }

  /**
   * Add auth header if token exists
   */
  getAuthHeaders() {
    return this.authToken ? {
      'Authorization': `Bearer ${this.authToken}`
    } : {};
  }

  /**
   * Make authenticated request
   */
  async authenticatedRequest(endpoint, options = {}) {
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        ...this.getAuthHeaders()
      }
    };

    return this.request(endpoint, authOptions);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for use in modules
export default apiClient;

// Also create global instance for direct script usage
if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
  window.apiClient = apiClient;
}

/**
 * 🎯 Usage Examples:
 * 
 * // Get current site info
 * const site = await apiClient.getCurrentSite();
 * * 
 * // Login
 * const authResponse = await apiClient.login({
 *   email: 'admin@techhub.2tdata.com',
 *   password: 'siteadmin123'
 * });
 * 
 * // Set token and make authenticated requests
 * apiClient.setAuthToken(authResponse.token);
 * const users = await apiClient.authenticatedRequest('/user');
 * 
 * // The client automatically uses correct domain:
 * // - http://localhost:3000/api/sites/current
 * // - http://techhub.localhost:3000/api/sites/current
 * // - http://finance.localhost:3000/api/sites/current
 */
