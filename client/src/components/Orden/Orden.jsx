import React from 'react';
import { ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/outline';

// Titulo de columna clickeable con las flechitas de orden (se usa junto con el hook useOrden)
export const EncabezadoOrden = ({ columna, titulo, orden, onOrdenar }) => {
    const activa = orden.key === columna;
    const Icono = activa && orden.direction === 'desc' ? ChevronDoubleDownIcon : ChevronDoubleUpIcon;
    return (
        <button type="button" onClick={() => onOrdenar(columna)} className="flex items-center text-left focus:outline-none group">
            <span>{titulo}</span>
            <Icono className={`w-4 h-4 ml-1 inline ${activa
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-400 dark:text-slate-500 opacity-50 group-hover:opacity-100'}`} />
        </button>
    );
};

// En celular las listas se ven como tarjetas sin encabezado: se ordena con este desplegable.
// `columnas` es una lista de [clave, titulo]; cada una aparece de menor a mayor y de mayor a menor.
export const SelectorOrden = ({ columnas, orden, setOrden, className = 'lg:hidden' }) => (
    <div className={`${className} mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300`}>
        <span>Ordenar por</span>
        <select
            value={orden.key ? `${orden.key}:${orden.direction}` : ''}
            onChange={(ev) => {
                const [key, direction] = ev.target.value.split(':');
                setOrden({ key: key || null, direction: direction || 'asc' });
            }}
            className="px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none"
        >
            <option value="">Sin orden</option>
            {columnas.map(([key, titulo]) => (
                <React.Fragment key={key}>
                    <option value={`${key}:asc`}>{titulo} (menor a mayor)</option>
                    <option value={`${key}:desc`}>{titulo} (mayor a menor)</option>
                </React.Fragment>
            ))}
        </select>
    </div>
);
