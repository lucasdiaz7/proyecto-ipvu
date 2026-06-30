import React, { useEffect, useState } from 'react'
import { usuarioService } from '../../../services/usuarios/usuarios'

const TrabajadorSocial = () => {
    const [listaTS, setListaTS] = useState([])
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(null)
    const [busqueda, setBusqueda] = useState('')
    useEffect(() => {
        const cargarTS = async () => {
            try {
                setCargando(true)
                setError(null)
                const data = await usuarioService.getTS()
                setListaTS(data)
            } catch (err) {
                setError("No se puede cargar la lista de Trabajadoras Sociales")
            } finally {
                setCargando(false)
            }
        }
        cargarTS()
    }, [])


    const tsFiltrados = listaTS.filter((ts) => {
        const textoBusqueda = busqueda.toLowerCase();
        return (
            ts.nombre?.toLowerCase().includes(textoBusqueda) ||
            ts.apellido?.toLowerCase().includes(textoBusqueda) ||
            ts.dni?.includes(textoBusqueda) ||
            ts.matricula?.toLowerCase().includes(textoBusqueda)
        );
    });


    if (cargando) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="text-center py-20 text-gray-600 font-medium">
                    Cargando equipo de Trabajadoras Sociales...
                </div>
            </div>
        )
    }


    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center font-medium">
                        {error}
                    </div>
                )}

                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Trabajadoras Sociales
                    </h3>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, matrícula o DNI..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    {/* Encabezado Mobile (3 columnas) */}
                    <div className="grid grid-cols-3 gap-2 md:hidden bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Matrícula</span>
                        <span>Nombre</span>
                        <span>DNI</span>
                    </div>

                    {/* Encabezado Desktop */}
                    <div className="hidden md:grid grid-cols-4 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Matrícula</span>
                        <span>Nombre</span>
                        <span>DNI</span>
                    </div>

                    {!error && tsFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron Trabajadoras Sociales registradas en el sistema.
                        </div>
                    ) : (

                        tsFiltrados.map((e) => (
                            <button
                                key={e.matricula || e.id}
                                className="grid grid-cols-3 md:grid-cols-4 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition focus:outline-none"
                            >
                                <span className="font-medium text-gray-800 font-mono">{e.matricula || "---"}</span>
                                <span className="text-gray-700 capitalize">{`${e.apellido} ${e.nombre}` || "Sin Nombre"}</span>
                                <span className="text-gray-700 font-mono">{e.dni || "---"}</span>


                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default TrabajadorSocial