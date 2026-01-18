import CollectionService from '../services/collection.service.js';

/**
 * Endpoint para criar uma nova coleção.
 */
export const createCollection = async (req, res) => {
    try {
        const collection = await CollectionService.createCollection(req.userId, req.body);
        res.status(201).json(collection);
    } catch (error) {
        console.error("Erro ao criar coleção:", error);
        res.status(500).json({ error: "Erro ao criar coleção." });
    }
};

/**
 * Endpoint para adicionar item à coleção.
 */
export const addToCollection = async (req, res) => {
    try {
        const { collectionId, mediaId } = req.body;
        const item = await CollectionService.addItem(collectionId, mediaId, req.userId);
        res.status(201).json(item);
    } catch (error) {
        console.error("Erro ao adicionar à coleção:", error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Endpoint para remover item da coleção.
 */
export const removeFromCollection = async (req, res) => {
    try {
        const { collectionId, mediaId } = req.body;
        await CollectionService.removeItem(collectionId, mediaId, req.userId);
        res.json({ message: "Item removido com sucesso." });
    } catch (error) {
        console.error("Erro ao remover da coleção:", error);
        res.status(400).json({ error: error.message });
    }
};

/**
 * Endpoint para listar coleções do usuário logado.
 */
export const listMyCollections = async (req, res) => {
    try {
        const collections = await CollectionService.getUserCollections(req.userId);
        res.json(collections);
    } catch (error) {
        console.error("Erro ao listar coleções:", error);
        res.status(500).json({ error: "Erro ao buscar coleções." });
    }
};
