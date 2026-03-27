

const Login = () => {
    return (
        <div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">

            <div class="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl border border-gray-100">

                <div class="flex flex-col items-center mb-6">

                    <div class="bg-blue-600 p-2.5 rounded-xl mb-3">

                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>


                    <h3 class="text-gray-800 font-semibold text-[13px] tracking-tight">IPVU Santiago del Estero</h3>
                    <p class="text-gray-400 text-[10px] mt-0.5 text-center leading-tight">
                        Instituto Provincial de Vivienda y Urbanismo
                    </p>
                </div>


                <div class="space-y-4">


                    <div class="flex flex-col gap-1.5">
                        <label class="text-gray-800 font-bold text-xs ml-1">Usuario</label>
                        <input
                            type="text"
                            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>


                    <div class="flex flex-col gap-1.5">
                        <label class="text-gray-800 font-bold text-xs ml-1">Contraseña</label>
                        <input
                            type="password"
                            class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200"
                        />
                    </div>


                    <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold text-[13px] py-2.5 rounded-lg shadow-sm transition-colors duration-200 mt-2">
                        Iniciar sesión
                    </button>


                    <div class="text-center mt-3">
                        <a class="text-gray-800 font-bold text-xs hover:text-blue-600 transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;