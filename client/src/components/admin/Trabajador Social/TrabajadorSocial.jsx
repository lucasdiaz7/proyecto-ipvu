import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { auditoriaService } from '../../../services/auditoria/auditoria';

const ESTADOS_EN_EJECUCION = ['SINI', '1V', 'LEG', 'DOCP', 'NUEVAV'];

const obtenerCodigoEstado = (expediente) => {
    if (!expediente?.estado_expediente) return null;
    if (typeof expediente.estado_expediente === 'string') return expediente.estado_expediente;
    return expediente.estado_expediente.nombre;
};

const TrabajadorSocial = () => {
    const [listaTS, setListaTS] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError(null);

                const [trabajadorasSociales, expedientesData] = await Promise.all([
                    usuarioService.getTS(),
                    auditoriaService.getExpedientes()
                ]);

                setListaTS(trabajadorasSociales);
                setExpedientes(expedientesData);
            } catch (err) {
                setError("No se puede cargar la lista de Trabajadoras Sociales");
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    const obtenerMetricasTS = (ts) => {
        const expedientesTS = expedientes.filter((exp) => Number(exp.usuario_asignado?.id) === Number(ts.usuario));

        return {
            total: expedientesTS.length,
            vistos: expedientesTS.filter((exp) => exp.visto).length,
            enEjecucion: expedientesTS.filter((exp) => ESTADOS_EN_EJECUCION.includes(obtenerCodigoEstado(exp))).length
        };
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
                    <div className="grid grid-cols-7 gap-2 min-w-[1040px] bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>Matrícula</span>
                        <span>Nombre</span>
                        <span>DNI</span>
                        <span>Total</span>
                        <span>Vistos</span>
                        <span>En ejecución</span>
                        <span>Acción</span>
                    </div>

                    {!error && tsFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron Trabajadoras Sociales registradas en el sistema.
                        </div>
                    ) : (
                        tsFiltrados.map((ts) => {
                            const metricas = obtenerMetricasTS(ts);

                            return (
                                <Link
                                    key={ts.matricula || ts.id}
                                    to={`/DetalleTS/${ts.id}`}
                                    className="grid grid-cols-7 gap-2 items-center w-full min-w-[1040px] text-left p-4 border-b hover:bg-gray-50 transition"
                                >
                                    <span className="font-medium text-gray-800 font-mono">{ts.matricula || "---"}</span>
                                    <span className="text-gray-700 capitalize">{`${ts.apellido} ${ts.nombre}`}</span>
                                    <span className="text-gray-700 font-mono">{ts.dni || "---"}</span>
                                    <span className="text-gray-700 font-semibold">{metricas.total}</span>
                                    <span className="text-green-700 font-semibold">{metricas.vistos}</span>
                                    <span className="text-gray-700 font-semibold">{metricas.enEjecucion}</span>
                                    <span className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium w-max">
                                        Ver detalle
                                    </span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrabajadorSocial;
