import React, { useEffect, useState } from 'react';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { auditoriaService } from '../../../services/auditoria/auditoria';

const TrabajadorSocial = () => {
    const [listaTS, setListaTS] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');


    const [tsSeleccionada, setTsSeleccionada] = useState(null);
    const [expedientes, setExpedientes] = useState([]);
    const [cargandoExpedientes, setCargandoExpedientes] = useState(false);
    const [errorExpedientes, setErrorExpedientes] = useState(null);

    useEffect(() => {
        const cargarTS = async () => {
            try {
                setCargando(true);
                setError(null);
                const data = await usuarioService.getTS();
                setListaTS(data);
            } catch (err) {
                setError("No se puede cargar la lista de Trabajadoras Sociales");
            } finally {
                setCargando(false);
            }
        };
        cargarTS();
    }, []);

    // "Ver Expedientes"
    const manejarSeleccionTS = async (ts) => {
        setTsSeleccionada(ts);
        setExpedientes([]);
        setErrorExpedientes(null);

        try {
            setCargandoExpedientes(true);

            const data = await auditoriaService.getExpedientePorTS(ts.id);
            setExpedientes(data);
        } catch (err) {
            setErrorExpedientes("Error al cargar los expedientes de auditoría asignados.");
        } finally {
            setCargandoExpedientes(false);
        }
    };

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
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center p-4 gap-6">
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

                    <div className="grid grid-cols-3 gap-2 md:grid-cols-4 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Matrícula</span>
                        <span>Nombre</span>
                        <span className="hidden md:block">DNI</span>
                        <span>Acción</span>
                    </div>

                    {!error && tsFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron Trabajadoras Sociales registradas en el sistema.
                        </div>
                    ) : (
                        tsFiltrados.map((e) => (
                            <div
                                key={e.matricula || e.id}
                                className={`grid grid-cols-3 md:grid-cols-4 gap-2 items-center w-full p-4 border-b transition ${tsSeleccionada?.id === e.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            >
                                <span className="font-medium text-gray-800 font-mono">{e.matricula || "---"}</span>
                                <span className="text-gray-700 capitalize">{`${e.apellido} ${e.nombre}`}</span>
                                <span className="hidden md:block text-gray-700 font-mono">{e.dni || "---"}</span>


                                <button
                                    onClick={() => manejarSeleccionTS(e)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium w-max focus:outline-none"
                                >
                                    Ver Expedientes
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>


            {tsSeleccionada && (
                <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10 border-t-4 border-blue-600">
                    <h4 className="text-gray-800 font-bold text-lg mb-4">
                        Expedientes de Auditoría Asignados a: <span className="text-blue-600 capitalize">{`${tsSeleccionada.nombre} ${tsSeleccionada.apellido}`}</span>
                    </h4>

                    {cargandoExpedientes ? (
                        <div className="text-center py-10 text-gray-500 animate-pulse">Cargando datos de auditoría...</div>
                    ) : errorExpedientes ? (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center">{errorExpedientes}</div>
                    ) : expedientes.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">Esta profesional no registra expedientes en auditoría actualmente.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {expedientes.map((exp) => (
                                <div key={exp.id} className="p-4 border rounded-xl bg-gray-50 shadow-sm">

                                    <p className="font-bold text-gray-800">Expediente ID: #{exp.id}</p>
                                    <p className="text-sm text-gray-600 mt-1">Detalle/Observación: {exp.detalle || exp.observacion || "Sin especificación"}</p>
                                    <p className="text-xs text-gray-400 mt-2">Fecha Asignación: {exp.fecha || "No informada"}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrabajadorSocial;