import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Add auth token and refresh if needed
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('accessToken');
    const tokenExp = localStorage.getItem('tokenExp');

    if (token) {
      // Check if token expires in < 60 seconds
      if (tokenExp && parseInt(tokenExp, 10) - Date.now() < 60000) {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken
            });
            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);

            // Decode and store new expiration
            const payload = JSON.parse(atob(accessToken.split('.')[1]));
            localStorage.setItem('tokenExp', (payload.exp * 1000).toString());

            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

