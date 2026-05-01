import axios from 'axios';

const API_URL = `http://${window.location.hostname}:5000/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auto-logout on 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload(); 
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/users/register', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    changePassword: (data) => api.post('/auth/change-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data)
};

export const userAPI = {
    getAll: () => api.get('/users/all'),
};

export const studentAPI = {
    getAll: () => api.get('/students'),
    create: (data) => api.post('/students', data),
    delete: (id) => api.delete(`/students/${id}`),
};

export const attendanceAPI = {
    getAll: () => api.get('/attendance'),
    mark: (data) => api.post('/attendance', data),
};

export const materialAPI = {
    getByClass: (classId) => api.get(`/materials/classes/${classId}`),
    create: (data) => api.post('/materials', data),
    upload: (formData) => {
        const token = localStorage.getItem('token');

        return axios.post(`${API_URL}/materials/upload`, formData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },
    getViewUrl: (materialId, token) => `${API_URL}/materials/${materialId}/view?token=${encodeURIComponent(token)}`,
    getDownloadUrl: (materialId, token) => `${API_URL}/materials/${materialId}/download?token=${encodeURIComponent(token)}`,
};

export const classAPI = {
    getAll: () => api.get('/classes'),
    getById: (id) => api.get(`/classes/${id}`),
    getStudents: (classId) => api.get(`/classes/${classId}/students`),
    create: (data) => api.post('/classes', data),
    update: (id, data) => api.put(`/classes/${id}`, data),
    delete: (id) => api.delete(`/classes/${id}`),
    getTeachers: () => api.get('/classes/teachers'),
    getBranches: () => api.get('/classes/branches'),
    getCourses: () => api.get('/classes/courses'),
    assignTeacher: (id, data) => api.put(`/classes/${id}/assign-teacher`, data),
    enrollStudents: (classId, data) => api.post(`/classes/${classId}/enroll`, data)
};

export const scheduleAPI = {
    getAll: () => api.get('/schedules'),
    create: (data) => api.post('/schedules', data),
    update: (id, data) => api.put(`/schedules/${id}`, data),
    delete: (id) => api.delete(`/schedules/${id}`),
};
export const homeworkAPI = {
    getAll: () => api.get(`/homework`),
    getByClass: (classId) => api.get(`/homework/classes/${classId}`),
    getById: (homeworkId) => api.get(`/homework/${homeworkId}`),
    create: (classId, formData) => {
        const token = localStorage.getItem('token');
        return axios.post(`${API_URL}/homework/classes/${classId}`, formData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },
    update: (homeworkId, formData) => {
        const token = localStorage.getItem('token');
        return axios.put(`${API_URL}/homework/${homeworkId}`, formData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },
    submit: (homeworkId, formData) => {
        const token = localStorage.getItem('token');
        return axios.post(`${API_URL}/homework/${homeworkId}/submit`, formData, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },
    grade: (homeworkId, submissionId, data) => api.put(`/homework/${homeworkId}/grade/${submissionId}`, data),
};

export const progressAPI = {
    getMyProgress: () => api.get('/progress/me'),
};

export default api;
