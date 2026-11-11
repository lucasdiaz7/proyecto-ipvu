import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import AdminQuickLinks from '../AdminQuickLinks';
import { expedienteService } from '../../../services/expedientes/expediente';
import { usePaginacion } from '../../../hooks/usePaginacion';
import Paginacion from '../../Paginacion/Paginacion';
import { useOrden } from '../../../hooks/useOrden';
import { EncabezadoOrden, SelectorOrden } from '../../Orden/Orden';

const COLUMNAS_EXPORTAR = [
    ['id', 'Nº'],
    ['titular', 'Titular'],
    ['dni', 'DNI'],
    ['ddjj', 'DDJJ'],
    ['estado', 'Estado'],
    ['en_poder', 'En poder de'],
    ['creado', 'Creado'],
];

// estados del expediente (coinciden con EstadoExpediente.tipo_estado del backend)
const ESTADOS = [
    { codigo: 'SINI', nombre: 'Sin Iniciar' },
    { codigo: '1V', nombre: '1ra Visita' },
    { codigo: 'LEG', nombre: 'Legales' },
    { codigo: 'DOCP', nombre: 'Doc Presentada' },
    { codigo: 'AP', nombre: 'Apto' },
    { codigo: 'NOAP', nombre: 'No Apto' },
    { codigo: 'NUEVAV', nombre: 'Nueva Visita' },
];
const NOMBRE_ESTADO = Object.fromEntries(ESTADOS.map(({ codigo, nombre }) => [codigo, nombre]));

const FILTROS_VACIOS = { busqueda: '', estado: '', usuario_asignado: '', discapacidad: '', archivo: '', desde: '', hasta: '' };

