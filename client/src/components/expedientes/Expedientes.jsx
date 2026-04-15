

const Expedientes = () => {
    const count = 2

    const expedientes = [
        {
            ddjj: "DJ-001",
            titular: "María López",
            dni: "32.456.789",
            estado: "Sin Iniciar",
            entrevistada: "No",
            ultimaModificacion: "05/11/2024 09:30"
        },
        {
            ddjj: "DJ-002",
            titular: "Roberto Sánchez",
            dni: "29.876.543",
            estado: "1ª Visita",
            entrevistada: "Si",
            ultimaModificacion: "10/11/2024 14:15"
        },
        {
            ddjj: "DJ-003",
            titular: "Ana Martínez",
            dni: "31.234.567",
            estado: "Legales",
            entrevistada: "Si",
            ultimaModificacion: "09/11/2024 11:20"
        },
        {
            ddjj: "DJ-004",
            titular: "Jorge Pérez",
            dni: "30.123.456",
            estado: "Doc. Presentada",
            entrevistada: "Si",
            ultimaModificacion: "08/11/2024 16:45"
        },
        {
            ddjj: "DJ-005",
            titular: "Laura Gómez",
            dni: "28.987.654",
            estado: "Apto",
            entrevistada: "Si",
            ultimaModificacion: "07/11/2024 10:00"
        },
        {
            ddjj: "DJ-006",
            titular: "Carlos Díaz",
            dni: "33.456.789",
            estado: "Nueva Visita",
            entrevistada: "Si",
            ultimaModificacion: "06/11/2024 13:30"
        }
    ]

    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">

            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">


                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Seguimiento de fichas
                    </h3>
                    <p className="text-gray-600 font-light">
                        Vista general de todos los expedientes en el sistema
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-700 font-medium">
                            Todos los estados
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" strokeWidth={1.5}
                            stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </div>

                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm">
                        <input
                            type="text"
                            placeholder="Buscar"
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-800 font-semibold">
                            Nuevo Expediente
                        </span>

                        <div className="relative inline-block">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-6 h-6 text-yellow-600"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 2a6 6 0 0 0-6 6c0 1.887-.454 3.665-1.257 5.234a.75.75 0 0 0 .515 1.076 32.91 32.91 0 0 0 3.256.508 3.5 3.5 0 0 0 6.972 0 32.903 32.903 0 0 0 3.256-.508.75.75 0 0 0 .515-1.076A11.448 11.448 0 0 1 16 8a6 6 0 0 0-6-6Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span
                                className={`absolute -top-1 -right-1 flex items-center justify-center
                                min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white rounded-full
                                ${count === 0 ? "bg-black" : "bg-red-500"}`}
                            >
                                {count}
                            </span>
                        </div>
                    </div>
                </div>


                <div className="mt-6 overflow-x-auto">

                    <div className="grid grid-cols-3 gap-2 md:hidden bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>DD.JJ</span>
                        <span>Titular</span>
                        <span>DNI</span>
                    </div>

                    <div className="hidden md:grid grid-cols-6 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>DD.JJ</span>
                        <span>Titular</span>
                        <span>DNI</span>
                        <span>Estado</span>
                        <span>Entrevistada</span>
                        <span>Última Modificación</span>
                    </div>


                    {expedientes.map((e) => (
                        <button
                            key={e.ddjj}
                            className="grid grid-cols-3 md:grid-cols-6 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition"
                        >
                            <span className="font-medium text-gray-800">{e.ddjj}</span>
                            <span className="text-gray-700">{e.titular}</span>
                            <span className="text-gray-700">{e.dni}</span>


                            <span className="hidden md:block">{e.estado}</span>

                            <span className="hidden md:block">
                                <span
                                    className={`px-2 py-1 text-sm rounded-lg border font-medium ${e.entrevistada === "Si"
                                        ? "text-green-700 bg-green-100 border-green-600"
                                        : "text-red-700 bg-red-100 border-red-600"
                                        }`}
                                >
                                    {e.entrevistada}
                                </span>
                            </span>

                            <span className="hidden md:block">
                                {e.ultimaModificacion}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Expedientes;