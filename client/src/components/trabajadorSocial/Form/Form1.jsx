
const Form1 = () => {
    return (
        <div class="flex min-h-screen items-center justify-center bg-gray-50 p-12">
            <div class="w-full rounded-3xl bg-white p-6 shadow-xl border border-gray-100">

                <div class="flex justify-center">
                    <h2 class="text-gray-800 font-bold text-[18px] tracking-tight">INFORME SOCIO LABORAL</h2>
                </div>
                <div class="flex ">
                    <div>
                        <label class="text-gray-800 font-semibold tracking-tight text-base" >Profesional Actuante</label>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label class="text-gray-800 font-semibold tracking-tight text-base">Caso de referencia</label>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label class="text-gray-800 font-semibold tracking-tight text-base">DJ N°</label>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <label class="text-gray-800 font-semibold tracking-tight text-base">Domicilio</label>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                </div>
                <div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">GRUPO FAMILIAR CONSTITUYENTE</h2>
                        <p class="text-gray-800 font-sans  text-sm">Tipo y Dinamia Familiar. Conflictos</p>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">SITUACION HABITACIONAL</h2>
                        <p class="text-gray-800 font-sans  text-sm">Tipo de posesion y tiempo de habitabilidad</p>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">ASPECTO ECONOMICO</h2>
                        <p class="text-gray-800 font-sans  text-sm">Ingresos y Calidad de Vida</p>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">SITUACION DE SALUD</h2>
                        <p class="text-gray-800 font-sans  text-sm">Discapacidad. Invalidez</p>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">NIVEL DE ESTUDIOS</h2>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">RELEVAMIENTO VECINAL</h2>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                    <div>
                        <h2 class="text-gray-800 font-semibold tracking-tight text-base">OBSERVACIONES Y/O PARTICULARIDADES</h2>
                        <input
                            type="text"
                            class="w-full px-3 py-2 text-sm  border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>
                </div>
                <div class="flex justify-center flex-col text-center mt-3" >
                    <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200 mt-2">Enviar a Legales</button>

                    <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200 mt-3">Continuar con el proceso</button>
                </div>
            </div>
        </div>
    )
}

export default Form1