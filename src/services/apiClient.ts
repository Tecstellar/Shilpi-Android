// API CLIENT FOR REACT NATIVE EXPO
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.22.14.80:4000/api/v1';
const REQUEST_TIMEOUT_MS = 15000;

async function request(method: 'GET' | 'POST' | 'PATCH', endpoint: string, body?: any) {
  const token = await AsyncStorage.getItem('@shilpi_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        data?.error?.message ||
        data?.message ||
        `Server returned status ${res.status}`;
      const err: any = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return { data, status: res.status };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please check your backend server and network.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  get(endpoint: string) {
    return request('GET', endpoint);
  },

  post(endpoint: string, body: any) {
    return request('POST', endpoint, body);
  },

  patch(endpoint: string, body: any) {
    return request('PATCH', endpoint, body);
  },
};
