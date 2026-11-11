import { useMemo, useState } from 'react';

// Orden por columna para las listas (flechitas del encabezado o desplegable en celular).
// `valores` dice como sacar el valor de cada columna: { nombre: (item) => item.apellido, ... }.
// Los textos se comparan "naturalmente" (DDJJ 20 antes que 100, sin importar tildes ni mayusculas);
// los numeros y fechas (pasadas como numero) se comparan como numeros.
export const useOrden = (items = [], valores = {}, ordenInicial = { key: null, direction: 'asc' }) => {
    const [orden, setOrden] = useState(ordenInicial);

    // primer clic en una columna: ascendente; segundo clic: descendente
    const pedirOrden = (key) => {
        setOrden((actual) => ({
            key,
            direction: actual.key === key && actual.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const ordenados = useMemo(() => {
        const obtenerValor = valores[orden.key];
        if (!orden.key || !obtenerValor) return items;
        return [...items].sort((a, b) => {
            const valA = obtenerValor(a);
            const valB = obtenerValor(b);
            const comparacion = typeof valA === 'number' && typeof valB === 'number'
                ? valA - valB
                : String(valA ?? '').localeCompare(String(valB ?? ''), 'es', { numeric: true, sensitivity: 'base' });
            return orden.direction === 'asc' ? comparacion : -comparacion;
        });
    // los extractores de `valores` se definen en cada render: alcanza con la columna elegida
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, orden]);

    return { ordenados, orden, setOrden, pedirOrden };
};
