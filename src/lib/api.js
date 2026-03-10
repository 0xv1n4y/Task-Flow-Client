const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}, getToken) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const taskAPI = {
  getAll:  (getToken)            => request('/tasks', {}, getToken),
  create:  (body, getToken)      => request('/tasks', { method: 'POST', body: JSON.stringify(body) }, getToken),
  update:  (id, body, getToken)  => request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }, getToken),
  remove:  (id, getToken)        => request(`/tasks/${id}`, { method: 'DELETE' }, getToken),
  toggle:  (id, getToken)        => request(`/tasks/${id}/toggle`, { method: 'PATCH' }, getToken),
};

export const analyticsAPI = {
  summary:   (getToken)                       => request('/analytics/summary', {}, getToken),
  heatmap:   (days = 365, getToken)           => request(`/analytics/heatmap?days=${days}`, {}, getToken),
  breakdown: (view, date, getToken)            => request(`/analytics/breakdown?view=${view}&date=${date}`, {}, getToken),
};
