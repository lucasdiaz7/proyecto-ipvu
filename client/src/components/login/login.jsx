import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { authService } from "../../services/authService/authService.js";

const Login = () => {
    const { register, formState: { errors }, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);

    const onSubmit = async (data) => {
        try {
            setCargando(true);


            const res = await authService.iniciarSesion(data.username, data.password);

            if (res.requiere_cambio_password === true) {
                alert("Por seguridad, debes cambiar tu contraseña predeterminada.");
                navigate("/cambiarContraseña");
                return; // Cortamos la ejecución acá para que no vaya a otra vista
            }

            const userRolId = localStorage.getItem("rol_id");

            switch (userRolId) {
                // trabajadora social
                case "1":
                    navigate("/expedientes");
                    break;

                case "2":
                    navigate("/expedientes");
                    break;

                // data entry
                case "3":
                    navigate("/expedientes");
                    break;

                case "4":
                    alert(`¡Bienvenido/a ${res.nombre_completo}!`);
                    navigate("/homeAdmin");
                    break;
            }

        } catch (error) {
            console.error("Error al iniciar sesión:", error.response?.data || error.message);
            if (error.response?.status === 400 || error.response?.status === 401) {
                alert("Usuario o contraseña incorrectos.");
            } else {
                alert("Hubo un problema de conexión con el servidor.");
            }
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
                        <label className="text-gray-800 font-bold text-xs ml-1">Usuario</label>
                        <input
                            type="text"
                            autoComplete="username"
                            {...register('username', { required: true })}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                        {errors.username?.type === 'required' && (
                            <p className="font-sans text-sm text-red-600">Este campo es obligatorio</p>
                        )}
                    </div>


                    <div className="flex flex-col gap-1.5">
                        <label className="text-gray-800 font-bold text-xs ml-1">Contraseña</label>
                        <input
                            type="password"
                            autoComplete="current-password"
                            {...register('password', { required: true })}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                        {errors.password?.type === 'required' && (
                            <p className="font-sans text-sm text-red-600">Este campo es obligatorio</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className={`w-full text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200 mt-2
                            ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {cargando ? "Validando credenciales..." : "Iniciar sesión"}
                    </button>

                    <div className="text-center mt-3">
                        <a className="text-gray-800 font-bold text-xs hover:text-blue-600 transition-colors cursor-pointer">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </div>

            </div>
        </form>
    );
};

export default Login;