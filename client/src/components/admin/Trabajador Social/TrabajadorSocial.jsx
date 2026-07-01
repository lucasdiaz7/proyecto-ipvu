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
                setListaTS(data || [])
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

                {/* Buscador */}
                <div className="mt-6 grid grid-cols-1 gap-4">
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

                    <div className="grid grid-cols-6 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm min-w-[700px]">
                        <span>Matrícula</span>
                        <span>Nombre y Apellido</span>
                        <span>DNI</span>
                        <span className="text-center text-blue-600">Casos Totales</span>
                        <span className="text-center text-amber-600">No Vistos</span>
                    </div>

                    {cargando ? (
                        <div className="text-center py-20 text-gray-600 font-medium">
                            Cargando equipo de Trabajadoras Sociales...
                        </div>
                    ) : !error && tsFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron Trabajadoras Sociales registradas en el sistema.
                        </div>
                    ) : (
                        <div className="min-w-[700px]">
                            {tsFiltrados.map((e) => {
                                const nombreCompleto = [e.apellido, e.nombre].filter(Boolean).join(' ');

                                return (
                                    <button
                                        key={e.id || e.matricula}
                                        type="button"
                                        onClick={() => console.log("Seleccionado:", e)}
                                        className="grid grid-cols-6 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition focus:outline-none"
                                    >
                                        <span className="font-medium text-gray-800 font-mono">{e.matricula || "---"}</span>
                                        <span className="text-gray-700 capitalize truncate pr-2">{nombreCompleto || "Sin Nombre"}</span>
                                        <span className="text-gray-700 font-mono">{e.dni || "---"}</span>

                                        {/* Nuevas columnas con los contadores */}
                                        <span className="text-center font-semibold text-blue-600">
                                            {e.casosTotales ?? 0}
                                        </span>
                                        <span className="text-center font-semibold text-amber-600">
                                            {e.casosNoVistos ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default TrabajadorSocial