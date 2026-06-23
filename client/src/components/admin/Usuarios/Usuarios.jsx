import { UsersIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { Link } from 'react-router';

const Usuarios = () => {
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const Usuarios = async () => {
            try {
                setCargando(true);
                setError(null);

                const data = await usuarioService.getUsuarios()

                setListaUsuarios(data);

            } catch (err) {
                console.error(err);
                setError("Ocurrió un error al cargar la lista de usuarios.");
            } finally {
                setCargando(false);
            }
        };

        Usuarios();
    }, []);


    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">


                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Usuarios
                    </h3>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition cursor-pointer">
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

                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition cursor-pointer">

                        <Link to="/crearUsuario" className="text-gray-700 font-medium">
                            Crear nuevo usuario
                        </Link>
                        <UsersIcon className="w-6 h-6 text-gray-800" />
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">

                    <div className="grid grid-cols-3 gap-2 md:hidden bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>ID</span>
                        <span>Nombre</span>
                        <span>Perfil</span>
                    </div>

                    <div className="hidden md:grid grid-cols-4 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>ID</span>
                        <span>Nombre</span>
                        <span>Perfil</span>
                        <span>DNI</span>
                    </div>

                    {/* Renderizado Condicional: Estados de la API */}
                    {cargando ? (
                        <div className="text-center p-8 text-gray-500 animate-pulse text-sm">
                            Cargando personal del IPVU...
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm mt-2">
                            {error}
                        </div>
                    ) : listaUsuarios.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 text-sm">
                            No hay usuarios registrados en el sistema.
                        </div>
                    ) : (

                        listaUsuarios.map((e) => (
                            <button
                                key={e.id}
                                className="grid grid-cols-3 md:grid-cols-4 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition"
                            >

                                <span className="font-medium text-gray-800">#{e.id}</span>

                                <span className="text-gray-700 capitalize">{`${e.apellido} ${e.nombre}`}</span>


                                <span className="text-gray-700">
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold
                                        ${e.rol_display === 'TS' ? 'bg-blue-100 text-blue-700' : ''}
                                        ${e.rol_display === 'SU' ? 'bg-purple-100 text-purple-700' : ''}
                                        ${e.rol_display === 'LG' ? 'bg-green-100 text-green-700' : ''}
                                        ${e.rol_display === 'DE' ? 'bg-amber-100 text-amber-700' : ''}
                                    `}>
                                        {e.rol_display === 'TS' && 'Trabajadora Social'}
                                        {e.rol_display === 'SU' && 'Administrador'}
                                        {e.rol_display === 'LG' && 'Legales'}
                                        {e.rol_display === 'DE' && 'Data Entry'}
                                    </span>
                                </span>


                                <span className="hidden md:block text-gray-700 font-mono">{e.dni}</span>
                            </button>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
};

export default Usuarios;