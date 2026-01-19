import api from "./api";

const topicService = {
    // Listar tópicos de um clube
    getClubTopics: async (clubId) => {
        const response = await api.get(`/topics?clubId=${clubId}`);
        return response.data;
    },

    // Pegar detalhes de um tópico (com respostas)
    getTopicDetails: async (topicId) => {
        const response = await api.get(`/topics/${topicId}`);
        return response.data;
    },

    // Criar um novo tópico
    createTopic: async (topicData) => {
        // topicData deve conter: { title, content, clubId }
        const response = await api.post("/topics", topicData);
        return response.data;
    },

    // Responder a um tópico
    replyToTopic: async (topicId, content) => {
        const response = await api.post(`/topics/${topicId}/replies`, { content });
        return response.data;
    }
};

export default topicService;
