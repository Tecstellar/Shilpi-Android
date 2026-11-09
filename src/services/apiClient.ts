// API CLIENT FOR REACT NATIVE EXPO
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000/api/v1';

export const apiClient = {
  async get(endpoint: string) {
    const token = await AsyncStorage.getItem('@shilpi_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    return { data: await res.json(), status: res.status };
  },

  async post(endpoint: string, body: any) {
    const token = await AsyncStorage.getItem('@shilpi_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return { data: await res.json(), status: res.status };
  },

  async patch(endpoint: string, body: any) {
    const token = await AsyncStorage.getItem('@shilpi_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    return { data: await res.json(), status: res.status };
  },
};
