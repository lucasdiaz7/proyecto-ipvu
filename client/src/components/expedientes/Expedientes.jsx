import React, { useEffect, useState } from 'react';
import {
    ChevronDownIcon,
    BellIcon,
    ChevronDoubleUpIcon,
    ChevronDoubleDownIcon,
    CheckIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { expedienteService } from '../../services/expedientes/expediente';

const Expedientes = () => {
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [expedientes, setExpedientes] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState("");
    const [expId, setexpId] = useState([]);

    const [selectedEstado, setSelectedEstado] = useState("TODOS");
    const [menuAbierto, setMenuAbierto] = useState(false);

    const count = 2;

    useEffect(() => {
        const Exp = async () => {
            try {
                setCargando(true);
                const data = await expedienteService.getExpediente();
                console.log('dataExpComp :>> ', data);
                setExpedientes(data);
            } catch (err) {
                console.log(err);
                setError("Error al cargar la lista de expedientes");
            } finally {
                setCargando(false);
            }
        };

        Exp();
    }, []);

    console.log('expedientes :>> ', expedientes);

    const CONFIG_ESTADOS = {
        'SINI': { texto: 'Sin Iniciar', color: 'bg-gray-100 text-gray-800 border-gray-300', dot: 'bg-gray-400' },
        '1V': { texto: '1ra Visita', color: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
        'LEG': { texto: 'Legales', color: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
        'DOCP': { texto: 'Doc Presentada', color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' },
        'AP': { texto: 'Apto', color: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' },
        'NOAP': { texto: 'No Apto', color: 'bg-red-100 text-red-800 border-red-300', dot: 'bg-red-500' },
        'NUEVAV': { texto: 'Nueva Visita', color: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-500' }
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

    const expedientesPorEstado = expedientes.filter((e) => {
        if (selectedEstado === "TODOS") return true;
        return e.estado_expediente?.nombre === selectedEstado;
    });

    const expedientesFiltrados = expedientesPorEstado.filter((e) => {
        const term = removeAccents(searchTerm.toLowerCase().trim());
        const ddjj = e.DDJJ ? removeAccents(e.DDJJ.toLowerCase()) : "";

        const esObjetoPostulante = e.postulante_titular && typeof e.postulante_titular === 'object';
        const nombreTitular = esObjetoPostulante
            ? removeAccents(`${e.postulante_titular.nombre} ${e.postulante_titular.apellido}`.toLowerCase())
            : "";
        const dniTitular = esObjetoPostulante ? (e.postulante_titular.dni || "") : "";

        return ddjj.includes(term) || nombreTitular.includes(term) || dniTitular.replace(/\./g, '').includes(term) || dniTitular.includes(term);
    });

    const expedientesFinales = [...expedientesFiltrados].sort((a, b) => {
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

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) {
            return <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-gray-400 opacity-50 group-hover:opacity-100" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-blue-600 font-bold" />
        ) : (
            <ChevronDoubleDownIcon className="w-4 h-4 ml-1 inline text-blue-600 font-bold" />
        );
    };

    if (cargando) {
        return <div className="text-center py-20 text-gray-600 font-medium">Cargando expedientes autorizados...</div>;
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-center font-medium">{error}</div>}

                <div>
                    <h3 className="text-gray-800 font-bold text-xl">Seguimiento de fichas</h3>
                    <p className="text-gray-600 font-light">Vista general de todos los expedientes en el sistema</p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 relative">

                    <div className="relative">
                        <button
                            onClick={() => setMenuAbierto(!menuAbierto)}
                            className="w-full flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition focus:outline-none"
                        >
                            <div className="flex items-center space-x-2">
                                <FunnelIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700 font-medium">
                                    {selectedEstado === "TODOS" ? "Todos los estados" : `Estado: ${CONFIG_ESTADOS[selectedEstado]?.texto}`}
                                </span>
                                {selectedEstado !== "TODOS" && (
                                    <span className={`w-2 h-2 rounded-full ${CONFIG_ESTADOS[selectedEstado]?.dot}`}></span>
                                )}
                            </div>
                            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${menuAbierto ? "rotate-180" : ""}`} />
                        </button>

                        {menuAbierto && (
                            <div className="absolute z-30 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2 max-h-60 overflow-y-auto backdrop-blur-lg bg-white/95">
                                <button
                                    onClick={() => { setSelectedEstado("TODOS"); setMenuAbierto(false); }}
                                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                                >
                                    <span className={selectedEstado === "TODOS" ? "font-semibold text-blue-600" : ""}>Todos los estados</span>
                                    {selectedEstado === "TODOS" && <CheckIcon className="w-4 h-4 text-blue-600" />}
                                </button>
                                <div className="border-b border-gray-100 my-1"></div>

                                {Object.keys(CONFIG_ESTADOS).map((clave) => {
                                    const item = CONFIG_ESTADOS[clave];
                                    const esActivo = selectedEstado === clave;
                                    return (
                                        <button
                                            key={clave}
                                            onClick={() => { setSelectedEstado(clave); setMenuAbierto(false); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                                        >
                                            <div className="flex items-center space-x-2.5">
                                                <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>
                                                <span className={esActivo ? "font-semibold text-blue-600" : ""}>{item.texto}</span>
                                            </div>
                                            {esActivo && <CheckIcon className="w-4 h-4 text-blue-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm border border-transparent focus-within:border-gray-300 transition">
                        <input
                            type="text"
                            placeholder="Buscar por DD.JJ, nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-800 font-semibold">Nuevo Expediente</span>
                        <div className="relative inline-block">
                            <BellIcon className="w-6 h-6 text-yellow-600" />
                            <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white rounded-full ${count === 0 ? "bg-black" : "bg-red-500"}`}>
                                {count}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <div className="hidden md:grid grid-cols-5 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
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
                    </div>

                    {expedientesFinales.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron expedientes que coincidan con los filtros aplicados.
                        </div>
                    ) : (
                        expedientesFinales.map((e) => {
                            const esObjeto = e.postulante_titular && typeof e.postulante_titular === 'object';
                            const nombre = esObjeto ? e.postulante_titular.nombre : "Sin Registrar";
                            const apellido = esObjeto ? e.postulante_titular.apellido : "";
                            const dni = esObjeto ? e.postulante_titular.dni : "---";

                            const codEstado = e.estado_expediente?.nombre;
                            const configEst = CONFIG_ESTADOS[codEstado] || { texto: codEstado || 'Sin Estado', color: 'bg-gray-100 text-gray-800' };

                            const fechaFormateada = e.fecha_creacion ? new Date(e.fecha_creacion).toLocaleDateString('es-AR') : '---';

                            return (
                                <Link
                                    to="/DetalleExpediente"
                                    key={e.id}
                                    className="grid grid-cols-3 md:grid-cols-5 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition"
                                >
                                    <span className="font-bold text-gray-800">{e.DDJJ || "---"}</span>
                                    <span className="text-gray-700 capitalize">{`${nombre} ${apellido}`}</span>
                                    <span className="text-gray-700 font-mono">{dni}</span>

                                    <span>
                                        <span className={`px-3 py-1 text-xs rounded-full border font-semibold ${configEst.color}`}>
                                            {configEst.texto}
                                        </span>
                                    </span>

                                    <span className="hidden md:block text-gray-500 text-sm">{fechaFormateada}</span>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Expedientes;