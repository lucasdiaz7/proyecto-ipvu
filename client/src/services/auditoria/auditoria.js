import { api } from "../../api/axiosConfig";

export const auditoriaService = {
    getExpedientes: async () => {
        try {
            const response = await api.get("/expediente/");
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error("Error en getExpedientes:", error);
            throw error;
        }
    },

    getAuditoriaUsuarios: async () => {
        try {
            const response = await api.get("/usuario/auditoria_usuarios/");
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error("Error en getAuditoriaUsuarios:", error);
            throw error;
        }
    },

    getExpedientePorTS: async (trabajadoraSocial) => {
        try {
            const usuarioId = typeof trabajadoraSocial === "object"
                ? trabajadoraSocial.usuario
                : trabajadoraSocial;

            const response = await api.get(`/expediente/?usuario_asignado=${usuarioId}`);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error("Error en getExpedientePorTS:", error);
            throw error;
        }
    },

    // El endpoint no soporta filtros por query params (devuelve TODO el
    // historial), por eso se trae completo y se filtra por usuario en el front.
    getHistorialAcciones: async () => {
        try {
            const response = await api.get("/historialaccion/");
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error("Error en getHistorialAcciones:", error);
            throw error;
        }
    }
};
