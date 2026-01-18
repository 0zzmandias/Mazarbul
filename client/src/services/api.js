import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Endereço do nosso Backend
});

// Interceptor: Antes de cada requisição, veja se tem token e anexe
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('@Mazarbul:token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Métodos auxiliares para Favoritos e Coleções
export const favoriteService = {
    toggle: (mediaId) => api.post('/favorites/toggle', { mediaId }),
};

export const collectionService = {
    create: (data) => api.post('/collections', data),
    addItem: (collectionId, mediaId) => api.post('/collections/add', { collectionId, mediaId }),
    removeItem: (collectionId, mediaId) => api.post('/collections/remove', { collectionId, mediaId }),
};

export default api;
