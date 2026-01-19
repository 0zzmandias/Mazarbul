import api from "./api";

const clubService = {
    // Criar novo clube
    createClub: async (clubData) => {
        const response = await api.post("/clubs", clubData);
        return response.data;
    },

    // Listar todos os clubes (CORRIGIDO O NOME PARA getAllClubs)
    getAllClubs: async () => {
        const response = await api.get("/clubs");
        return response.data;
    },

    // Obter detalhes de um clube
    getClubDetails: async (id) => {
        const response = await api.get(`/clubs/${id}`);
        return response.data;
    },

    // Atualizar clube
    updateClub: async (id, clubData) => {
        const response = await api.put(`/clubs/${id}`, clubData);
        return response.data;
    },

    // Entrar no clube
    joinClub: async (id) => {
        const response = await api.post(`/clubs/${id}/join`);
        return response.data;
    },

    // Sair do clube
    leaveClub: async (id) => {
        const response = await api.post(`/clubs/${id}/leave`);
        return response.data;
    }
};

export default clubService;
