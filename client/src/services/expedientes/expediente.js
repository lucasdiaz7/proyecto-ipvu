import { api } from "../../api/axiosConfig";

export const expedienteService = {

    getExpediente: async () => {
        try {
            const response = await api.get("/expediente/")
            return response.data
        } catch (error) {
            console.log("Error al obtener expedientes:", error)
            throw error;
        }
    },

    getExpedienteId: async (id) => {
        try {
            const response = await api.get(`/expediente/${id}`)
            return response.data
        } catch (error) {
            console.log(`Error al obtener el expediente con el id:${id} `, error)
            throw error;
        }
    },

    marcarComoVisto: async (id) => {
        try {
            const response = await api.patch(`/expediente/${id}/`, { visto: true });
            return response.data;
        } catch (error) {
            console.log("Error al marcar como visto:", error);
        }
    },

    estadoExpediente: async (id, datos) => {
        const response = await api.patch(`/expediente/${id}/`, datos);
        return response.data;
    }
}

