import { UsersIcon, ChevronDoubleUpIcon, ChevronDoubleDownIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { Link, useNavigate } from 'react-router';
import { auditoriaService } from '../../../services/auditoria/auditoria';
import AdminQuickLinks from '../AdminQuickLinks';
import { useToast } from '../../../context/ToastContext';
import { usePaginacion } from '../../../hooks/usePaginacion';
import Paginacion from '../../Paginacion/Paginacion';

// nombre visible de cada perfil: se ordena por este texto y no por el codigo del rol
const NOMBRE_PERFIL = { TS: 'Trabajadora Social', SU: 'Administrador', LG: 'Legales', DE: 'Mesa de Entrada' };

const Usuarios = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [perfilSeleccionado, setPerfilSeleccionado] = useState('Todos');
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    console.log('listaUsuarios :>> ', listaUsuarios);

    useEffect(() => {
        const fetchUsuariosYCasos = async () => {
            try {
                setCargando(true);
                setError(null);

                // las dos consultas en paralelo; los conteos vienen ya calculados del backend
                const [usuariosData, auditoriaResult] = await Promise.all([
                    usuarioService.getUsuarios(),
                    auditoriaService.getAuditoriaUsuarios().catch(() => null),
                ]);

                const metricasPorPerfil = new Map(
                    (auditoriaResult || []).map((item) => [
                        Number(item.usuario_id),
                        {
                            cantidad_casos: item.total_asignados ?? 0,
                            cantidad_vistos: item.total_vistos ?? 0
                        }
                    ])
                );

                // si fallaron los conteos se muestra "-" en lugar de ceros que parecerian reales
                const usuariosConCasos = usuariosData.map((usuario) => ({
                    ...usuario,
                    cantidad_casos: metricasPorPerfil.get(Number(usuario.id))?.cantidad_casos ?? null,
                    cantidad_vistos: metricasPorPerfil.get(Number(usuario.id))?.cantidad_vistos ?? null
                }));

                setListaUsuarios(usuariosConCasos);
            } catch (err) {
                console.error(err);
                setError("Ocurrió un error al cargar la lista de usuarios.");
            } finally {
                setCargando(false);
            }
        };

        fetchUsuariosYCasos();
    }, []);

    // antes de cambiar el estado se pregunta que hacer con sus casos (si tiene):
    // al darlo de baja, si es una ausencia temporal o definitiva; al reactivarlo, si se le devuelven
    const [confirmacion, setConfirmacion] = useState(null);

    const handleToggleActivo = async (usuario) => {
        const nuevoEstado = !usuario.activo;
        let casos = { en_poder: 0, devolvibles: 0 };
        try {
            casos = await usuarioService.casosBaja(usuario.id);
        } catch (err) {
            console.error("No se pudieron contar los casos del usuario", err);
        }

        if (!nuevoEstado && casos.en_poder > 0) {
            setConfirmacion({ usuario, tipo: 'baja', cantidad: casos.en_poder });
            return;
        }
        if (nuevoEstado && casos.devolvibles > 0) {
            setConfirmacion({ usuario, tipo: 'alta', cantidad: casos.devolvibles });
            return;
        }
        await aplicarCambioActivo(usuario, nuevoEstado);
    };

    const aplicarCambioActivo = async (usuario, nuevoEstado, opciones = {}) => {
        setConfirmacion(null);
        setListaUsuarios((prev) =>
            prev.map((u) => (u.id === usuario.id ? { ...u, activo: nuevoEstado } : u))
        );

        try {
            await usuarioService.cambiarEstadoActivo(usuario.id, nuevoEstado, opciones);
            if (opciones.reasignar_casos) {
                toast.success("Usuario dado de baja. Sus casos se repartieron entre los activos de su rol.");
                // los contadores de casos cambiaron: se recarga la lista
                setTimeout(() => window.location.reload(), 1200);
            } else if (opciones.devolver_casos) {
                toast.success("Usuario reactivado. Se le devolvieron sus casos.");
                setTimeout(() => window.location.reload(), 1200);
            }
        } catch (err) {
            console.error("No se pudo actualizar el estado del usuario", err);
            setListaUsuarios((prev) =>
                prev.map((u) => (u.id === usuario.id ? { ...u, activo: usuario.activo } : u))
            );
            toast.error("No se pudo actualizar el estado del usuario. Intentá nuevamente.");
        }
    };

    // orden por columna con las flechitas del encabezado (misma logica que la lista de expedientes)
    const [orden, setOrden] = useState({ key: null, direction: 'asc' });

    const pedirOrden = (key) => {
        setOrden((actual) => ({
            key,
            direction: actual.key === key && actual.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const iconoOrden = (key) => {
        if (orden.key !== key) {
            return <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-gray-400 dark:text-slate-500 opacity-50 group-hover:opacity-100" />;
        }
        return orden.direction === 'asc'
            ? <ChevronDoubleUpIcon className="w-4 h-4 ml-1 inline text-blue-600 dark:text-blue-400" />
            : <ChevronDoubleDownIcon className="w-4 h-4 ml-1 inline text-blue-600 dark:text-blue-400" />;
    };

    const valorOrden = (u, key) => {
        switch (key) {
            case 'nombre': return `${u.apellido || ''} ${u.nombre || ''}`.trim();
            case 'perfil': return NOMBRE_PERFIL[u.rol_display] || '';
            case 'dni': return Number(String(u.dni || '').replace(/\D/g, '')) || 0;
            case 'casos': return u.cantidad_casos ?? -1;
            case 'vistos': return u.cantidad_vistos ?? -1;
            case 'estado': return u.activo === false ? 'Inactivo' : 'Activo';
            default: return '';
        }
    };

    const usuariosFiltrados = useMemo(() => listaUsuarios.filter((u) => {
        const pasaPerfil = perfilSeleccionado === 'Todos' || u.rol_display === perfilSeleccionado;
        const textoBusqueda = busqueda.toLowerCase();


        const pasaBusqueda =
            u.nombre?.toLowerCase().includes(textoBusqueda) ||
            u.apellido?.toLowerCase().includes(textoBusqueda) ||
            u.dni?.includes(textoBusqueda);

        // los dados de baja no se borran nunca: se encuentran con el filtro "Inactivos" y se reactivan
        const pasaEstado = estadoSeleccionado === 'Todos'
            || (estadoSeleccionado === 'Activos' && u.activo !== false)
            || (estadoSeleccionado === 'Inactivos' && u.activo === false);

        return pasaPerfil && pasaBusqueda && pasaEstado;
    }).sort((a, b) => {
        if (!orden.key) return 0;
        const valA = valorOrden(a, orden.key);
        const valB = valorOrden(b, orden.key);
        const comparacion = typeof valA === 'string'
            ? valA.localeCompare(valB, 'es', { numeric: true, sensitivity: 'base' })
            : valA - valB;
        return orden.direction === 'asc' ? comparacion : -comparacion;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [listaUsuarios, perfilSeleccionado, estadoSeleccionado, busqueda, orden]);

    const { paginaActual, setPaginaActual, totalPaginas, itemsPaginados, totalItems } = usePaginacion(usuariosFiltrados);

    return (
        <div className="w-full flex justify-center items-start p-4 py-8">
            <div className="w-full max-w-6xl flex flex-col gap-4">

                <AdminQuickLinks excludePaths={["/usuarios"]} />

                <div className="w-full bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/30 border border-transparent dark:border-slate-800 rounded-2xl p-6 md:p-10 transition-colors">

                    <div>
                        <h3 className="text-gray-800 dark:text-slate-100 font-bold text-xl">
                            Usuarios
                        </h3>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                            <select
                                value={estadoSeleccionado}
                                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-200 font-medium cursor-pointer pr-2"
                            >
                                <option className="text-gray-800" value="Todos">Activos e inactivos</option>
                                <option className="text-gray-800" value="Activos">Solo activos</option>
                                <option className="text-gray-800" value="Inactivos">Solo inactivos (dados de baja)</option>
                            </select>
                        </div>
                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                            <select
                                value={perfilSeleccionado}
                                onChange={(e) => setPerfilSeleccionado(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-200 font-medium cursor-pointer pr-2"
                            >
                                <option className="text-gray-800" value="Todos">Todos los perfiles</option>
                                <option className="text-gray-800" value="SU">Administrador</option>
                                <option className="text-gray-800" value="TS">Trabajadora Social</option>
                                <option className="text-gray-800" value="DE">Mesa de Entrada</option>
                                <option className="text-gray-800" value="LG">Legales</option>
                            </select>
                        </div>

                        <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-transparent focus-within:border-gray-300 dark:focus-within:border-slate-600 transition">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido o DNI..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full bg-transparent outline-none text-gray-700 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
                            />
                        </div>

                        <Link
                            to="/crearUsuario"
                            className="flex items-center justify-between bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-sm transition"
                        >
                            <span className="font-semibold">Crear nuevo usuario</span>
                            <UsersIcon className="w-5 h-5 text-blue-100" />
                        </Link>
                    </div>

                    <div className="mt-6 overflow-x-auto">

                        <div className="hidden lg:grid grid-cols-6 gap-2 min-w-[880px] bg-gray-100 dark:bg-slate-800 p-3 rounded-lg text-gray-700 dark:text-slate-300 font-semibold text-sm">
                            {[
                                ['nombre', 'Nombre'],
                                ['perfil', 'Perfil'],
                                ['dni', 'DNI'],
                                ['casos', 'Total'],
                                ['vistos', 'Vistos'],
                                ['estado', 'Estado'],
                            ].map(([key, titulo]) => (
                                <button key={key} type="button" onClick={() => pedirOrden(key)} className="flex items-center text-left focus:outline-none group">
                                    <span>{titulo}</span> {iconoOrden(key)}
                                </button>
                            ))}
                        </div>

                        {/* en celular no hay encabezados: se ordena con este desplegable */}
                        <div className="lg:hidden mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300">
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
                                <option value="nombre:asc">Nombre (A-Z)</option>
                                <option value="nombre:desc">Nombre (Z-A)</option>
                                <option value="perfil:asc">Perfil (A-Z)</option>
                                <option value="dni:asc">DNI (menor a mayor)</option>
                                <option value="dni:desc">DNI (mayor a menor)</option>
                                <option value="casos:desc">Más expedientes</option>
                                <option value="casos:asc">Menos expedientes</option>
                                <option value="estado:asc">Activos primero</option>
                                <option value="estado:desc">Inactivos primero</option>
                            </select>
                        </div>


                        {cargando ? (
                            <div className="text-center p-8 text-gray-500 dark:text-slate-400 animate-pulse text-sm">
                                Cargando personal del IPVU...
                            </div>
                        ) : error ? (
                            <div className="text-center p-8 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20 text-sm mt-2">
                                {error}
                            </div>
                        ) : itemsPaginados.length === 0 ? (
                            <div className="text-center p-8 text-gray-400 dark:text-slate-500 text-sm">
                                No se encontraron usuarios con esos criterios.
                            </div>
                        ) : (
                            itemsPaginados.map((e) => (
                                <div
                                    key={e.id}
                                    onClick={() => navigate(`/DetalleUsuario/${e.id}`)}
                                    className={`grid grid-cols-2 gap-x-3 gap-y-2 mb-3 rounded-xl border border-gray-200 lg:mb-0 lg:rounded-none lg:border-0 lg:border-b lg:grid-cols-6 lg:gap-2 lg:min-w-[880px] items-center w-full text-left p-4 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${e.activo === false ? 'opacity-60' : ''}`}
                                >

                                    <span className="col-span-2 lg:col-span-1 font-semibold lg:font-normal text-gray-800 lg:text-gray-700 dark:text-slate-300 capitalize">{`${e.apellido} ${e.nombre}`}</span>

                                    <span className="text-gray-700">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold
                                                ${e.rol_display === 'TS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' : ''}
                                                ${e.rol_display === 'SU' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300' : ''}
                                                ${e.rol_display === 'LG' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' : ''}
                                                ${e.rol_display === 'DE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' : ''}
                                            `}>
                                            {e.rol_display === 'TS' && 'Trabajadora Social'}
                                            {e.rol_display === 'SU' && 'Administrador'}
                                            {e.rol_display === 'LG' && 'Legales'}
                                            {e.rol_display === 'DE' && 'Mesa de Entrada'}
                                        </span>
                                    </span>


                                    <span className="text-gray-700 dark:text-slate-300 font-mono text-sm lg:text-base"><span className="lg:hidden font-sans text-xs text-gray-400">DNI </span>{e.dni || "---"}</span>


                                    {/* todos los roles manejan expedientes: se muestran los conteos de cada usuario */}
                                    <span className="text-gray-700 text-sm text-left">
                                        {e.cantidad_casos !== null ? (
                                            <span className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded-full text-xs font-semibold text-gray-600 dark:text-slate-300">
                                                {e.cantidad_casos} expedientes
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-slate-500 pl-4">-</span>
                                        )}
                                    </span>

                                    <span className="text-gray-700 text-sm text-left">
                                        {e.cantidad_vistos !== null ? (
                                            <span className="bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-full text-xs font-semibold text-green-700 dark:text-green-400">
                                                {e.cantidad_vistos} vistos
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-slate-500 pl-4">-</span>
                                        )}
                                    </span>

                                    <span>
                                        <button
                                            type="button"
                                            onClick={(ev) => {
                                                ev.stopPropagation();
                                                handleToggleActivo(e);
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition ${e.activo !== false
                                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30 dark:hover:bg-green-500/20'
                                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {e.activo !== false ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>

                    {!cargando && !error && (
                        <Paginacion
                            paginaActual={paginaActual}
                            totalPaginas={totalPaginas}
                            onCambiarPagina={setPaginaActual}
                            totalItems={totalItems}
                        />
                    )}
                </div>
            </div>

            {confirmacion && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setConfirmacion(null)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 flex flex-col gap-4"
                        onClick={(ev) => ev.stopPropagation()}
                    >
                        {confirmacion.tipo === 'baja' ? (
                            <>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                        Desactivar a {confirmacion.usuario.nombre} {confirmacion.usuario.apellido}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                                        Tiene <span className="font-semibold">{confirmacion.cantidad}</span> expediente(s) en su poder. ¿Qué hacemos con ellos?
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => aplicarCambioActivo(confirmacion.usuario, false)}
                                    className="text-left border border-gray-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl p-3 transition"
                                >
                                    <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">Ausencia temporal (vacaciones, licencia)</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Sus casos quedan a su nombre, esperándolo para cuando vuelva.</p>
                                </button>
                                {!confirmacion.pasoDefinitiva ? (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmacion({ ...confirmacion, pasoDefinitiva: true, dni: '' })}
                                        className="text-left border border-gray-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl p-3 transition"
                                    >
                                        <p className="font-semibold text-sm text-gray-800 dark:text-slate-100">Baja definitiva (renuncia)</p>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Sus casos se reparten por turno entre los usuarios activos de su rol. Si vuelve, al reactivarlo se le pueden devolver.</p>
                                    </button>
                                ) : (
                                    <div className="border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 rounded-xl p-3 flex flex-col gap-2">
                                        <p className="text-sm text-gray-800 dark:text-slate-100">
                                            Para confirmar la <span className="font-semibold">baja definitiva</span>, escribí el DNI de {confirmacion.usuario.nombre} {confirmacion.usuario.apellido}:
                                        </p>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoFocus
                                            value={confirmacion.dni}
                                            onChange={(ev) => setConfirmacion({ ...confirmacion, dni: ev.target.value })}
                                            placeholder="DNI del usuario"
                                            className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 outline-none focus:ring-1 focus:ring-red-400"
                                        />
                                        <button
                                            type="button"
                                            disabled={confirmacion.dni.replace(/\./g, '').trim() !== String(confirmacion.usuario.dni ?? '').replace(/\./g, '').trim()}
                                            onClick={() => aplicarCambioActivo(confirmacion.usuario, false, { reasignar_casos: true, confirmar_dni: confirmacion.dni })}
                                            className="bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                                        >
                                            Dar de baja y repartir sus casos
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                                        Reactivar a {confirmacion.usuario.nombre} {confirmacion.usuario.apellido}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                                        Al darlo de baja se repartieron <span className="font-semibold">{confirmacion.cantidad}</span> expediente(s) suyos que siguen sin moverse. ¿Se los devolvemos?
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => aplicarCambioActivo(confirmacion.usuario, true, { devolver_casos: true })}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                                >
                                    Reactivar y devolverle sus casos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => aplicarCambioActivo(confirmacion.usuario, true)}
                                    className="border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 text-sm font-medium px-4 py-2 rounded-lg transition"
                                >
                                    Solo reactivar
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            onClick={() => setConfirmacion(null)}
                            className="text-sm text-gray-500 dark:text-slate-400 hover:underline self-center"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Usuarios;
