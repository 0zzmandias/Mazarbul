import api from "./api";

const topicService = {
    // Criar novo tópico
    createTopic: async (topicData) => {
        // topicData deve conter { title, content, clubId }
        const response = await api.post("/topics", topicData);
        return response.data;
    },

    // Listar tópicos de um clube
    getTopicsByClub: async (clubId) => {
        const response = await api.get(`/topics?clubId=${clubId}`);
        return response.data;
    },

    // Obter detalhes de um tópico (incluindo respostas)
    getTopicDetails: async (topicId) => {
        const response = await api.get(`/topics/${topicId}`);
        return response.data;
    },

    // Responder a um tópico
    replyToTopic: async (topicId, content) => {
        const response = await api.post(`/topics/${topicId}/reply`, { content });
        return response.data;
    },

    // Fixar/Desfixar tópico (Moderação)
    togglePin: async (topicId) => {
        const response = await api.patch(`/topics/${topicId}/pin`);
        return response.data;
    },

    // Trancar/Destrancar tópico (Moderação)
    toggleLock: async (topicId) => {
        const response = await api.patch(`/topics/${topicId}/lock`);
        return response.data;
    }
};

export default topicService;
