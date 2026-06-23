import React, { useEffect, useState } from 'react';
// Cambiá tus importaciones de arriba por estas:
import {
    ArrowLeftIcon,
    BriefcaseIcon,
    EyeSlashIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    NoSymbolIcon,
    CheckIcon
} from '@heroicons/react/24/outline';

// SIMULACIÓN DE LA DATA (Eliminar cuando conectes con usuarioService.getDetalleAuditoria(id))
const mockData = {
    datos_personales: {
        id: 9,
        nombre: "Laura",
        apellido: "Díaz",
        dni: "35.888.999",
        matricula: "MP-4520",
        email: "laura.diaz@sistema.com",
        fecha_ingreso: "2025-03-15T12:00:00Z",
        activo: true
    },
    metricas: {
        total_asignados: 15,
        nuevos_sin_ver: 4,
        en_proceso: 8,
        resueltos_finalizados: 3
    },
    expedientes_asignados: [
        { id: 10, DDJJ: "EXP-2024-002", postulante_titular: { nombre: "Maria", apellido: "Gonzalez", dni: "66666666" }, estado_expediente: { id: 9, nombre: "SINI" }, fecha_creacion: "2026-06-02T18:41:00Z", visto: false },
        { id: 14, DDJJ: "EXP-2024-001", postulante_titular: { nombre: "Juan", apellido: "Rodriguez", dni: "55555555" }, estado_expediente: { id: 2, nombre: "1V" }, fecha_creacion: "2026-06-02T18:41:00Z", visto: true },
        { id: 18, DDJJ: "DDJJ-TEST-001", postulante_titular: { nombre: "Juan", apellido: "Perez", dni: "45000123" }, estado_expediente: { id: 9, nombre: "SINI" }, fecha_creacion: "2026-03-06T12:00:00Z", visto: true }
    ]
};