const nombreUsuario = (usuario) => [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || 'Sin nombre';

// Se listan TODOS los expedientes; los filtros achican la lista y los que quedan salen tildados.
// El superadmin destilda los que no quiere y exporta. Los destildados se guardan por id, asi que
// siguen destildados al cambiar de pagina o de filtro.
const ExportarExpedientes = () => {
    const [expedientes, setExpedientes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);
    const [excluidos, setExcluidos] = useState(() => new Set());
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(null);

    useEffect(() => {
        expedienteService.getExpediente()
            .then((data) => setExpedientes([...data].sort((a, b) => b.id - a.id)))
            .catch((err) => {
                console.error('Error al cargar expedientes:', err);
                setError('No se pudieron cargar los expedientes.');
            })
            .finally(() => setCargando(false));
    }, []);

    // usuarios que tienen algun expediente en su poder (de cualquier rol), para el filtro "En poder de"
    const usuariosConExpedientes = useMemo(() => {
        const porId = new Map();
        expedientes.forEach((exp) => {
            if (exp.usuario_asignado?.id) porId.set(exp.usuario_asignado.id, exp.usuario_asignado);
        });
        return [...porId.values()].sort((a, b) => nombreUsuario(a).localeCompare(nombreUsuario(b)));
    }, [expedientes]);

    const filtrados = useMemo(() => {
        const texto = filtros.busqueda.trim().toLowerCase();
        return expedientes.filter((exp) => {
            const titular = exp.postulante_titular || {};
            if (texto) {
                const campos = [titular.nombre, titular.apellido, titular.dni, exp.DDJJ, String(exp.id)];
                if (!campos.some((campo) => String(campo ?? '').toLowerCase().includes(texto))) return false;
            }
            if (filtros.estado && exp.estado_expediente !== filtros.estado) return false;
            if (filtros.usuario_asignado && String(exp.usuario_asignado?.id) !== filtros.usuario_asignado) return false;
            if (filtros.discapacidad && String(Boolean(titular.tiene_discapacidad)) !== filtros.discapacidad) return false;
            if (filtros.archivo === 'activos' && exp.archivado) return false;
            if (filtros.archivo === 'archivados' && !exp.archivado) return false;
            if (filtros.desde || filtros.hasta) {
                if (!exp.fecha_creacion) return false;
                const fecha = new Date(exp.fecha_creacion).toLocaleDateString('en-CA');
                if (filtros.desde && fecha < filtros.desde) return false;
                if (filtros.hasta && fecha > filtros.hasta) return false;
            }
            return true;
        });
    }, [expedientes, filtros]);

    const seleccionados = useMemo(() => filtrados.filter((exp) => !excluidos.has(exp.id)), [filtrados, excluidos]);
    const todosTildados = filtrados.length > 0 && seleccionados.length === filtrados.length;
    const hayFiltros = Object.values(filtros).some((v) => String(v).trim() !== '');

    const { ordenados, orden, setOrden, pedirOrden } = useOrden(filtrados, {
        id: (exp) => exp.id,
        titular: (exp) => `${exp.postulante_titular?.apellido || ''} ${exp.postulante_titular?.nombre || ''}`.trim(),
        dni: (exp) => Number(String(exp.postulante_titular?.dni || '').replace(/\D/g, '')) || 0,
        ddjj: (exp) => exp.DDJJ || '',
        estado: (exp) => NOMBRE_ESTADO[exp.estado_expediente] || '',
        en_poder: (exp) => (exp.usuario_asignado ? nombreUsuario(exp.usuario_asignado) : ''),
        creado: (exp) => (exp.fecha_creacion ? new Date(exp.fecha_creacion).getTime() : 0),
    });

    const { paginaActual, setPaginaActual, totalPaginas, itemsPaginados, totalItems } = usePaginacion(ordenados);

    const cambiar = (campo) => (e) => {
        setExito(null);
        setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));
    };

    const alternarUno = (id) => {
        setExito(null);
        setExcluidos((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
            return nuevo;
        });
    };

    // tilda o destilda todos los que coinciden con los filtros (todas las paginas)
    const alternarTodos = () => {
        setExito(null);
        setExcluidos((prev) => {
            const nuevo = new Set(prev);
            filtrados.forEach((exp) => (todosTildados ? nuevo.add(exp.id) : nuevo.delete(exp.id)));
            return nuevo;
        });
    };

    const descargar = async () => {
        if (seleccionados.length === 0) return;
        setDescargando(true);
        setError(null);
        setExito(null);
        try {
            await expedienteService.exportarExcelSeleccion(seleccionados.map((exp) => exp.id));
            setExito(seleccionados.length);
        } catch (err) {
            console.error('Error al exportar expedientes:', err);
            setError('No se pudo generar el Excel. Intentá de nuevo.');
        } finally {
            setDescargando(false);
        }
    };

    const claseInput = "w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 " +
        "bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 " +
        "focus:ring-blue-400 focus:border-blue-400 transition";
    const claseCheckbox = "w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer";

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-5">
            <AdminQuickLinks excludePaths={["/exportar"]} />

            <div>
                <h2 className="text-gray-800 dark:text-slate-100 font-bold text-xl flex items-center gap-2">
                    <TableCellsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Exportar expedientes a Excel
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                    Filtrá la lista y destildá los expedientes que no quieras incluir. Se exportan solo los tildados,
                    con el detalle de cada uno y un resumen por estado.
                </p>
            </div>

            {/* FILTROS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Buscar</label>
                        <input type="text" value={filtros.busqueda} onChange={cambiar('busqueda')}
                            placeholder="Nombre, DNI, DDJJ o Nº de expediente" className={claseInput} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Estado</label>
                        <select value={filtros.estado} onChange={cambiar('estado')} className={claseInput}>
                            <option value="">Todos los estados</option>
                            {ESTADOS.map(({ codigo, nombre }) => (
                                <option key={codigo} value={codigo}>{nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">En poder de</label>
                        <select value={filtros.usuario_asignado} onChange={cambiar('usuario_asignado')} className={claseInput}>
                            <option value="">Todos los usuarios</option>
                            {usuariosConExpedientes.map((usuario) => (
                                <option key={usuario.id} value={String(usuario.id)}>{nombreUsuario(usuario)}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Discapacidad</label>
                        <select value={filtros.discapacidad} onChange={cambiar('discapacidad')} className={claseInput}>
                            <option value="">Todos</option>
                            <option value="true">Con discapacidad</option>
                            <option value="false">Sin discapacidad</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Archivo</label>
                        <select value={filtros.archivo} onChange={cambiar('archivo')} className={claseInput}>
                            <option value="">Activos y archivados</option>
                            <option value="activos">Solo activos</option>
                            <option value="archivados">Solo archivados</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Creados desde</label>
                        <input type="date" value={filtros.desde} onChange={cambiar('desde')} className={claseInput} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Creados hasta</label>
                        <input type="date" value={filtros.hasta} onChange={cambiar('hasta')} className={claseInput} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={descargar}
                        disabled={descargando || seleccionados.length === 0}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        {descargando ? 'Generando Excel...' : `Exportar ${seleccionados.length} al Excel`}
                    </button>
                    <span className="text-sm text-gray-600 dark:text-slate-300">
                        {seleccionados.length} tildados de {filtrados.length} que coinciden
                        {excluidos.size > 0 && ` · ${excluidos.size} destildado(s) a mano`}
                    </span>
                    <div className="flex gap-2 sm:ml-auto">
                        {excluidos.size > 0 && (
                            <button type="button" onClick={() => { setExcluidos(new Set()); setExito(null); }}
                                className="text-sm px-3 py-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                                Volver a tildar todo
                            </button>
                        )}
                        {hayFiltros && (
                            <button type="button" onClick={() => { setFiltros(FILTROS_VACIOS); setExito(null); }}
                                className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {exito !== null && (
                    <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        ¡Listo! Se descargó el Excel con {exito} expediente(s).
                    </p>
                )}
                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
            </div>

            {/* LISTA */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm overflow-x-auto">
                <div className="hidden md:grid grid-cols-[2rem_4rem_1fr_7rem_6rem_9rem_1fr_6rem] gap-3 items-center px-2 pb-2 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">
                    <input type="checkbox" checked={todosTildados} onChange={alternarTodos} disabled={filtrados.length === 0}
                        title="Tildar o destildar todos los que coinciden con los filtros" className={claseCheckbox} />
                    {COLUMNAS_EXPORTAR.map(([columna, titulo]) => (
                        <EncabezadoOrden key={columna} columna={columna} titulo={titulo} orden={orden} onOrdenar={pedirOrden} />
                    ))}
                </div>
                <SelectorOrden className="md:hidden mt-2" columnas={COLUMNAS_EXPORTAR} orden={orden} setOrden={setOrden} />

                {/* en celular no hay encabezado: el tildar todos va arriba de las tarjetas */}
                <label className="md:hidden flex items-center gap-2 px-2 pb-2 border-b border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-300">
                    <input type="checkbox" checked={todosTildados} onChange={alternarTodos} disabled={filtrados.length === 0} className={claseCheckbox} />
                    Tildar todos los que coinciden
                </label>

                {cargando ? (
                    <p className="text-center p-8 text-gray-500 dark:text-slate-400 animate-pulse text-sm">Cargando expedientes...</p>
                ) : itemsPaginados.length === 0 ? (
                    <p className="text-center p-8 text-gray-400 dark:text-slate-500 text-sm">No hay expedientes que coincidan con los filtros.</p>
                ) : (
                    itemsPaginados.map((exp) => {
                        const tildado = !excluidos.has(exp.id);
                        const titular = exp.postulante_titular || {};
                        return (
                            <label
                                key={exp.id}
                                className={`grid grid-cols-[2rem_1fr] md:grid-cols-[2rem_4rem_1fr_7rem_6rem_9rem_1fr_6rem] gap-x-3 gap-y-0.5 items-center px-2 py-2.5 border-b border-gray-100 dark:border-slate-800 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/60 transition ${tildado ? '' : 'opacity-50'}`}
                            >
                                <input type="checkbox" checked={tildado} onChange={() => alternarUno(exp.id)} className={`${claseCheckbox} md:row-auto row-span-3`} />
                                <span className="text-gray-500 dark:text-slate-400 md:block hidden">{exp.id}</span>
                                <span className="font-medium text-gray-800 dark:text-slate-100 capitalize">
                                    {`${titular.apellido || ''} ${titular.nombre || ''}`.trim() || 'Sin titular'}
                                    <span className="md:hidden text-gray-400 font-normal"> · Nº {exp.id}</span>
                                </span>
                                <span className="text-gray-600 dark:text-slate-300 font-mono text-xs md:text-sm">
                                    <span className="md:hidden font-sans text-gray-400">DNI </span>{titular.dni || '---'}
                                    <span className="md:hidden font-sans text-gray-400"> · DDJJ {exp.DDJJ || '---'}</span>
                                </span>
                                <span className="hidden md:block text-gray-600 dark:text-slate-300">{exp.DDJJ || '---'}</span>
                                <span className="text-gray-600 dark:text-slate-300 text-xs md:text-sm">
                                    {NOMBRE_ESTADO[exp.estado_expediente] || exp.estado_expediente}
                                    {exp.archivado && <span className="ml-1 text-teal-600 dark:text-teal-400">(archivado)</span>}
                                    <span className="md:hidden text-gray-400"> · {exp.usuario_asignado ? nombreUsuario(exp.usuario_asignado) : 'Sin asignar'}</span>
                                </span>
                                <span className="hidden md:block text-gray-600 dark:text-slate-300 capitalize">
                                    {exp.usuario_asignado ? nombreUsuario(exp.usuario_asignado) : 'Sin asignar'}
                                </span>
                                <span className="hidden md:block text-gray-500 dark:text-slate-400">
                                    {exp.fecha_creacion ? new Date(exp.fecha_creacion).toLocaleDateString('es-AR') : '---'}
                                </span>
                            </label>
                        );
                    })
                )}

                {!cargando && (
                    <Paginacion
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        onCambiarPagina={setPaginaActual}
                        totalItems={totalItems}
                    />
                )}
            </div>
        </div>
    );
};

export default ExportarExpedientes;
