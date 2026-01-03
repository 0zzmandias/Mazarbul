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

export default api;
