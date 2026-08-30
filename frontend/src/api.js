const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('192.')
);

const API_BASE_URL = isLocal
  ? `http://${window.location.hostname}:8000/api/v1`
  : 'https://electroshare-backend.onrender.com/api/v1';

export const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const savedToken = token || localStorage.getItem('token');
  if (savedToken) {
    headers['Authorization'] = `Bearer ${savedToken}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Something went wrong');
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${method} ${endpoint}:`, error);
    throw error;
  }
};
