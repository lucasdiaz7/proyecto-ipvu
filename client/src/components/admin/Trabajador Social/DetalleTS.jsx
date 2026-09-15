import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    BriefcaseIcon,
    ArrowPathIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { auditoriaService } from '../../../services/auditoria/auditoria';
import { historial } from '../../../services/historial/historial';

const CONFIG_ESTADOS = {
    SINI: { texto: 'Sin Iniciar', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    '1V': { texto: '1ra Visita', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    LEG: { texto: 'Legales', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    DOCP: { texto: 'Doc Presentada', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    AP: { texto: 'Apto', color: 'bg-green-100 text-green-800 border-green-300' },
    NOAP: { texto: 'No Apto', color: 'bg-red-100 text-red-800 border-red-300' },
    NUEVAV: { texto: 'Nueva Visita', color: 'bg-teal-100 text-teal-800 border-teal-300' }
};

const ESTADOS_EN_EJECUCION = ['SINI', '1V', 'LEG', 'DOCP', 'NUEVAV'];

const obtenerCodigoEstado = (expediente) => {
    if (!expediente?.estado_expediente) return null;
    if (typeof expediente.estado_expediente === 'string') return expediente.estado_expediente;
    return expediente.estado_expediente.nombre;
};

const DetalleTS = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trabajadora, setTrabajadora] = useState(null);
    const [expedientes, setExpedientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const cargarDetalle = async () => {
            try {
                setCargando(true);
                setError(null);

                const perfil = await usuarioService.getUsuario(id);
                const usuarioId = perfil.usuario ?? perfil.id;

                const [
                    expedientesAsignadosResult,
                    todosLosExpedientesResult,
                    pasesDeLaTrabajadoraResult
                ] = await Promise.allSettled([
                    auditoriaService.getExpedientePorTS(perfil),
                    auditoriaService.getExpedientes(),
                    historial.obtenerPasesPorUsuario(usuarioId)
                ]);

                const expedientesAsignados = expedientesAsignadosResult.status === 'fulfilled'
                    ? expedientesAsignadosResult.value
                    : [];
                const todosLosExpedientes = todosLosExpedientesResult.status === 'fulfilled'
                    ? todosLosExpedientesResult.value
                    : expedientesAsignados;
                const pasesDeLaTrabajadora = pasesDeLaTrabajadoraResult.status === 'fulfilled'
                    ? pasesDeLaTrabajadoraResult.value
                    : [];

                const idsTrabajados = new Set([
                    ...expedientesAsignados.map((exp) => exp.id),
                    ...pasesDeLaTrabajadora.map((pase) => Number(pase.expediente))
                ]);

                const expedientesTrabajados = todosLosExpedientes.filter((exp) => idsTrabajados.has(Number(exp.id)));

                setTrabajadora(perfil);
                setExpedientes(expedientesTrabajados.length > 0 ? expedientesTrabajados : expedientesAsignados);
            } catch (err) {
                console.error(err);
                setError("No se pudo cargar el detalle de la trabajadora social.");
            } finally {
                setCargando(false);
            }
        };

        if (id) {
            cargarDetalle();
        } else {
            setError("No se indicó una trabajadora social para consultar.");
            setCargando(false);
        }
    }, [id]);

    const metricas = useMemo(() => {
        return {
            total: expedientes.length,
            vistos: expedientes.filter((exp) => exp.visto).length,
            enEjecucion: expedientes.filter((exp) => ESTADOS_EN_EJECUCION.includes(obtenerCodigoEstado(exp))).length
        };
    }, [expedientes]);

    if (cargando) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center">
                <p className="text-gray-600 font-medium">Cargando detalle de la trabajadora social...</p>
            </div>
        );
    }

    if (error || !trabajadora) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="bg-red-100 text-red-700 p-4 rounded-xl max-w-md text-center font-medium shadow-sm">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-6xl flex flex-col gap-6">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-slate-800 font-semibold transition group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Volver</span>
                    </button>
                </div>

                <div className="w-full bg-white shadow-sm border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                            {trabajadora.nombre?.[0]}{trabajadora.apellido?.[0]}
                        </div>
                        <div>
                            <h2 className="text-gray-800 font-black text-2xl capitalize">
                                {`${trabajadora.apellido} ${trabajadora.nombre}`}
                            </h2>
                            <p className="text-gray-500 font-mono text-sm">Matrícula: {trabajadora.matricula || "---"}</p>
                            <p className="text-gray-400 text-xs mt-0.5">DNI: {trabajadora.dni || "---"} | {trabajadora.email || "---"}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Casos totales</p>
                            <h4 className="text-gray-800 font-black text-3xl mt-1">{metricas.total}</h4>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><BriefcaseIcon className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">En ejecución</p>
                            <h4 className="text-orange-600 font-black text-3xl mt-1">{metricas.enEjecucion}</h4>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><ArrowPathIcon className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Vistos</p>
                            <h4 className="text-green-600 font-black text-3xl mt-1">{metricas.vistos}</h4>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600"><EyeIcon className="w-6 h-6" /></div>
                    </div>
                </div>

                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="mb-4">
                        <h3 className="text-gray-800 font-bold text-lg">Expedientes de esta trabajadora social</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-6 gap-2 min-w-[980px] bg-gray-50 p-3 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-wider">
                            <span>DD.JJ</span>
                            <span>Titular</span>
                            <span>DNI</span>
                            <span>Estado</span>
                            <span>Fecha</span>
                            <span>Acción</span>
                        </div>

                        {expedientes.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 font-medium">
                                Esta trabajadora social no posee expedientes asignados actualmente.
                            </div>
                        ) : (
                            expedientes.map((exp) => {
                                const codEstado = obtenerCodigoEstado(exp);
                                const configEst = CONFIG_ESTADOS[codEstado] || { texto: codEstado || 'Sin estado', color: 'bg-gray-100 text-gray-800 border-gray-300' };
                                const titular = exp.postulante_titular;
                                const fecha = exp.fecha_creacion ? new Date(exp.fecha_creacion).toLocaleDateString('es-AR') : '---';

                                return (
                                    <div
                                        key={exp.id}
                                        className="grid grid-cols-6 gap-2 items-center w-full min-w-[980px] text-left p-4 border-b border-gray-100 hover:bg-gray-50/80 transition text-sm"
                                    >
                                        <span className="font-bold text-gray-800">{exp.DDJJ || `#${exp.id}`}</span>
                                        <span className="text-gray-600 capitalize">{titular ? `${titular.apellido} ${titular.nombre}` : 'Sin titular'}</span>
                                        <span className="text-gray-500 font-mono">{titular?.dni || '---'}</span>
                                        <span>
                                            <span className={`px-2.5 py-1 text-xs rounded-full border font-bold ${configEst.color}`}>
                                                {configEst.texto}
                                            </span>
                                        </span>
                                        <span className="text-gray-500">{fecha}</span>
                                        <Link
                                            to={`/Expediente/${exp.id}`}
                                            className="inline-flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium w-max"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            Ver expediente
                                        </Link>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalleTS;
