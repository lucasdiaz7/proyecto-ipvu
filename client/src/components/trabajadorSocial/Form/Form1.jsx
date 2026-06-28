import { Link, useLocation, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { form1Service } from "../../../services/Formularios/form1Service";

const Form1 = () => {
    const location = useLocation();
    const { idExpediente, ddjj, nombreCompletoUsuario, domicilio } = location.state || {};
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const navigate = useNavigate();



    const onSubmit = async (data) => {
        try {
            const payload = {
                expediente: idExpediente,
                grupo_familiar: data.grupoFamiliarConstituyente,
                situacion_habitacional: data.situacionHabitacional,
                aspecto_economico: data.aspectoEconomico,
                situacion_salud: data.situacionDeSalud,
                nivel_estudios: data.nivelDeEstudios,
                relevamiento_vecinal: data.relevamientoVecinal,
                observaciones: data.observacionesParticularidades
            };


            console.log('Payload final listo para el Back:', payload);

            const crearFormulario = await form1Service.crearFormulario(payload);
            alert("¡Formulario creado!");
            navigate(`/expediente/${idExpediente}`)

        } catch (error) {
            console.error(error);
            alert("Error al crear el formulario.");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 md:p-12">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="flex justify-center">
                        <h2 className="text-gray-800 font-bold text-[18px] tracking-tight text-center">
                            INFORME SOCIO HABITACIONAL
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                        <div>
                            <label className="text-gray-800 font-semibold text-base">Profesional Actuante</label>
                            <p className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 transition-all duration-200">{nombreCompletoUsuario}</p>
                        </div>

                        <div>
                            <label className="text-gray-800 font-semibold text-base">Caso de referencia</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("casoDeReferencia")}
                            />
                        </div>

                        <div>
                            <label className="text-gray-800 font-semibold text-base">DJ N°</label>
                            <p className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 transition-all duration-200">{ddjj}</p>
                        </div>

                        <div>
                            <label className="text-gray-800 font-semibold text-base">Domicilio</label>
                            <p className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 transition-all duration-200">{domicilio}</p>
                        </div>
                    </div>

                    <div>
                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">GRUPO FAMILIAR CONSTITUYENTE</h2>
                            <p className="text-gray-600 text-sm">Tipo y Dinamia Familiar. Conflictos</p>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("grupoFamiliarConstituyente")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">SITUACION HABITACIONAL</h2>
                            <p className="text-gray-600 text-sm">Tipo de posesion y tiempo de habitabilidad</p>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("situacionHabitacional")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">ASPECTO ECONOMICO</h2>
                            <p className="text-gray-600 text-sm">Ingresos y Calidad de Vida</p>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("aspectoEconomico")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">SITUACION DE SALUD</h2>
                            <p className="text-gray-600 text-sm">Discapacidad. Invalidez</p>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("situacionDeSalud")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">NIVEL DE ESTUDIOS</h2>
                            <input
                                type="text"
                                className="w-full mt-2 px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("nivelDeEstudios")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">RELEVAMIENTO VECINAL</h2>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("relevamientoVecinal")}
                            />
                        </div>

                        <div className="mt-5">
                            <h2 className="text-gray-800 font-semibold text-base">OBSERVACIONES Y/O PARTICULARIDADES</h2>
                            <textarea
                                className="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("observacionesParticularidades")}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-center mt-6 gap-3">
                        <button type="submit" className="w-full md:w-72 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200">
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Form1;