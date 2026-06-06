import React, { useState } from 'react';
import {
    ChevronDownIcon,
    BellIcon,
    ChevronDoubleUpIcon,
    ChevronDoubleDownIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Expedientes = () => {
    const expedientesData = [
        {
            ddjj: "DJ-001",
            titular: "María López",
            dni: "32.456.789",
            estado: "Sin Iniciar",
            entrevistada: "No",
            ultimaModificacion: "05/11/2024 09:30"
        },
        {
            ddjj: "DJ-002",
            titular: "Roberto Sánchez",
            dni: "29.876.543",
            estado: "1ª Visita",
            entrevistada: "Si",
            ultimaModificacion: "10/11/2024 14:15"
        },
        {
            ddjj: "DJ-003",
            titular: "Ana Martínez",
            dni: "31.234.567",
            estado: "Legales",
            entrevistada: "Si",
            ultimaModificacion: "09/11/2024 11:20"
        },
        {
            ddjj: "DJ-004",
            titular: "Jorge Pérez",
            dni: "30.123.456",
            estado: "Doc. Presentada",
            entrevistada: "Si",
            ultimaModificacion: "08/11/2024 16:45"
        },
        {
            ddjj: "DJ-005",
            titular: "Laura Gómez",
            dni: "28.987.654",
            estado: "Apto",
            entrevistada: "Si",
            ultimaModificacion: "07/11/2024 10:00"
        },
        {
            ddjj: "DJ-006",
            titular: "Carlos Díaz",
            dni: "33.456.789",
            estado: "Nueva Visita",
            entrevistada: "Si",
            ultimaModificacion: "06/11/2024 13:30"
        }
    ];

    // Estados
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState(""); // NUEVO: Estado para el buscador
    const count = 2;

    // Función para cambiar el criterio de ordenamiento
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const cleanDni = (dniString) => parseInt(dniString.replace(/\./g, ''), 10);

    // Función auxiliar para quitar acentos/tildes de un texto
    const removeAccents = (str) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    // 1. FILTRADO: Filtramos por DD.JJ, Titular o DNI eliminando tildes de la búsqueda y de los datos
    const expedientesFiltrados = expedientesData.filter((e) => {
        const term = removeAccents(searchTerm.toLowerCase().trim());

        const ddjjMatch = removeAccents(e.ddjj.toLowerCase()).includes(term);
        const titularMatch = removeAccents(e.titular.toLowerCase()).includes(term);
        const dniMatch = e.dni.replace(/\./g, '').includes(term) || e.dni.includes(term);

        return ddjjMatch || titularMatch || dniMatch;
    });

    // 2. ORDENAMIENTO: Ordenamos los elementos que ya pasaron el filtro del buscador
    const expedientesFinales = [...expedientesFiltrados].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'dni') {
            valA = cleanDni(valA);
            valB = cleanDni(valB);
        }

        if (valA < valB) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
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

    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">

                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Seguimiento de fichas
                    </h3>
                    <p className="text-gray-600 font-light">
                        Vista general de todos los expedientes en el sistema
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-700 font-medium">
                            Todos los estados
                        </span>
                        <ChevronDownIcon className="w-5 h-5" />
                    </div>

                    {/* BUSCADOR FUNCIONAL */}
                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm border border-transparent focus-within:border-gray-300 transition">
                        <input
                            type="text"
                            placeholder="Buscar por DD.JJ, nombre o DNI..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)} // Vinculamos el input al estado
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <span className="text-gray-800 font-semibold">
                            Nuevo Expediente
                        </span>

                        <div className="relative inline-block">
                            <BellIcon className="w-6 h-6 text-yellow-600" />
                            <span
                                className={`absolute -top-1 -right-1 flex items-center justify-center
                                min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white rounded-full
                                ${count === 0 ? "bg-black" : "bg-red-500"}`}
                            >
                                {count}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    {/* Encabezado Mobile */}
                    <div className="grid grid-cols-3 gap-2 md:hidden bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <button onClick={() => requestSort('ddjj')} className="flex items-center text-left focus:outline-none group">
                            <span>DD.JJ</span> {renderSortIcon('ddjj')}
                        </button>
                        <button onClick={() => requestSort('titular')} className="flex items-center text-left focus:outline-none group">
                            <span>Titular</span> {renderSortIcon('titular')}
                        </button>
                        <button onClick={() => requestSort('dni')} className="flex items-center text-left focus:outline-none group">
                            <span>DNI</span> {renderSortIcon('dni')}
                        </button>
                    </div>

                    {/* Encabezado Desktop */}
                    <div className="hidden md:grid grid-cols-6 bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
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
                        <span>Entrevistada</span>
                        <span>Última Modificación</span>
                    </div>

                    {/* RENDERIZADO CONDICIONAL: Si no hay resultados muestra el mensaje, sino muestra la lista */}
                    {expedientesFinales.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 font-medium border-b">
                            No se encontraron expedientes que coincidan con "{searchTerm}"
                        </div>
                    ) : (
                        expedientesFinales.map((e) => (
                            <Link
                                to="/DetalleExpediente"
                                key={e.ddjj}
                                className="grid grid-cols-3 md:grid-cols-6 gap-2 items-center w-full text-left p-4 border-b hover:bg-gray-50 transition"
                            >
                                <span className="font-medium text-gray-800">{e.ddjj}</span>
                                <span className="text-gray-700">{e.titular}</span>
                                <span className="text-gray-700">{e.dni}</span>

                                <span className="hidden md:block">{e.estado}</span>

                                <span className="hidden md:block">
                                    <span
                                        className={`px-2 py-1 text-sm rounded-lg border font-medium ${e.entrevistada === "Si"
                                            ? "text-green-700 bg-green-100 border-green-600"
                                            : "text-red-700 bg-red-100 border-red-600"
                                            }`}
                                    >
                                        {e.entrevistada}
                                    </span>
                                </span>

                                <span className="hidden md:block">
                                    {e.ultimaModificacion}
                                </span>
                            </Link>
                        ))
                    )}
                </div>

                <div className="mt-15">
                    <Link to="/form1">
                        <button className="w-50 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm">Primer Formulario</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Expedientes;