import { UsersIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { usuarioService } from '../../../services/usuarios/usuarios';
import { Link, useNavigate } from 'react-router-dom';
import { auditoriaService } from '../../../services/auditoria/auditoria';

const obtenerUsuarioId = (usuario) => Number(usuario?.usuario ?? usuario?.id);

const usuarioEsTS = (usuario) => usuario?.rol_display === 'TS';

const Usuarios = () => {
    const navigate = useNavigate();
    const [listaUsuarios, setListaUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [perfilSeleccionado, setPerfilSeleccionado] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        const fetchUsuariosYCasos = async () => {
            try {
                setCargando(true);
                setError(null);

                const usuariosData = await usuarioService.getUsuarios();
                const auditoriaResult = await auditoriaService.getAuditoriaUsuarios()
                    .catch(() => null);

                let metricasPorPerfil = new Map();

                const auditoriaTieneVistos = auditoriaResult?.every((item) => item.total_vistos !== undefined);

                if (auditoriaResult && auditoriaTieneVistos) {
                    metricasPorPerfil = new Map(
                        auditoriaResult.map((item) => [
                            Number(item.usuario_id),
                            {
                                cantidad_casos: item.total_asignados ?? 0,
                                cantidad_vistos: item.total_vistos ?? 0
                            }
                        ])
                    );
                } else {
                    const expedientesData = await auditoriaService.getExpedientes()
                        .catch(() => []);

                    metricasPorPerfil = usuariosData.reduce((mapa, usuario) => {
                        const usuarioId = obtenerUsuarioId(usuario);
                        const casosAsignados = expedientesData.filter((exp) => Number(exp.usuario_asignado?.id) === usuarioId);

                        mapa.set(Number(usuario.id), {
                            cantidad_casos: casosAsignados.length,
                            cantidad_vistos: casosAsignados.filter((exp) => exp.visto).length
                        });

                        return mapa;
                    }, new Map());
                }

                const usuariosConCasos = usuariosData.map((usuario) => ({
                    ...usuario,
                    cantidad_casos: metricasPorPerfil.get(Number(usuario.id))?.cantidad_casos ?? 0,
                    cantidad_vistos: metricasPorPerfil.get(Number(usuario.id))?.cantidad_vistos ?? 0
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

    const usuariosFiltrados = listaUsuarios.filter((u) => {
        const pasaPerfil = perfilSeleccionado === 'Todos' || u.rol_display === perfilSeleccionado;
        const textoBusqueda = busqueda.toLowerCase();


        const pasaBusqueda =
            u.nombre?.toLowerCase().includes(textoBusqueda) ||
            u.apellido?.toLowerCase().includes(textoBusqueda) ||
            u.dni?.includes(textoBusqueda);

        return pasaPerfil && pasaBusqueda;
    });

    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">

                <div>
                    <h3 className="text-gray-800 font-bold text-xl">
                        Usuarios
                    </h3>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition">
                        <select
                            value={perfilSeleccionado}
                            onChange={(e) => setPerfilSeleccionado(e.target.value)}
                            className="w-full bg-transparent outline-none text-gray-700 font-medium cursor-pointer pr-2"
                        >
                            <option value="Todos">Todos los perfiles</option>
                            <option value="SU">Administrador</option>
                            <option value="TS">Trabajadora Social</option>
                            <option value="DE">Administrativa</option>
                            <option value="LG">Legales</option>
                        </select>
                    </div>

                    <div className="bg-gray-100 p-3 rounded-xl shadow-sm">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, apellido o DNI..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full bg-transparent outline-none text-gray-700"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl shadow-sm hover:bg-gray-200 transition cursor-pointer">
                        <Link to="/crearUsuario" className="text-gray-700 font-medium w-full block">
                            Crear nuevo usuario
                        </Link>
                        <UsersIcon className="w-6 h-6 text-gray-800" />
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">

                    <div className="grid grid-cols-6 gap-2 min-w-[880px] bg-gray-100 p-3 rounded-lg text-gray-700 font-semibold text-sm">
                        <span>ID</span>
                        <span>Nombre</span>
                        <span>Perfil</span>
                        <span>DNI</span>
                        <span>Total</span>
                        <span>Vistos</span>
                    </div>


                    {cargando ? (
                        <div className="text-center p-8 text-gray-500 animate-pulse text-sm">
                            Cargando personal del IPVU...
                        </div>
                    ) : error ? (
                        <div className="text-center p-8 text-red-600 bg-red-50 rounded-xl border border-red-100 text-sm mt-2">
                            {error}
                        </div>
                    ) : usuariosFiltrados.length === 0 ? ( // Cambiado a usuariosFiltrados para que muestre el aviso si la búsqueda no da resultados
                        <div className="text-center p-8 text-gray-400 text-sm">
                            No se encontraron usuarios con esos criterios.
                        </div>
                    ) : (
                        usuariosFiltrados.map((e) => (
                                <button
                                    key={e.id}
                                    onClick={() => {
                                        if (usuarioEsTS(e)) {
                                            navigate(`/DetalleTS/${e.id}`);
                                        }
                                    }}
                                    className="grid grid-cols-6 gap-2 items-center w-full min-w-[880px] text-left p-4 border-b hover:bg-gray-50 transition"
                                >

                                    <span className="font-medium text-gray-800">#{e.id}</span>


                                    <span className="text-gray-700 capitalize">{`${e.apellido} ${e.nombre}`}</span>

                                    <span className="text-gray-700">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold
                                            ${e.rol_display === 'TS' ? 'bg-blue-100 text-blue-700' : ''}
                                            ${e.rol_display === 'SU' ? 'bg-purple-100 text-purple-700' : ''}
                                            ${e.rol_display === 'LG' ? 'bg-green-100 text-green-700' : ''}
                                            ${e.rol_display === 'DE' ? 'bg-amber-100 text-amber-700' : ''}
                                        `}>
                                            {e.rol_display === 'TS' && 'Trabajadora Social'}
                                            {e.rol_display === 'SU' && 'Administrador'}
                                            {e.rol_display === 'LG' && 'Legales'}
                                            {e.rol_display === 'DE' && 'Data Entry'}
                                        </span>
                                    </span>


                                    <span className="text-gray-700 font-mono">{e.dni || "---"}</span>


                                    <span className="text-gray-700 text-sm text-left">
                                        {usuarioEsTS(e) ? (
                                            <span className="bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold text-gray-600">
                                                {e.cantidad_casos ?? 0} expedientes
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 pl-4">-</span>
                                        )}
                                    </span>

                                    <span className="text-gray-700 text-sm text-left">
                                        {usuarioEsTS(e) ? (
                                            <span className="bg-green-50 px-2 py-1 rounded-full text-xs font-semibold text-green-700">
                                                {e.cantidad_vistos ?? 0} vistos
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 pl-4">-</span>
                                        )}
                                    </span>
                                </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Usuarios;
