const TOKEN_KEY = 'linkshield_jwt';
const CACHED_USER_KEY = 'linkshield_user_cache';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  async register(email, password, name) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async oauthLogin(provider, email, name, avatar) {
    const res = await fetch('/api/auth/oauth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, email, name, avatar })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `${provider} authentication failed`);
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
    return data.user;
  },

  async getCurrentUser() {
    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders()
      });
      if (!res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(CACHED_USER_KEY);
        return null;
      }
      const data = await res.json();
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(data.user));
      return data.user;
    } catch {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders()
      });
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CACHED_USER_KEY);
    }
  },

  // Real-Time Scanning
  async scanUrl(url, userId) {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ url, userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Scan failed');
    return data;
  },

  // Scan History
  async getScans({ userId, q, risk } = {}) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (q) params.append('q', q);
    if (risk) params.append('risk', risk);

    const res = await fetch(`/api/scans?${params.toString()}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch history');
    return data.scans || [];
  },

  async deleteScan(scanId) {
    const res = await fetch(`/api/scans/${scanId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete scan');
    return data;
  },

  async clearScans(userId) {
    const res = await fetch('/api/scans/clear', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to clear scans');
    return data;
  },

  // Threat Intel Feed
  async getThreats() {
    const res = await fetch('/api/threats', {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch threats');
    return data.threats || [];
  },

  // Dashboard Telemetry
  async getStats(userId) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);

    const res = await fetch(`/api/stats?${params.toString()}`, {
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch statistics');
    return data;
  }
};
