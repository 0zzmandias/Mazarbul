import api from "./api";

const clubService = {
    // Listar todos os clubes públicos
    getAllClubs: async () => {
        const response = await api.get("/clubs");
        return response.data;
    },

    // Obter detalhes de um clube específico
    getClubDetails: async (id) => {
        const response = await api.get(`/clubs/${id}`);
        return response.data;
    },

    // Criar um novo clube
    createClub: async (clubData) => {
        // clubData deve ser { name, description, isPublic, coverUrl }
        const response = await api.post("/clubs", clubData);
        return response.data;
    },

    // Entrar em um clube
    joinClub: async (id) => {
        const response = await api.post(`/clubs/${id}/join`);
        return response.data;
    },

    // Sair de um clube
    leaveClub: async (id) => {
        const response = await api.post(`/clubs/${id}/leave`);
        return response.data;
    }
};

export default clubService;
