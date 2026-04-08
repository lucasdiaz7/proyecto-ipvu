
const NavBar = () => {
    return (
        <div class="flex justify-between bg-blue-500 w-full h-12">
            <div class="flex items-center p-3" >
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 class="text-white text-[15px] text-center leading-tight ml-1">IPVU Santiago del Estero</h3>
            </div>
            <div class="flex items-center p-3">
                <span class="text-white">Lucas Diaz</span>
                <button class="text-white ml-7 px-3 py-1 bg-blue-800 hover:bg-blue-950 rounded-lg font-semibold">Salir</button>
            </div>
        </div>
    )
}

export default NavBar