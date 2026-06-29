import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom';
import { expedienteService } from '../../services/expedientes/expediente';
import { form1Service } from '../../services/Formularios/form1Service';
import { usuarioService } from '../../services/usuarios/usuarios';
import { historial } from '../../services/historial/historial';
import { AdjuntarArchivos } from '../Archivos/AdjuntarArchivo';

const DetailExpedientes = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [expediente, setExpediente] = useState(null)
    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [formulario, setFormulario] = useState(null)
    const [mensajePase, setMensajePase] = useState('')
    const [errorMensaje, setErrorMensaje] = useState(false)
    const [listaUsuario, setlistaUsuario] = useState(null)
    const [rolSeleccionado, setRolSeleccionado] = useState('');
    const [usuarioDestino, setUsuarioDestino] = useState('');
    const [historialPases, setHistorialPases] = useState([]);
    const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);

    console.log('historialPases :>> ', historialPases);
    console.log('usuarioDestino :>> ', usuarioDestino);

    const rolId = Number(localStorage.getItem('rol_id'));
    const usuarioLogueado = String(localStorage.getItem('usuarioLogueado'))
    console.log('usuarioLogueado :>> ', usuarioLogueado);
    console.log('expediente :>> ', expediente);

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                setCargando(true);
                setError(null);

                const dataExpediente = await expedienteService.getExpedienteId(id);
                setExpediente(dataExpediente);

                // Traemos la lista completa de todos los formularios del sistema
                const todosLosFormularios = await form1Service.obtenerTodosLosFormularios();

                // Buscamos el formulario específico de ESTE expediente
                if (Array.isArray(todosLosFormularios)) {
                    const formularioFiltrado = todosLosFormularios.find(
                        (form) => Number(form.expediente) === Number(id)
                    );
                    setFormulario(formularioFiltrado || null);
                }

                const usuarios = await usuarioService.getUsuarios()
                const usuarioFiltr = usuarios.filter((u) => String(u.username_display) !== String(usuarioLogueado))
                setlistaUsuario(usuarioFiltr)

                // Usamos el servicio optimizado inyectándole el ID del expediente
                const pasesFiltrados = await historial.obtenerPasesPorExpediente(id)

                if (Array.isArray(pasesFiltrados)) {
                    setHistorialPases(pasesFiltrados);
                } else {
                    setHistorialPases([]);
                }

            } catch (error) {
                console.error("Error al procesar la información:", error);
                setError("No se pudo sincronizar el estado del formulario técnico.");
            } finally {
                setCargando(false);
            }
        };

        if (id) {
            obtenerDatos();
        }
    }, [id, usuarioLogueado]);

    console.log('listaUsuario :>> ', listaUsuario);

    const usuariosFiltrados = React.useMemo(() => {
        if (!rolSeleccionado || !listaUsuario) return [];
        // Filtramos los usuarios cuyo rol coincida numéricamente con el seleccionado
        return listaUsuario.filter(user => Number(user.rol) === Number(rolSeleccionado));
    }, [rolSeleccionado, listaUsuario]);


    //boton Enviar POST
    const handleEnviarPase = async (e) => {
        e.preventDefault();

        // Validación del mensaje
        if (!mensajePase.trim()) {
            setErrorMensaje(true);
            return;
        }
        setErrorMensaje(false);

        // Validación de selección de usuario destino
        if (!usuarioDestino) {
            alert("Por favor, selecciona un perfil y un usuario de destino antes de enviar.");
            return;
        }

        //  CREACIÓN DEL FORMDATA (Reemplaza al JSON plano para soportar los archivos)
        const formData = new FormData();
        formData.append('expediente', Number(id));
        formData.append('observacion', mensajePase.trim());
        formData.append('usuario_destino', Number(usuarioDestino));

        // Adjuntamos los archivos acumulados en el array
        // archivosAdjuntos.forEach((archivo) => {
        //     formData.append('adjuntos', archivo);
        // });

        try {
            console.log("Enviando pase...");

            // Enviamos el formData completo al servicio
            const nuevoPase = await historial.postHistorialPase(formData);

            alert("Pase del expediente realizado correctamente.");

            setMensajePase('');
            setRolSeleccionado('');
            setUsuarioDestino('');
            setArchivosAdjuntos([]);
            navigate("/expedientes")

        } catch (error) {
            console.error("Error al enviar el pase:", error);
            alert("Hubo un error al procesar el pase en el servidor. Revisa los datos.");
        }
    };

    if (cargando) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="text-gray-600 font-medium animate-pulse">Cargando datos del expediente...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl shadow-sm text-center max-w-md">
                    <p className="font-semibold mb-2">¡Ups! Algo salió mal</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    // LÓGICA DE CONTROL DE ESTADOS
    const estadoGlobal = expediente?.estado_expediente?.nombre;
    const estadoInternoForm = formulario?.estado;

    let textoBotonTarea = "📋 Realizar Tarea";
    if (estadoInternoForm === "en progreso") {
        textoBotonTarea = "📋 Continuar Tarea";
    } else if (estadoInternoForm === "completado") {
        textoBotonTarea = "📋 Ver Tarea";
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">

                {/* DATOS DEL TITULAR */}
                <h3 className="text-gray-800 font-bold text-xl">Datos del Titular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                        <p className="text-gray-600 text-sm">Nombre completo</p>
                        <p className="text-gray-800 font-semibold">{expediente?.postulante_titular?.apellido} {expediente?.postulante_titular?.nombre}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">D.N.I</p>
                        <p className="text-gray-800 font-semibold">{expediente?.postulante_titular?.dni}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">Domicilio</p>
                        <p className="text-gray-800 font-semibold">{expediente?.postulante_titular?.domicilio}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">Fecha de inicio</p>
                        <p className="text-gray-800 font-semibold">{expediente?.fecha_creacion
                            ? new Date(expediente.fecha_creacion).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                            : '---'}</p>
                    </div>
                </div>

                {/* ─── SECCIÓN DE ACCIONES ─── */}
                <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">

                    {(estadoGlobal === 'SINI' || estadoGlobal === '1V') && (
                        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium">
                            Tenés este expediente asignado. Podés gestionar el informe técnico utilizando las acciones de abajo.
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                            Mensaje de Pase <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={mensajePase}
                            onChange={(e) => {
                                setMensajePase(e.target.value);
                                if (e.target.value.trim()) setErrorMensaje(false);
                            }}
                            placeholder="Escribí un mensaje o informe sobre lo realizado antes de enviar..."
                            className={`w-full min-h-[85px] p-3 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 transition ${errorMensaje
                                ? 'border-red-500 focus:ring-red-200'
                                : 'border-gray-300 focus:ring-blue-500'
                                }`}
                            rows="3"
                        />

                        {errorMensaje && (
                            <span className="text-red-600 text-xs font-semibold animate-fade-in">
                                ⚠️ Debes completar el mensaje de pase antes de enviar el expediente.
                            </span>
                        )}
                    </div>

                    {/* FORMULARIO COMPLETADO */}
                    {estadoInternoForm === "completado" && (
                        <div className="mb-4 inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <span>✓ Ya completaste el formulario socio-habitacional</span>
                        </div>
                    )}

                    {/*  Legales */}
                    {rolId === 2 && (
                        <div className="mb-4 p-2 bg-white rounded-xl border border-gray-200/60">
                            <AdjuntarArchivos onArchivosChange={(archivos) => setArchivosAdjuntos(archivos)} />
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2 pt-2 border-t border-gray-200 w-full">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-grow">

                            {rolId === 1 && (
                                <Link
                                    to="/form1"
                                    state={{
                                        idExpediente: expediente?.id,
                                        ddjj: expediente?.DDJJ,
                                        nombreCompletoUsuario: `${expediente?.usuario_asignado?.apellido || ''} ${expediente?.usuario_asignado?.nombre || ''}`.trim() || 'Sin usuario',
                                        domicilio: expediente?.postulante_titular?.domicilio_actual,
                                        idFormulario: formulario?.id || null,
                                        datosPrevios: formulario || null
                                    }}
                                    className="inline-flex items-center justify-center bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-sm px-4 py-1.5 h-9 rounded-lg transition w-full sm:w-auto whitespace-nowrap"
                                >
                                    {textoBotonTarea}
                                </Link>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">
                                <div className="flex flex-col gap-1 w-full sm:w-48">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Enviar a Perfil</label>
                                    <select
                                        value={rolSeleccionado}
                                        onChange={(e) => {
                                            setRolSeleccionado(e.target.value);
                                            setUsuarioDestino('');
                                        }}
                                        className="w-full border border-gray-300 rounded-lg text-sm px-3 py-1.5 h-9 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    >
                                        <option value="">Seleccionar perfil...</option>
                                        <option value="1">Trabajadora Social</option>
                                        <option value="2">Legales</option>
                                        <option value="3">Administrativa</option>
                                        <option value="4">Administrador</option>
                                    </select>
                                </div>

                                {rolSeleccionado && (
                                    <div className="flex flex-col gap-1 w-full sm:w-56 animate-fade-in">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Usuario Destino</label>
                                        <select
                                            value={usuarioDestino}
                                            onChange={(e) => setUsuarioDestino(e.target.value)}
                                            className="w-full border border-gray-300 rounded-lg text-sm px-3 py-1.5 h-9 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {usuariosFiltrados.map((user) => (
                                                <option key={user.id} value={user.usuario}>
                                                    {user.nombre_completo || `${user.nombre} ${user.apellido}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleEnviarPase}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-1.5 h-9 rounded-lg transition font-medium shadow-sm w-full md:w-auto whitespace-nowrap self-stretch sm:self-end"
                        >
                            Enviar
                        </button>
                    </div>
                </div>

                {/* HISTORIAL DE MOVIMIENTOS */}
                <h3 className="text-gray-800 font-bold text-xl mt-8">Historial de Movimiento</h3>

                {!historialPases || historialPases.length === 0 ? (
                    <p className="text-gray-500 text-sm mt-2 italic">Este expediente aún no registra pases en el historial.</p>
                ) : (
                    historialPases.map((movimiento, index) => (
                        <div key={movimiento.id || index} className="relative flex gap-4 pb-6">
                            <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0"></div>
                                <div className="w-0.5 bg-blue-200 flex-1"></div>
                            </div>
                            <div className='bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm w-full'>
                                <p className="text-sm text-gray-500">
                                    Fecha: <span className="text-gray-800 font-semibold">
                                        {movimiento.fecha_envio
                                            ? new Date(movimiento.fecha_envio).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                                            : '---'}
                                    </span>
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Usuario Origen: <span className="text-gray-800 font-semibold">{movimiento.usuario_origen_display || '---'}</span></p>
                                <p className="text-sm text-gray-500 mt-1">Usuario Destino: <span className="text-gray-800 font-semibold">{movimiento.usuario_destino_display || '---'}</span></p>
                                <p className="text-sm text-gray-500 mt-1">Observaciones: <span className="text-gray-800 font-semibold">{movimiento.observacion || 'Sin observaciones'}</span></p>

                                <div className='flex gap-3 mt-3'>
                                    <button className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg transition">
                                        Ver Archivo
                                    </button>
                                    <button className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg transition">
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default DetailExpedientes;