const DetalleTS = () => {
    const [perfil, setPerfil] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Configuración de estilos estáticos para los estados de expedientes que ya venías usando
    const CONFIG_ESTADOS = {
        'SINI': { texto: 'Sin Iniciar', color: 'bg-gray-100 text-gray-800 border-gray-300' },
        '1V': { texto: '1ra Visita', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        'LEG': { texto: 'Legales', color: 'bg-purple-100 text-purple-800 border-purple-300' },
        'DOCP': { texto: 'Doc Presentada', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        'AP': { texto: 'Apto', color: 'bg-green-100 text-green-800 border-green-300' },
        'NOAP': { texto: 'No Apto', color: 'bg-red-100 text-red-800 border-red-300' },
        'NUEVAV': { texto: 'Nueva Visita', color: 'bg-teal-100 text-teal-800 border-teal-300' }
    };

    useEffect(() => {
        const fetchDetalleTS = async () => {
            try {
                setCargando(true);
                // Acá harías: const res = await usuarioService.getDetalleAuditoria(id)
                // setPerfil(res);
                setPerfil(mockData); // Simulando carga exitosa
            } catch (err) {
                setError("Error al cargar la auditoría del profesional.");
            } finally {
                setCargando(false);
            }
        };
        fetchDetalleTS();
    }, []);

    const toggleEstadoUsuario = () => {
        // Lógica futura para suspender o activar la cuenta desde el front de forma optimista
        setPerfil(prev => ({
            ...prev,
            datos_personales: {
                ...prev.datos_personales,
                activo: !prev.datos_personales.activo
            }
        }));
    };

    if (cargando) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center">
                <p className="text-gray-600 font-medium">Generando informe de auditoría...</p>
            </div>
        );
    }

    if (error || !perfil) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="bg-red-100 text-red-700 p-4 rounded-xl max-w-md text-center font-medium shadow-sm">{error}</div>
            </div>
        );
    }

    const { datos_personales, metricas, expedientes_asignados } = perfil;

    return (
        <div className="w-full min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
            <div className="w-full max-w-6xl flex flex-col gap-6">


                <div className="flex items-center justify-between">
                    <button className="flex items-center gap-2 text-gray-600 hover:text-slate-800 font-semibold transition group">
                        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Volver</span>
                    </button>
                </div>


                <div className="w-full bg-white shadow-sm border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">

                        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                            {datos_personales.nombre[0]}{datos_personales.apellido[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-gray-800 font-black text-2xl capitalize">
                                    {`${datos_personales.apellido} ${datos_personales.nombre}`}
                                </h2>
                                <span className={`w-2 h-2 rounded-full ${datos_personales.activo ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
                            </div>
                            <p className="text-gray-500 font-mono text-sm">Matrícula: {datos_personales.matricula || "---"}</p>
                            <p className="text-gray-400 text-xs mt-0.5">DNI: {datos_personales.dni} | {datos_personales.email}</p>
                        </div>
                    </div>


                    <button
                        onClick={toggleEstadoUsuario}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all duration-200 ${datos_personales.activo
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                    >
                        {datos_personales.activo ? (
                            <>
                                <NoSymbolIcon className="w-4 h-4" />
                                <span>Suspender TS</span>
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" />
                                <span>Reactivar TS</span>
                            </>
                        )}
                    </button>
                </div>


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Asignados Totales</p>
                            <h4 className="text-gray-800 font-black text-3xl mt-1">{metricas.total_asignados}</h4>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><BriefcaseIcon className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Nuevos Sin Ver</p>
                            <h4 className="text-red-600 font-black text-3xl mt-1">{metricas.nuevos_sin_ver}</h4>
                        </div>
                        <div className="p-3 bg-red-50 rounded-xl text-red-600"><EyeSlashIcon className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">En Proceso</p>
                            <h4 className="text-orange-600 font-black text-3xl mt-1">{metricas.en_proceso}</h4>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><ArrowPathIcon className="w-6 h-6" /></div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 font-semibold text-xs uppercase tracking-wider">Cerrados / Resueltos</p>
                            <h4 className="text-green-600 font-black text-3xl mt-1">{metricas.resueltos_finalizados}</h4>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-green-600"><CheckCircleIcon className="w-6 h-6" /></div>
                    </div>

                </div>


                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
                    <div className="mb-4">
                        <h3 className="text-gray-800 font-bold text-lg">Historial de Fichas Asignadas</h3>
                    </div>

                    <div className="overflow-x-auto">
                        {/* Desktop */}
                        <div className="hidden md:grid grid-cols-4 bg-gray-50 p-3 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-wider">
                            <span>DD.JJ</span>
                            <span>Titular</span>
                            <span>DNI</span>
                            <span>Estado Interno</span>
                        </div>

                        {expedientes_asignados.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 font-medium">
                                Esta Trabajadora Social no posee expedientes asignados.
                            </div>
                        ) : (
                            expedientes_asignados.map((e) => {
                                const codEstado = e.estado_expediente?.nombre;
                                const configEst = CONFIG_ESTADOS[codEstado] || { texto: codEstado || 'Sin Estado', color: 'bg-gray-100 text-gray-800' };

                                return (
                                    <div
                                        key={e.id}
                                        className="grid grid-cols-3 md:grid-cols-4 gap-2 items-center w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50/80 transition text-sm"
                                    >

                                        <span className={`text-gray-800 ${!e.visto ? "font-black text-blue-600" : "font-semibold"}`}>
                                            {e.DDJJ} {!e.visto && "👁️‍🗨️"}
                                        </span>
                                        <span className="text-gray-600 capitalize">
                                            {`${e.postulante_titular?.apellido} ${e.postulante_titular?.nombre}`}
                                        </span>
                                        <span className="text-gray-500 font-mono">{e.postulante_titular?.dni}</span>
                                        <div>
                                            <span className={`px-2.5 py-1 text-xs rounded-full border font-bold ${configEst.color}`}>
                                                {configEst.texto}
                                            </span>
                                        </div>
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