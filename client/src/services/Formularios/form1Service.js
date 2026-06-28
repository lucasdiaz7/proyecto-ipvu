import { api } from "../../api/axiosConfig";

export const form1Service = {

    obtenerTodosLosFormularios: async () => {

        const response = await api.get('/formulario/');
        return response.data;
    },

    // Guardar por primera vez (POST)
    crearFormulario: async (datos) => {
        const response = await api.post('/formulario/', datos);
        return response.data;
    },

    // Guardar cambios sobre uno existente (PUT o PATCH)
    // actualizarFormulario: async (id, datos) => {
    //     const response = await api.patch(`/forulario/${id}/`, datos);
    //     return response.data;
    // }
};
