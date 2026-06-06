import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router';
import { nuevaContraseña } from '../../services/authService/nuevaContraseña';

const CambiarContraseña = () => {
    const { register, watch, formState: { errors }, handleSubmit } = useForm();
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const nuevaContaseñaWatch = watch("nuevaContraseña")

    const onSubmit = async (data) => {
        try {
            setCargando(true);

            const payload = {
                nueva_password: data.nuevaContraseña,
                confirmar_password: data.repetirContraseña
            };

            console.log("Enviando al backend:", payload);

            await nuevaContraseña.cambiarContraseña(payload);

            alert("¡Contraseña establecida con éxito! Ingresando al sistema...");


            const userRolId = localStorage.getItem("rol_id");

            if (userRolId === "4") {
                navigate("/expedientes");
            } else {
                navigate("/expedientes");
            }

        } catch (error) {
            console.error("Error al cambiar la contraseña:", error.response?.data || error.message);
            alert("Hubo un problema al guardar tu contraseña. Intentá nuevamente.");
        } finally {
            setCargando(false);
        }
    };


    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-gray-100">


                <div className="flex flex-col items-center mb-6">
                    <div className="bg-blue-600 p-2.5 rounded-xl mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h3 className="text-gray-800 font-semibold text-[13px] tracking-tight">IPVU Santiago del Estero</h3>
                    <p className="text-gray-400 text-[10px] mt-0.5 text-center leading-tight">
                        Instituto Provincial de Vivienda y Urbanismo
                    </p>
                </div>


                <div className="space-y-4">


                    <div className="flex flex-col gap-1.5">
                        <label className="text-gray-800 font-bold text-xs ml-1">Nueva Contraseña:</label>
                        <input
                            type="text"
                            {...register('nuevaContraseña', {
                                required: true,
                                minLength: 8,
                                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
                            })}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                        {errors.nuevaContraseña?.type === 'required' && <p className="font-sans text-sm text-red-600">La contraseña es obligatoria</p>}
                        {errors.nuevaContraseña?.type === 'minLength' && <p className="font-sans text-sm text-red-600">Debe tener al menos 8 caracteres</p>}
                        {errors.nuevaContraseña?.type === 'pattern' && <p className="font-sans text-sm text-red-600">Debe incluir mayúscula, minúscula, un número y un carácter especial</p>}

                    </div>


                    <div className="flex flex-col gap-1.5">
                        <label className="text-gray-800 font-bold text-xs ml-1">Repetir Contraseña</label>
                        <input
                            type="password"
                            {...register('repetirContraseña', {
                                required: true,
                                validate: (value) =>
                                    value === nuevaContaseñaWatch || "Las contraseñas no coinciden"
                            })}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                        {errors.repetirContraseña?.type === 'required' && <p className="font-sans text-sm text-red-600">La contraseña es obligatoria</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={`w-full text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200 mt-2
                        ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {cargando ? "Guardando contraseña..." : "Cambiar Contraseña"}
                    </button>


                </div>

            </div>
        </form>
    )
}

export default CambiarContraseña