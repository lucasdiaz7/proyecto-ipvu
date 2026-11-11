import { api } from "../../api/axiosConfig";

export const usuarioService = {

    getTS: async () => {
        try {
            const response = await api.get("/usuario/?rol=TS")
            return response.data
        } catch (err) {
            console.log("Error al obtener Trabajadores Sociales:", err)
            throw err;
        }
    },

    postUsuario: async (data) => {
        try {
            const response = await api.post("/usuario/", data)
            return response.data

        } catch (error) {
            console.error(error)
            throw error;
        }
    },

    getUsuarios: async () => {
        try {
            const response = await api.get("/usuario/")
            return response.data
        } catch (error) {
            console.log("Error al obtener usuarios:", error)
            throw error;
        }
    },

    getUsuario: async (id) => {
        try {
            const response = await api.get(`/usuario/${id}/`)
            return response.data
        } catch (error) {
            console.log(`Error al obtener el usuario con id:${id}`, error)
            throw error;
        }
    },

    // cuantos casos tiene en poder y cuantos se le pueden devolver (para preguntar antes de la baja/alta)
    casosBaja: async (id) => {
        const response = await api.get(`/usuario/${id}/casos-baja/`)
        return response.data
    },

    // opciones: { reasignar_casos: true } al dar de baja definitiva, { devolver_casos: true } al reactivar
    cambiarEstadoActivo: async (id, activo, opciones = {}) => {
        try {
            const response = await api.patch(`/usuario/${id}/`, { activo, ...opciones })
            return response.data
        } catch (error) {
            console.log(`Error al cambiar el estado del usuario con id:${id}`, error)
            throw error;
        }
    }

}
