import { api } from "../../api/axiosConfig";

const getBackendOrigin = () => {
    try {
        return new URL(api.defaults.baseURL).origin;
    } catch {
        return "";
    }
};

export const resolverArchivoUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${getBackendOrigin()}${url}`;
};

export const documentoAdjuntoService = {
    obtenerPorExpediente: async (expedienteId) => {
        const response = await api.get(`/documentoadjunto/?expediente=${expedienteId}`);
        return response.data;
    },

    crear: async ({ expedienteId, archivo }) => {
        const formData = new FormData();
        formData.append("expediente", Number(expedienteId));
        formData.append("tipo_documento", archivo.name);
        formData.append("archivo", archivo);

        const response = await api.post("/documentoadjunto/", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });

        return response.data;
    },

    eliminar: async (documentoId) => {
        await api.delete(`/documentoadjunto/${documentoId}/`);
    }
};
