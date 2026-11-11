import React, { useEffect, useState, useMemo } from 'react'; // 1. Importamos useMemo
import {
    ChevronDownIcon,
    BellIcon,
    ChevronDoubleUpIcon,
    ChevronDoubleDownIcon,
    CheckIcon,
    FunnelIcon,
    UserPlusIcon,
    DocumentPlusIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router';
import { expedienteService } from '../../services/expedientes/expediente';
import AdminQuickLinks from '../admin/AdminQuickLinks';
import { nombreUsuarioAsignado } from '../../utils/expedienteHelpers';
import { usePaginacion } from '../../hooks/usePaginacion';
import Paginacion from '../Paginacion/Paginacion';

const obtenerCodigoEstado = (expediente) => {
    if (!expediente?.estado_expediente) return null;
    if (typeof expediente.estado_expediente === 'string') return expediente.estado_expediente;
    return expediente.estado_expediente.nombre;
};

const Expedientes = () => {
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [expedientes, setExpedientes] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEstado, setSelectedEstado] = useState("TODOS");
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [verSoloNuevos] = useState(false);
    // los expedientes archivados (ultimo paso, despues de imprimir) salen del listado normal: boton "Archivados"
    const [verArchivados, setVerArchivados] = useState(false);
    const [diasMinimos, setDiasMinimos] = useState('');
    const [creadoDesde, setCreadoDesde] = useState('');
    const [creadoHasta, setCreadoHasta] = useState('');
    const [panelNuevosAbierto, setPanelNuevosAbierto] = useState(false);

    const rolId = Number(localStorage.getItem('rol_id'));
    // Mesa de Entrada y Administrador ven además quién tiene el expediente y hace cuántos días
    const mostrarAsignacion = rolId === 3 || rolId === 4;

    console.log('expedientes :>> ', expedientes);


    const expedientesNuevos = useMemo(() => expedientes.filter(e => e.visto === false), [expedientes]);
    const nuevosCount = expedientesNuevos.length;
    const archivadosCount = useMemo(
        () => expedientes.filter(e => e.archivado).length,
        [expedientes]
    );
    const hayFiltrosExtra = diasMinimos !== '' || creadoDesde !== '' || creadoHasta !== '';

    useEffect(() => {
        const cargarExpedientes = async () => {
            try {
                setCargando(true);
                setError(null);

                const data = await expedienteService.getExpediente();
                setExpedientes(data);
            } catch (err) {
                console.log(err);
                setError("Error al cargar la lista de expedientes");
            } finally {
                setCargando(false);
            }
        };

        cargarExpedientes();
    }, []);

    const handleManejarVisto = async (id, yaVisto) => {
        if (yaVisto) return;
        try {
            setExpedientes(prevExpedientes =>
                prevExpedientes.map(exp =>
                    exp.id === id ? { ...exp, visto: true } : exp
                )
            );
            await expedienteService.marcarComoVisto(id);
        } catch (err) {
            console.log("No se pudo guardar el estado 'visto' en el servidor", err);
            setExpedientes(prevExpedientes =>
                prevExpedientes.map(exp =>
                    exp.id === id ? { ...exp, visto: false } : exp
                )
            );
        }
    };

    const CONFIG_ESTADOS = {
        'SINI': { texto: 'Sin Iniciar', color: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600', dot: 'bg-gray-400' },
        '1V': { texto: '1ra Visita', color: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30', dot: 'bg-blue-500' },
        'LEG': { texto: 'Legales', color: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30', dot: 'bg-purple-500' },
        'DOCP': { texto: 'Doc Presentada', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30', dot: 'bg-orange-500' },
        'AP': { texto: 'Apto', color: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30', dot: 'bg-green-500' },
        'NOAP': { texto: 'No Apto', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30', dot: 'bg-red-500' },
        'NUEVAV': { texto: 'Nueva Visita', color: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30', dot: 'bg-teal-500' }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const cleanDni = (dniString) => {
        if (!dniString) return 0;
        return parseInt(dniString.toString().replace(/\./g, ''), 10);
    };

    const removeAccents = (str) => {
        if (!str) return "";
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };


    // Esto asegura rendimiento óptimo y evita disparos en cadena hacia el DOM
    const expedientesFinales = useMemo(() => {
        // Filtrar por estado
        const porEstado = expedientes.filter((e) => {
            if (selectedEstado === "TODOS") return true;
            return obtenerCodigoEstado(e) === selectedEstado;
        });

        // Filtrar por término de búsqueda
        const porTermino = porEstado.filter((e) => {
            const term = removeAccents(searchTerm.toLowerCase().trim());
            const ddjj = e.DDJJ ? removeAccents(e.DDJJ.toLowerCase()) : "";
            const esObjetoPostulante = e.postulante_titular && typeof e.postulante_titular === 'object';
            const nombreTitular = esObjetoPostulante
                ? removeAccents(`${e.postulante_titular.nombre} ${e.postulante_titular.apellido}`.toLowerCase())
                : "";
            const dniTitular = esObjetoPostulante ? (e.postulante_titular.dni || "") : "";

            return ddjj.includes(term) || nombreTitular.includes(term) || dniTitular.replace(/\./g, '').includes(term) || dniTitular.includes(term);
        });

        // Filtrar por estado de lectura "visto"
        const porVistoBase = porTermino.filter((e) => {
            if (verSoloNuevos) return e.visto === false;
            return true;
        });

        // archivados: solo se ven con el boton "Archivados"
        const porArchivo = porVistoBase.filter((e) => {
            const archivado = Boolean(e.archivado);
            if (verArchivados) return archivado;
            return !archivado;
        });

        // dias en poder (minimo) y rango de fecha de creacion (fecha local, AAAA-MM-DD)
        const porVisto = porArchivo.filter((e) => {
            if (diasMinimos !== '' && (e.dias_en_poder ?? 0) < Number(diasMinimos)) return false;
            if (creadoDesde || creadoHasta) {
                if (!e.fecha_creacion) return false;
                const fecha = new Date(e.fecha_creacion).toLocaleDateString('en-CA');
                if (creadoDesde && fecha < creadoDesde) return false;
                if (creadoHasta && fecha > creadoHasta) return false;
            }
            return true;
        });

        // Ordenar el resultado final
        return [...porVisto].sort((a, b) => {
            if (!sortConfig.key) return 0;

            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];

            if (sortConfig.key === 'ddjj') { valA = a.DDJJ; valB = b.DDJJ; }
            if (sortConfig.key === 'dni') {
                valA = cleanDni(typeof a.postulante_titular === 'object' ? a.postulante_titular?.dni : "");
                valB = cleanDni(typeof b.postulante_titular === 'object' ? b.postulante_titular?.dni : "");
            }
            if (sortConfig.key === 'titular') {
                valA = typeof a.postulante_titular === 'object' ? a.postulante_titular?.nombre : "";
                valB = typeof b.postulante_titular === 'object' ? b.postulante_titular?.nombre : "";
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [expedientes, selectedEstado, searchTerm, verSoloNuevos, verArchivados, diasMinimos, creadoDesde, creadoHasta, sortConfig]);

    const { paginaActual, setPaginaActual, totalPaginas, itemsPaginados, totalItems } = usePaginacion(expedientesFinales);

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-gray-400 dark:text-slate-500 opacity-50 group-hover:opacity-100" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-blue-600 dark:text-blue-400 font-bold" />
        ) : (
            <ChevronDoubleDownIcon className="w-4 h-4 ml-1 inline text-blue-600 dark:text-blue-400 font-bold" />
        );
    };

    if (cargando) {
        return <div className="text-center py-20 text-gray-600 dark:text-slate-300 font-medium">Cargando expedientes autorizados...</div>;
    }

    return (
        <div className="w-full flex justify-center items-start p-4 py-8">
            <div className="w-full max-w-6xl flex flex-col gap-4">

                {rolId === 4 && <AdminQuickLinks excludePaths={["/expedientes"]} />}

                <div className="w-full bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/30 border border-transparent dark:border-slate-800 rounded-2xl p-6 md:p-10 transition-colors">
                    {error && <div className="bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 p-3 rounded-lg mb-4 text-center font-medium">{error}</div>}

                    <div>
                        <h3 className="text-gray-800 dark:text-slate-100 font-bold text-xl">Seguimiento de fichas</h3>
                    </div>

                    <div className={`mt-6 grid grid-cols-1 ${rolId === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 relative`}>

                        <div className="relative">
                            <button
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                className="w-full flex items-center justify-between bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition focus:outline-none"
                            >
                                <div className="flex items-center space-x-2">
                                    <FunnelIcon className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                    <span className="text-gray-700 dark:text-slate-200 font-medium">
                                        {selectedEstado === "TODOS" ? "Todos los estados" : `Estado: ${CONFIG_ESTADOS[selectedEstado]?.texto}`}
                                    </span>
                                    {selectedEstado !== "TODOS" && (
                                        <span className={`w-2 h-2 rounded-full ${CONFIG_ESTADOS[selectedEstado]?.dot}`}></span>
                                    )}
                                </div>
                                <ChevronDownIcon className={`w-4 h-4 text-gray-500 dark:text-slate-400 transition-transform duration-200 ${menuAbierto ? "rotate-180" : ""}`} />
                            </button>

                            {menuAbierto && (
                                <div className="absolute z-30 mt-2 w-full bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 max-h-60 overflow-y-auto backdrop-blur-lg">
                                    <button
                                        onClick={() => { setSelectedEstado("TODOS"); setMenuAbierto(false); }}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition text-left"
                                    >
                                        <span className={selectedEstado === "TODOS" ? "font-semibold text-blue-600 dark:text-blue-400" : ""}>Todos los estados</span>
                                        {selectedEstado === "TODOS" && <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                    </button>
                                    <div className="border-b border-gray-100 dark:border-slate-700 my-1"></div>

                                    {Object.keys(CONFIG_ESTADOS).map((clave) => {
                                        const item = CONFIG_ESTADOS[clave];
                                        const esActivo = selectedEstado === clave;
                                        return (
                                            <button
                                                key={clave}
                                                onClick={() => { setSelectedEstado(clave); setMenuAbierto(false); }}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition text-left"
                                            >
                                                <div className="flex items-center space-x-2.5">
                                                    <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
                                                    <span className={esActivo ? "font-semibold text-blue-600 dark:text-blue-400" : ""}>{item.texto}</span>
                                                </div>
                                                {esActivo && <CheckIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-slate-600 transition">
                            <input
                                type="text"
                                placeholder="Buscar por DD.JJ, nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                            />
                        </div>

                        {rolId === 4 && (
                            <Link to="/crearUsuario" className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-sm transition">
                                <span className="font-semibold">Crear Usuario</span>
                                <UserPlusIcon className="w-5 h-5 text-blue-100" />
                            </Link>
                        )}

                        {rolId === 3 && (
                            <Link to="/nuevoExpediente" className="flex items-center justify-between bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl shadow-sm transition">
                                <span className="font-semibold">Crear Expediente</span>
                                <DocumentPlusIcon className="w-5 h-5 text-green-100" />
                            </Link>
                        )}

                        {rolId === 1 && (
                            <div className="relative">
                            <button
                                onClick={() => setPanelNuevosAbierto(!panelNuevosAbierto)}
                                className="flex items-center justify-between p-3 rounded-xl shadow-sm transition focus:outline-none w-full bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            >
                                <span className="font-semibold">
                                    {nuevosCount === 1 ? "1 expediente nuevo" : `${nuevosCount} expedientes nuevos`}
                                </span>

                                <div className="relative inline-block">
                                    <BellIcon className="w-6 h-6 text-yellow-600" />
                                    <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white rounded-full ${nuevosCount === 0 ? "bg-black" : "bg-red-500"}`}>
                                        {nuevosCount}
                                    </span>
                                </div>
                            </button>

                            {/* resumen de cada expediente nuevo; al hacer clic se abre */}
                            {panelNuevosAbierto && (
                                <div className="absolute z-30 mt-2 w-full min-w-[280px] right-0 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 max-h-80 overflow-y-auto">
                                    {expedientesNuevos.length === 0 ? (
                                        <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-slate-400">
                                            No tenés expedientes nuevos sin ver.
                                        </p>
                                    ) : (
                                        expedientesNuevos.map((e) => {
                                            const titular = e.postulante_titular && typeof e.postulante_titular === 'object' ? e.postulante_titular : null;
                                            return (
                                                <Link
                                                    key={e.id}
                                                    to={`/Expediente/${e.id}`}
                                                    onClick={() => handleManejarVisto(e.id, e.visto)}
                                                    className="block px-4 py-3 border-b border-gray-100 dark:border-slate-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                                                >
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 capitalize">
                                                        {titular ? `${titular.apellido} ${titular.nombre}` : 'Sin titular'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                        DNI {titular?.dni || '---'} · DDJJ {e.DDJJ || '---'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                                        {titular?.domicilio ? `${titular.domicilio} · ` : ''}
                                                        Recibido hace {e.dias_en_poder ?? 0} día(s)
                                                    </p>
                                                </Link>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                            </div>
                        )}

                    </div>

                    <div className="mt-4 flex flex-wrap items-end gap-3">
                        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                            Días en poder (mínimo)
                            <input
                                type="number"
                                min="0"
                                value={diasMinimos}
                                onChange={(ev) => setDiasMinimos(ev.target.value)}
                                placeholder="Ej: 10"
                                className="w-36 px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                            Creados desde
                            <input
                                type="date"
                                value={creadoDesde}
                                onChange={(ev) => setCreadoDesde(ev.target.value)}
                                className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs text-gray-500 dark:text-slate-400">
                            Creados hasta
                            <input
                                type="date"
                                value={creadoHasta}
                                onChange={(ev) => setCreadoHasta(ev.target.value)}
                                className="px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-blue-400"
                            />
                        </label>
                        {hayFiltrosExtra && (
                            <button
                                type="button"
                                onClick={() => { setDiasMinimos(''); setCreadoDesde(''); setCreadoHasta(''); }}
                                className="px-3 py-2 text-sm rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                            >
                                Limpiar
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setVerArchivados(!verArchivados)}
                            className={`ml-auto px-3 py-2 text-sm font-medium rounded-lg border transition ${verArchivados
                                ? 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
                                : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            {verArchivados ? 'Volver a los activos' : `Archivados (${archivadosCount})`}
                        </button>
                    </div>

                    <div className="mt-6 overflow-x-auto">
                        {/* en tarjetas no hay encabezados para ordenar: se ordena con este desplegable */}
                        <div className="lg:hidden mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
                            <span>Ordenar por</span>
                            <select
                                value={sortConfig.key ? `${sortConfig.key}:${sortConfig.direction}` : ''}
                                onChange={(ev) => {
                                    const [key, direction] = ev.target.value.split(':');
                                    setSortConfig({ key: key || null, direction: direction || 'asc' });
                                }}
                                className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none"
                            >
                                <option value="">Sin orden</option>
                                <option value="titular:asc">Titular (A-Z)</option>
                                <option value="titular:desc">Titular (Z-A)</option>
                                <option value="dni:asc">DNI (menor a mayor)</option>
                                <option value="dni:desc">DNI (mayor a menor)</option>
                                <option value="ddjj:asc">DD.JJ (A-Z)</option>
                                <option value="ddjj:desc">DD.JJ (Z-A)</option>
                            </select>
                        </div>

                        {/* en celular y tablet vertical se muestran tarjetas; la tabla, desde pantallas grandes */}
                        <div className={`hidden lg:grid ${mostrarAsignacion ? 'grid-cols-7 min-w-[1180px]' : 'grid-cols-6 min-w-[960px]'} gap-2 bg-gray-100 dark:bg-slate-800 p-3 rounded-lg text-gray-700 dark:text-slate-300 font-semibold text-sm`}>
                            <button onClick={() => requestSort('ddjj')} className="flex items-center text-left focus:outline-none group">
                                <span>DD.JJ</span> {renderSortIcon('ddjj')}
                            </button>
                            <button onClick={() => requestSort('titular')} className="flex items-center text-left focus:outline-none group">
                                <span>Titular</span> {renderSortIcon('titular')}
                            </button>
                            <button onClick={() => requestSort('dni')} className="flex items-center text-left focus:outline-none group">
                                <span>DNI</span> {renderSortIcon('dni')}
                            </button>
                            <span>Estado</span>
                            <span>Fecha Creación</span>
                            {mostrarAsignacion && <span>Usuario Asignado</span>}
                            <span>Días en Poder</span>
                        </div>

                        {itemsPaginados.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-slate-400 font-medium border-b dark:border-slate-800">
                                {verArchivados
                                    ? "No hay expedientes archivados."
                                    : "No se encontraron expedientes que coincidan con los filtros aplicados."}
                            </div>
                        ) : (
                            itemsPaginados.map((e) => {
                                const esObjeto = e.postulante_titular && typeof e.postulante_titular === 'object';
                                const nombre = esObjeto ? e.postulante_titular.nombre : "Sin Registrar";
                                const apellido = esObjeto ? e.postulante_titular.apellido : "";
                                const dni = esObjeto ? e.postulante_titular.dni : "---";


                                const codEstado = e.estado_expediente;

                                const configEst = CONFIG_ESTADOS[codEstado] || { texto: codEstado || 'Sin Estado', color: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200' };

                                const fechaFormateada = e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleDateString('es-AR') : '---';

                                return (
                                    <React.Fragment key={e.id}>
                                    {/* tarjeta: celular y tablet */}
                                    <Link
                                        to={`/Expediente/${e.id}`}
                                        onClick={() => handleManejarVisto(e.id, e.visto)}
                                        className="lg:hidden block mb-3 p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-slate-100 capitalize truncate">{`${apellido} ${nombre}`}</p>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                                                    DNI <span className="font-mono">{dni}</span> · DDJJ {e.DDJJ || "---"}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 px-2.5 py-1 text-[11px] rounded-full border font-semibold ${configEst.color}`}>
                                                {configEst.texto}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
                                            <span>Creado: {fechaFormateada}</span>
                                            {mostrarAsignacion && (
                                                <span className="capitalize">En poder de: {nombreUsuarioAsignado(e)}</span>
                                            )}
                                            <span>{e.dias_en_poder ?? 0} días en poder</span>
                                            {e.visto === false && rolId === 1 && (
                                                <span className="font-semibold text-red-600 dark:text-red-400">Nuevo</span>
                                            )}
                                        </div>
                                    </Link>

                                    {/* fila de la tabla: pantallas grandes */}
                                    <Link
                                        to={`/Expediente/${e.id}`}
                                        onClick={() => handleManejarVisto(e.id, e.visto)}
                                        className={`hidden lg:grid ${mostrarAsignacion ? 'grid-cols-7 min-w-[1180px]' : 'grid-cols-6 min-w-[960px]'} gap-2 items-center w-full text-left p-4 border-b dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition`}
                                    >
                                        <span className="font-bold text-gray-800 dark:text-slate-100">{e.DDJJ || "---"}</span>
                                        <span className="text-gray-700 dark:text-slate-300 capitalize">{`${apellido} ${nombre}`}</span>
                                        <span className="text-gray-700 dark:text-slate-300 font-mono">{dni}</span>

                                        <span>
                                            <span className={`px-3 py-1 text-xs rounded-full border font-semibold ${configEst.color}`}>
                                                {configEst.texto}
                                            </span>
                                        </span>

                                        <span className="text-gray-500 dark:text-slate-400 text-sm">{fechaFormateada}</span>

                                        {mostrarAsignacion && (
                                            <span className="text-gray-700 dark:text-slate-300 text-sm capitalize">
                                                {nombreUsuarioAsignado(e)}
                                            </span>
                                        )}
                                        <span className="text-gray-700 dark:text-slate-300 text-sm">
                                            {e.dias_en_poder ?? 0} días
                                        </span>
                                    </Link>
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>

                    <Paginacion
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        onCambiarPagina={setPaginaActual}
                        totalItems={totalItems}
                    />
                </div>
            </div>
        </div>
    );
};

export default Expedientes;
