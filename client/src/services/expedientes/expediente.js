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
            console.log(error)
        }
    }
}

