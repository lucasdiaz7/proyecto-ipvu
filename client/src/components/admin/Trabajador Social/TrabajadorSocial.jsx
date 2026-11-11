import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { auditoriaService } from '../../../services/auditoria/auditoria';
import AdminQuickLinks from '../AdminQuickLinks';
import { usePaginacion } from '../../../hooks/usePaginacion';
import Paginacion from '../../Paginacion/Paginacion';
import { useOrden } from '../../../hooks/useOrden';
import { EncabezadoOrden, SelectorOrden } from '../../Orden/Orden';

const COLUMNAS_TS = [
    ['matricula', 'Matrícula'],
    ['nombre', 'Nombre'],
    ['dni', 'DNI'],
    ['total', 'Total'],
    ['vistos', 'Vistos'],
    ['enEjecucion', 'En ejecución'],
];

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

    const { ordenados, orden, setOrden, pedirOrden } = useOrden(tsFiltrados, {
        matricula: (ts) => ts.matricula || '',
        nombre: (ts) => `${ts.apellido || ''} ${ts.nombre || ''}`.trim(),
        dni: (ts) => Number(String(ts.dni || '').replace(/\D/g, '')) || 0,
        total: (ts) => obtenerMetricasTS(ts).total,
        vistos: (ts) => obtenerMetricasTS(ts).vistos,
        enEjecucion: (ts) => obtenerMetricasTS(ts).enEjecucion,
    });

    const { paginaActual, setPaginaActual, totalPaginas, itemsPaginados, totalItems } = usePaginacion(ordenados);

    if (cargando) {
        return (
            <div className="w-full flex justify-center items-start p-4 py-8">
                <div className="text-center py-20 text-gray-600 dark:text-slate-300 font-medium">
                    Cargando equipo de Trabajadoras Sociales...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center items-start p-4 py-8">
            <div className="w-full max-w-6xl flex flex-col gap-4">

                <AdminQuickLinks excludePaths={["/trabajadoraSocial"]} />

                <div className="w-full bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/30 border border-transparent dark:border-slate-800 rounded-2xl p-6 md:p-10 transition-colors">
                    {error && (
                        <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <h3 className="text-gray-800 dark:text-slate-100 font-bold text-xl">
                            Trabajadoras Sociales
                        </h3>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4">
                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-slate-600 transition">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, matrícula o DNI..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        <div className="hidden lg:grid grid-cols-6 gap-2 min-w-[900px] bg-gray-100 dark:bg-slate-800 p-3 rounded-lg text-gray-700 dark:text-slate-300 font-semibold text-sm">
                            {COLUMNAS_TS.map(([columna, titulo]) => (
                                <EncabezadoOrden key={columna} columna={columna} titulo={titulo} orden={orden} onOrdenar={pedirOrden} />
                            ))}
                        </div>
                        <SelectorOrden columnas={COLUMNAS_TS} orden={orden} setOrden={setOrden} />

                        {!error && itemsPaginados.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-slate-400 font-medium border-b dark:border-slate-800">
                                No se encontraron Trabajadoras Sociales registradas en el sistema.
                            </div>
                        ) : (
                            itemsPaginados.map((ts) => {
                                const metricas = obtenerMetricasTS(ts);

                                return (
                                    <Link
                                        key={ts.matricula || ts.id}
                                        to={`/DetalleUsuario/${ts.id}`}
                                        className="grid grid-cols-3 gap-x-3 gap-y-2 mb-3 rounded-xl border border-gray-200 lg:mb-0 lg:rounded-none lg:border-0 lg:border-b lg:grid-cols-6 lg:gap-2 lg:min-w-[900px] items-center w-full text-left p-4 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition"
                                    >
                                        {/* en celular: tarjeta con el nombre arriba y cada dato con su etiqueta */}
                                        <span className="col-span-3 lg:col-span-1 order-2 lg:order-none font-medium text-gray-800 dark:text-slate-100 font-mono text-sm lg:text-base"><span className="lg:hidden font-sans text-xs text-gray-400">Matrícula </span>{ts.matricula || "---"}</span>
                                        <span className="col-span-3 lg:col-span-1 order-1 lg:order-none font-semibold lg:font-normal text-gray-800 lg:text-gray-700 dark:text-slate-300 capitalize">{`${ts.apellido} ${ts.nombre}`}</span>
                                        <span className="col-span-3 lg:col-span-1 order-3 lg:order-none text-gray-700 dark:text-slate-300 font-mono text-sm lg:text-base"><span className="lg:hidden font-sans text-xs text-gray-400">DNI </span>{ts.dni || "---"}</span>
                                        <span className="order-4 lg:order-none text-gray-700 dark:text-slate-300 font-semibold"><span className="lg:hidden block text-xs font-normal text-gray-400">Total</span>{metricas.total}</span>
                                        <span className="order-5 lg:order-none text-green-700 dark:text-green-400 font-semibold"><span className="lg:hidden block text-xs font-normal text-gray-400">Vistos</span>{metricas.vistos}</span>
                                        <span className="order-6 lg:order-none text-gray-700 dark:text-slate-300 font-semibold"><span className="lg:hidden block text-xs font-normal text-gray-400">En ejecución</span>{metricas.enEjecucion}</span>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {!error && (
                        <Paginacion
                            paginaActual={paginaActual}
                            totalPaginas={totalPaginas}
                            onCambiarPagina={setPaginaActual}
                            totalItems={totalItems}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrabajadorSocial;
