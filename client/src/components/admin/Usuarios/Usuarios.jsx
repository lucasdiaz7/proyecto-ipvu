import { UsersIcon } from '@heroicons/react/24/outline'
import React from 'react'

const usuarios = () => {

    const usuarios = [
        {
            "legajo": "1234",
            "nombre": "Emiliano",
            "apellido": "Epstein",
            "documento": "45678666",
            "perfil": "Trabajador social"
        },
        {
            "legajo": "1234",
            "nombre": "Benjamin",
            "apellido": "Guerrero",
            "documento": "34567654",
            "perfil": "Abogado"
        },
        {
            "legajo": "4356",
            "nombre": "Piero",
            "apellido": "Guadaña",
            "documento": "37456987",
            "perfil": "Legales"
        },
        {
            "legajo": "3428",
            "nombre": "juan",
            "apellido": "Perez",
            "documento": "34578734",
            "perfil": "Trabajador Social"
        },
        {
            "legajo": "4576",
            "nombre": "Ricardo",
            "apellido": "Lopez",
            "documento": "41456789",
            "perfil": "Trabajador Social"
        },
        {
            "legajo": "3420",
            "nombre": "Erika",
            "apellido": "Zuffellato",
            "documento": "40756864",
            "perfil": "Administrativa"
        }
    ]


    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">

            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">


                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Usuarios
                    </h3>
                    <p className="text-gray-600 font-light">
                        Vista general de todos los usuarios en el sistema
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-700 font-medium">
                            Todos los perfiles
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
                        <span className="text-gray-700 font-medium">
                            Crear nuevo usuario
                        </span>
                        <UsersIcon className="w-6 h-6 text-gray-800" />
                    </div>
                </div>


                <div className="mt-6 overflow-x-auto">

                    <div className="grid grid-cols-3 gap-2 md:hidden bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Legajo</span>
                        <span>Nombre</span>
                        <span>Perfil</span>
                    </div>

                    <div className="hidden md:grid grid-cols-4 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Legajo</span>
                        <span>Nombre</span>
                        <span>Perfil</span>
                        <span>DNI</span>
                    </div>


                    {usuarios.map((e) => (
                        <button
                            key={e.legajo}
                            className="grid grid-cols-3 md:grid-cols-4 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition"
                        >
                            <span className="font-medium text-gray-800">{e.legajo}</span>
                            <span className="text-gray-700">{`${e.nombre} ${e.apellido}`}</span>
                            <span className="text-gray-700">{e.perfil}</span>


                            <span className="hidden md:block text-gray-700">{e.documento}</span>

                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default usuarios