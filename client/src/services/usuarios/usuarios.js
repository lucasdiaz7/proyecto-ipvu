import { api } from "../../api/axiosConfig";

export const usuarioService = {

    postUsuario: async (data) => {
        try {
            const response = await api.post("/usuario/", data)
            return response.data
            console.log('response.data :>> ', response.data);

        } catch (error) {
            console.error(error)
            throw error;
        }
    },

    getUsuarios: async () => {
        try {
            const response = await api.get("/usuario/")
            console.log('response :>> ', response);
            return response.data
        } catch (error) {
            console.log("Error al obtener usuarios:", error)
            throw error;
        }
    }
}