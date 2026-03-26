import axios from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:8000/api');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getRelationshipChoices = () => api.get('/choices/relationships/');
export const getAssetTypeChoices = () => api.get('/choices/asset-types/');

export const createCase = (data) => api.post('/cases/', data);
export const getCase = (id) => api.get(`/cases/${id}/`);
export const getCases = () => api.get('/cases/');
export const calculateInheritance = (caseId) => api.get(`/cases/${caseId}/calculate/`);

export const createHeir = (data) => api.post('/heirs/', data);
export const deleteHeir = (id) => api.delete(`/heirs/${id}/`);

export const createAsset = (data) => api.post('/assets/', data);
export const deleteAsset = (id) => api.delete(`/assets/${id}/`);

export default api;
