import { Link } from "react-router";
import { useForm } from "react-hook-form";
const Form1 = () => {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const onSubmit = (data) => {
        console.log(data)
    }

    return (

        <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4 md:p-12">
            <div class="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div class="flex justify-center">
                        <h2 class="text-gray-800 font-bold text-[18px] tracking-tight text-center">
                            INFORME SOCIO LABORAL
                        </h2>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                        <div>
                            <label class="text-gray-800 font-semibold text-base">Profesional Actuante</label>
                            <input

                                type="text"
                                class="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("profesionalActuante", { required: "Este campo es Obligatorio" })}
                            />
                            {errors.profesionalActuante && <p className="font-sans text-sm text-red-600">Este Campo Es Obligatorio</p>}
                        </div>

                        <div>
                            <label class="text-gray-800 font-semibold text-base">Caso de referencia</label>
                            <input
                                type="text"
                                class="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("casoDeReferencia", { required: "Este Campo Es Obligatorio" })}
                            />
                            {errors.casoDeReferencia && <p className="font-sans text-sm text-red-600">Este Campo Es Obligatorio</p>}
                        </div>

                        <div>
                            <label class="text-gray-800 font-semibold text-base">DJ N°</label>
                            <input
                                type="text"
                                class="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("DJN", { required: "Este Campo Es Obligatorio" })}
                            />
                            {errors.DJN && <p className="font-sans text-sm text-red-600">Este Campo Es Obligatorio</p>}
                        </div>

                        <div>
                            <label class="text-gray-800 font-semibold text-base">Domicilio</label>
                            <input
                                type="text"
                                class="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("domicilio", { required: "Este Campo Es Obligatorio" })}
                            />
                        </div>
                        {errors.domicilio && <p className="font-sans text-sm text-red-600">Este Campo Es Obligatorio</p>}
                    </div>

                    <div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">GRUPO FAMILIAR CONSTITUYENTE</h2>
                            <p class="text-gray-600 text-sm">Tipo y Dinamia Familiar. Conflictos</p>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("grupoFamiliarConstituyente")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">SITUACION HABITACIONAL</h2>
                            <p class="text-gray-600 text-sm">Tipo de posesion y tiempo de habitabilidad</p>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("situacionHabitacional")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">ASPECTO ECONOMICO</h2>
                            <p class="text-gray-600 text-sm">Ingresos y Calidad de Vida</p>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("aspectoEconomico")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">SITUACION DE SALUD</h2>
                            <p class="text-gray-600 text-sm">Discapacidad. Invalidez</p>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("situacionDeSalud")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">NIVEL DE ESTUDIOS</h2>
                            <input
                                type="text"
                                class="w-full mt-2 px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                                {...register("nivelDeEstudios")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">RELEVAMIENTO VECINAL</h2>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("relevamientoVecinal")}
                            />
                        </div>

                        <div class="mt-5">
                            <h2 class="text-gray-800 font-semibold text-base">OBSERVACIONES Y/O PARTICULARIDADES</h2>
                            <textarea
                                class="w-full mt-2 px-3 py-3 text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
                                {...register("observacionesParticularidades")}
                            />
                        </div>
                    </div>

                    <div class="flex flex-col items-center mt-6 gap-3">
                        <button tipe="submit" class="w-full md:w-72 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200">
                            Enviar a legales
                        </button>
                        <Link to="/form2">
                            <button class="w-full md:w-72 bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200">
                                Continuar con el proceso
                            </button>
                        </Link>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default Form1;