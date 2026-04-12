import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('ef_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Response: handle 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response ? .status === 401) {
            localStorage.removeItem('ef_token');
            localStorage.removeItem('ef_user');
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

// ─── API helpers ───────────────────────────────────────────────────────────────
export const authApi = {
    login: (data) => api.post('/api/auth/login', data),
    register: (data) => api.post('/api/auth/register', data),
    me: () => api.get('/api/auth/me'),
    changePassword: (data) => api.patch('/api/auth/change-password', data),
};

export const eventsApi = {
    list: (params) => api.get('/api/events', { params }),
    get: (id) => api.get(`/api/events/${id}`),
    create: (data) => api.post('/api/events', data),
    update: (id, d) => api.put(`/api/events/${id}`, d),
    delete: (id) => api.delete(`/api/events/${id}`),
    getRegs: (id) => api.get(`/api/events/${id}/registrations`),
    markAttendance: (eId, rId, attended) => api.patch(`/api/events/${eId}/attendance/${rId}`, { attended }),
};

export const registrationsApi = {
    create: (data) => api.post('/api/registrations', data),
    my: () => api.get('/api/registrations/my'),
    all: () => api.get('/api/registrations/all'),
    cancel: (id) => api.delete(`/api/registrations/${id}`),
};

export const usersApi = {
    updateProfile: (data) => api.put('/api/users/profile', data),
    all: () => api.get('/api/users'),
    pendingAdmins: () => api.get('/api/users/pending-admins'),
    approve: (id) => api.patch(`/api/users/${id}/approve`),
    reject: (id) => api.delete(`/api/users/${id}/reject`),
    dashboardStats: () => api.get('/api/users/dashboard-stats'),
};

export const notificationsApi = {
    list: () => api.get('/api/notifications'),
    readAll: () => api.patch('/api/notifications/read-all'),
    read: (id) => api.patch(`/api/notifications/${id}/read`),
};

export const schoolsApi = {
    list: () => api.get('/api/schools'),
    create: (data) => api.post('/api/schools', data),
    addDept: (id, data) => api.post(`/api/schools/${id}/departments`, data),
    removeDept: (deptId) => api.delete(`/api/schools/departments/${deptId}`),
};

export const leaderboardApi = {
    list: () => api.get('/api/leaderboard'),
    upsert: (data) => api.post('/api/leaderboard', data),
};

export const paymentApi = {
    createOrder: (data) => api.post('/api/payment/create-order', data),
    verify: (data) => api.post('/api/payment/verify', data),
};

export default api;