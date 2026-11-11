import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import AdminQuickLinks from '../AdminQuickLinks';
import { expedienteService } from '../../../services/expedientes/expediente';
import { usuarioService } from '../../../services/usuarios/usuarios';

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

const FILTROS_VACIOS = { estado: '', usuario_asignado: '', discapacidad: '', desde: '', hasta: '' };

const ExportarExpedientes = () => {
    const [filtros, setFiltros] = useState(FILTROS_VACIOS);
    const [trabajadoras, setTrabajadoras] = useState([]);
    const [descargando, setDescargando] = useState(false);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    // lista de trabajadoras sociales para el desplegable de filtro
    useEffect(() => {
        usuarioService.getTS()
            .then((data) => setTrabajadoras(Array.isArray(data) ? data : []))
            .catch(() => setTrabajadoras([]));
    }, []);

    const hayFiltros = useMemo(
        () => Object.values(filtros).some((v) => String(v).trim() !== ''),
        [filtros]
    );

    const cambiar = (campo) => (e) => {
        setExito(false);
        setFiltros((prev) => ({ ...prev, [campo]: e.target.value }));
    };

    const descargar = async () => {
        setDescargando(true);
        setError(null);
        setExito(false);
        try {
            const { cantidad } = await expedienteService.exportarExcel(filtros);
            if (cantidad === 0) {
                setError('No hay expedientes que coincidan con esos filtros. Probá con otros.');
            } else {
                setExito(true);
            }
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

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-5">
            <AdminQuickLinks excludePaths={["/exportar"]} />

            <div>
                <h2 className="text-gray-800 dark:text-slate-100 font-bold text-xl flex items-center gap-2">
                    <TableCellsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    Exportar expedientes a Excel
                </h2>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">
                    Genera un archivo Excel con el detalle de los expedientes y un resumen por estado.
                    Elegí los filtros (todos opcionales) y descargá.
                </p>
            </div>

            {/* FILTROS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <label className="text-xs text-gray-500 dark:text-slate-400">Trabajadora social</label>
                        <select value={filtros.usuario_asignado} onChange={cambiar('usuario_asignado')} className={claseInput}>
                            <option value="">Todas las trabajadoras sociales</option>
                            {trabajadoras.map((ts) => (
                                <option key={ts.id} value={ts.usuario}>{ts.nombre_completo}</option>
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
                        <label className="text-xs text-gray-500 dark:text-slate-400">Creados desde</label>
                        <input type="date" value={filtros.desde} onChange={cambiar('desde')} className={claseInput} />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 dark:text-slate-400">Creados hasta</label>
                        <input type="date" value={filtros.hasta} onChange={cambiar('hasta')} className={claseInput} />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => { setFiltros(FILTROS_VACIOS); setExito(false); }}
                            disabled={!hayFiltros}
                            className="w-full text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={descargar}
                        disabled={descargando}
                        className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium px-5 py-2.5 rounded-lg transition"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        {descargando ? 'Generando Excel...' : 'Descargar Excel'}
                    </button>

                    {exito && (
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                            ¡Listo! Se descargó el archivo.
                        </span>
                    )}
                    {error && (
                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExportarExpedientes;
