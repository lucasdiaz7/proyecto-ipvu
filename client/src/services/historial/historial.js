import { api } from "../../api/axiosConfig";

export const historial = {
    obtenerPasesPorExpediente: async (id_exp) => {
        const response = await api.get(`/historialpase/?expediente=${id_exp}`);
        return response.data;
    },

    postHistorialPase: async (data) => {
        try {
            const response = await api.post("/historialpase/", data)
            return response.data

        } catch (error) {
            console.error(error)
            throw error;
        }
    }
};