const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  // Profiles
  getProfiles: () => request<any[]>('/profiles'),
  createProfile: (data: any) => request<any>('/profiles', { method: 'POST', body: JSON.stringify(data) }),

  // Pet
  petPet: (profileId: string) => request<any>(`/profiles/${profileId}/pet`, { method: 'POST' }),

  // Food
  getFood: (profileId: string, date?: string) =>
    request<any[]>(`/profiles/${profileId}/food${date ? `?date=${date}` : ''}`),
  addFood: (profileId: string, data: any) =>
    request<any>(`/profiles/${profileId}/food`, { method: 'POST', body: JSON.stringify(data) }),
  deleteFood: (id: string) => request<any>(`/food/${id}`, { method: 'DELETE' }),

  // Exercise
  getExercise: (profileId: string, date?: string) =>
    request<any[]>(`/profiles/${profileId}/exercise${date ? `?date=${date}` : ''}`),
  addExercise: (profileId: string, data: any) =>
    request<any>(`/profiles/${profileId}/exercise`, { method: 'POST', body: JSON.stringify(data) }),
  deleteExercise: (id: string) => request<any>(`/exercise/${id}`, { method: 'DELETE' }),

  // Summary
  getSummary: (profileId: string, date?: string) =>
    request<any>(`/profiles/${profileId}/summary${date ? `?date=${date}` : ''}`),
};
