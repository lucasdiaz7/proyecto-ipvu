import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeftIcon, ArrowDownTrayIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { expedienteService } from '../../services/expedientes/expediente';
import { form1Service } from '../../services/Formularios/form1Service';
import { usuarioService } from '../../services/usuarios/usuarios';
import { historial } from '../../services/historial/historial';
import { AdjuntarArchivos } from '../Archivos/AdjuntarArchivo';
import { SemaforoInconsistencias } from './SemaforoInconsistencias';
import { estadoExpediente } from '../../services/estadoEpediente/estadoExpediente';
import { formularioPdfService } from '../../services/Formularios/formularioPdfService';
import { documentoAdjuntoService, resolverArchivoUrl } from '../../services/documentos/documentoAdjunto';
import { nombreUsuarioAsignado } from '../../utils/expedienteHelpers';
import { useToast } from '../../context/ToastContext';
import { VistaPreviaAdjunto } from '../Archivos/VistaPreviaAdjunto';

// nombre del rol de cada usuario en el historial de pases
const ROLES_PASE = {
    TS: 'Trabajadora Social',
    LG: 'Legales',
    DE: 'Mesa de Entrada',
    SU: 'Administrador',
};

const DetailExpedientes = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const toast = useToast()
    const [expediente, setExpediente] = useState(null)
    const [error, setError] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [formulario, setFormulario] = useState([])
    const [mensajePase, setMensajePase] = useState('')
    const [errorMensaje, setErrorMensaje] = useState(false)
    const [listaUsuario, setlistaUsuario] = useState(null)
    const [rolSeleccionado, setRolSeleccionado] = useState('');
    const [usuarioDestino, setUsuarioDestino] = useState('');
    const [historialPases, setHistorialPases] = useState([]);
    const [documentosExpediente, setDocumentosExpediente] = useState([]);
    const [documentosAbiertos, setDocumentosAbiertos] = useState(false);


    // '' = mantener el estado actual al hacer el pase (asi no se pisa, por ejemplo, un "Doc Presentada")
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('');
    const [marcandoDocPresentada, setMarcandoDocPresentada] = useState(false);
    const [imprimiendo, setImprimiendo] = useState(false);
    const [adjuntoEnVista, setAdjuntoEnVista] = useState(null);
    const [guardandoEstado, setGuardandoEstado] = useState(false);

    // Opciones para el select de estados del expediente
    const tipo_estado = [
        { value: '', label: 'Mantener estado actual' },
        { value: 'NUEVAV', label: 'Nueva Visita' },
        { value: 'AP', label: 'Apto' },
        { value: 'NOAP', label: 'No Apto' }
    ];

    // console.log('historialPases :>> ', historialPases);
    // console.log('usuarioDestino :>> ', usuarioDestino);
    console.log('formulario :>> ', formulario);
    console.log('historialPases :>> ', historialPases);

    const rolId = Number(localStorage.getItem('rol_id'));
    const usuarioLogueado = String(localStorage.getItem('usuarioLogueado'))
    // console.log('usuarioLogueado :>> ', usuarioLogueado);
    console.log('expediente :>> ', expediente);

    useEffect(() => {
        const obtenerDatos = async () => {
            try {
                setCargando(true);
                setError(null);

                // 🚀 Disparamos las 4 peticiones en paralelo (al mismo tiempo)
                const [dataExpediente, formularioPorExp, usuarios, pasesFiltrados, documentos] = await Promise.all([
                    expedienteService.getExpedienteId(id),
                    form1Service.getFormularioPorExpediente(id),
                    usuarioService.getUsuarios(),
                    historial.obtenerPasesPorExpediente(id),
                    documentoAdjuntoService.obtenerPorExpediente(id)
                ]);

                // 1. Guardamos los datos del expediente
                setExpediente(dataExpediente);

                // 2. Procesamos el formulario seleccionando el último del array
                if (Array.isArray(formularioPorExp) && formularioPorExp.length > 0) {
                    const formulariosDelExpediente = formularioPorExp.filter(
                        (form) => Number(form.expediente) === Number(id)
                    );

                    const ultimoFormulario = formulariosDelExpediente[formulariosDelExpediente.length - 1];
                    setFormulario(ultimoFormulario || null);
                } else {
                    setFormulario(null);
                }

                // 3. Filtramos la lista de usuarios
                const usuarioFiltr = usuarios.filter((u) => String(u.username_display) !== String(usuarioLogueado));
                setlistaUsuario(usuarioFiltr);

                // 4. Guardamos el historial de pases
                if (Array.isArray(pasesFiltrados)) {
                    setHistorialPases(pasesFiltrados);
                } else {
                    setHistorialPases([]);
                }

                // 5. Guardamos todos los documentos adjuntos del expediente (vista consolidada)
                setDocumentosExpediente(Array.isArray(documentos) ? documentos : []);

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
    }, [id]);

    // console.log('listaUsuario :>> ', listaUsuario);

    const usuariosFiltrados = React.useMemo(() => {
        if (!rolSeleccionado || !listaUsuario) return [];
        return listaUsuario.filter(user => Number(user.rol) === Number(rolSeleccionado));
    }, [rolSeleccionado, listaUsuario]);

    const obtenerAdjuntosMovimiento = (movimiento) => {
        if (Array.isArray(movimiento?.documentos_adjuntos_detalle)) {
            return movimiento.documentos_adjuntos_detalle;
        }

        return [];
    };

    const obtenerNombreAdjunto = (adjunto) => {
        const nombreDesdeUrl = adjunto?.archivo?.split('/').pop() || adjunto?.archivo_url?.split('/').pop();
        return adjunto?.tipo_documento || adjunto?.nombre || adjunto?.nombre_archivo || nombreDesdeUrl || 'Archivo adjunto';
    };

    const obtenerUrlAdjunto = (adjunto) => {
        return resolverArchivoUrl(adjunto?.archivo_url || adjunto?.archivo || adjunto?.url);
    };

    const adjuntosHistorial = React.useMemo(() => {
        if (!Array.isArray(historialPases)) return [];
        return historialPases.flatMap((movimiento) => obtenerAdjuntosMovimiento(movimiento));
    }, [historialPases]);

    const descargarAdjunto = async (adjunto) => {
        if (!adjunto?.id) return;

        try {
            // con axios viaja el token: el endpoint de descarga pide login
            await documentoAdjuntoService.descargar(adjunto.id, obtenerNombreAdjunto(adjunto));
        } catch (error) {
            console.error('Error al descargar el adjunto:', error);
            toast.error('No se pudo descargar el archivo adjunto.');
        }
    };

    // abre la vista previa (modal) del adjunto
    const verAdjunto = (adjunto) => {
        if (!adjunto?.id) return;
        setAdjuntoEnVista(adjunto);
    };

    // ícono simple según la extensión del archivo, para distinguir de un vistazo
    const iconoAdjunto = (adjunto) => {
        const nombre = (adjunto?.archivo || adjunto?.tipo_documento || '').toLowerCase();
        if (nombre.endsWith('.pdf')) return '📄';
        if (/\.(png|jpe?g|gif|webp|bmp)$/.test(nombre)) return '🖼️';
        if (/\.(docx?|odt)$/.test(nombre)) return '📝';
        if (/\.(xlsx?|csv|ods)$/.test(nombre)) return '📊';
        return '📎';
    };

    const handleGenerarPdf = async () => {
        if (!formulario?.id) {
            toast.error("No se encuentra el formulario para generar el PDF");
            return;
        }

        try {
            const pdfBlob = await formularioPdfService.generarPdf(formulario.id);
            const urlPdf = window.URL.createObjectURL(pdfBlob);
            const linkDescarga = document.createElement('a');

            linkDescarga.href = urlPdf;
            linkDescarga.download = `Formulario_${formulario.id}.pdf`;
            document.body.appendChild(linkDescarga);
            linkDescarga.click();
            linkDescarga.remove();
            window.URL.revokeObjectURL(urlPdf);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
            toast.error("No se pudo generar el PDF del formulario.");
        }
    };


    // Mesa de Entrada marca la documentacion como presentada (sin hacer pase): habilita la impresion
    const handleMarcarDocPresentada = async () => {
        try {
            setMarcandoDocPresentada(true);
            await estadoExpediente.patchEstadoExp(id, { estado: 'DOCP' });
            setExpediente(await expedienteService.getExpedienteId(id));
            toast.success("Documentación marcada como presentada. Ya podés imprimir el expediente.");
        } catch (error) {
            console.error("Error al marcar Doc Presentada:", error);
            toast.error(error?.response?.data?.error || "No se pudo marcar la documentación como presentada.");
        } finally {
            setMarcandoDocPresentada(false);
        }
    };

    // Mesa de Entrada cambia el estado sin enviar el expediente a nadie
    const handleGuardarEstado = async () => {
        if (!estadoSeleccionado) return;
        try {
            setGuardandoEstado(true);
            await estadoExpediente.patchEstadoExp(id, { estado: estadoSeleccionado });
            setExpediente(await expedienteService.getExpedienteId(id));
            setEstadoSeleccionado('');
            toast.success("Estado del expediente actualizado.");
        } catch (error) {
            console.error("Error al guardar el estado:", error);
            toast.error(error?.response?.data?.error || "No se pudo actualizar el estado.");
        } finally {
            setGuardandoEstado(false);
        }
    };

    const [guardandoArchivo, setGuardandoArchivo] = useState(false);

    // archivar / desarchivar (Mesa de Entrada)
    const handleArchivo = async (accion) => {
        try {
            setGuardandoArchivo(true);
            await expedienteService.archivo(id, accion);
            setExpediente(await expedienteService.getExpedienteId(id));
            toast.success(accion === 'archivar' ? 'Expediente archivado.' : 'Expediente desarchivado.');
        } catch (error) {
            console.error('Error al cambiar el archivo del expediente:', error);
            toast.error(error?.response?.data?.error || error?.response?.data?.detail || 'No se pudo completar la acción.');
        } finally {
            setGuardandoArchivo(false);
        }
    };

    const handleImprimirExpediente = async () => {
        // la pestaña se abre antes del await para que el navegador no la bloquee como popup
        const ventana = window.open('', '_blank');
        try {
            setImprimiendo(true);
            const pdfBlob = await expedienteService.imprimirExpediente(id);
            const urlPdf = window.URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
            if (ventana) {
                ventana.location.href = urlPdf;
            } else {
                window.open(urlPdf, '_blank');
            }
            // se libera despues de que la pestaña nueva termino de cargar el PDF
            setTimeout(() => window.URL.revokeObjectURL(urlPdf), 60000);
            // ya impreso: se habilita "Archivar"
            setExpediente((prev) => (prev ? { ...prev, impreso: true } : prev));
        } catch (error) {
            ventana?.close();
            console.error("Error al imprimir el expediente:", error);
            toast.error("No se pudo armar el expediente para imprimir.");
        } finally {
            setImprimiendo(false);
        }
    };

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
            toast.error("Por favor, selecciona un perfil y un usuario de destino antes de enviar.");
            return;
        }

        const formData = new FormData();
        formData.append('expediente', Number(id));
        formData.append('observacion', mensajePase.trim());
        formData.append('usuario_destino', Number(usuarioDestino));

        //  BACKEND AGREGADO: Si es rolId === 3, enviamos el estado seleccionado en el FormData final
        // if (rolId === 3) {
        //     formData.append('nuevo_estado', estadoSeleccionado);
        // }

        try {
            // console.log("Enviando pase...");


            if (rolId === 3 && estadoSeleccionado) {
                // Intentá mandarlo como un objeto JSON simple en lugar de FormData
                const datosEstado = {
                    // Cambiá la clave según lo que pida tu backend:
                    estado: estadoSeleccionado
                };

                // Llamamos a la función pasándole el ID y el objeto con el dato
                await estadoExpediente.patchEstadoExp(id, datosEstado);
            }

            await historial.postHistorialPase(formData);

            setMensajePase('');
            setRolSeleccionado('');
            setUsuarioDestino('');
            setEstadoSeleccionado(''); // Reseteamos al valor inicial
            toast.success("Pase del expediente realizado correctamente.");
            navigate("/expedientes")

        } catch (error) {
            console.error("Error al enviar el pase:", error);
            toast.error("Hubo un error al procesar el pase en el servidor. Revisa los datos.");
        }
    };

    if (cargando) {
        return (
            <div className="w-full flex justify-center items-center p-4 py-24">
                <div className="text-gray-600 dark:text-slate-300 font-medium animate-pulse">Cargando datos del expediente...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full flex justify-center items-center p-4 py-24">
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl shadow-sm text-center max-w-md">
                    <p className="font-semibold mb-2">¡Ups! Algo salió mal</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const estadoGlobal = typeof expediente?.estado_expediente === 'string'
        ? expediente.estado_expediente
        : expediente?.estado_expediente?.nombre;

    const esNuevaVisitaTrabajadoraSocial = rolId === 1 && estadoGlobal === 'NUEVAV';
    const formularioActual = esNuevaVisitaTrabajadoraSocial ? null : formulario;
    const estadoInternoForm = esNuevaVisitaTrabajadoraSocial
        ? 'sin iniciar'
        : formularioActual?.estado || 'sin iniciar';

    const mostrarFormularioTrabajadoraSocial = rolId === 1 && ['SINI', '1V', 'NUEVAV'].includes(estadoGlobal);
    // solo se actua (pase, adjuntar, cambiar estado) sobre lo que se tiene en poder. El superadmin ve
    // todos los expedientes, pero los que no son suyos los ve en modo lectura (el backend tambien lo exige)
    const enMiPoder = Boolean(expediente?.en_mi_poder);
    // el superadmin (rol 4) puede adjuntar en cualquier expediente en su poder, sin importar el estado
    const mostrarAdjuntarArchivos = rolId === 2 || rolId === 3 || rolId === 4 || (rolId === 1 && estadoGlobal === 'AP');
    const formularioCompletado = estadoInternoForm === 'completado';
    const formularioSoloLectura = false;
    const mostrarBotonPdf = mostrarFormularioTrabajadoraSocial && formularioCompletado && Boolean(formularioActual?.id);
    // Doc Presentada: la pone Mesa de Entrada con el expediente Apto y el formulario terminado
    const puedeMarcarDocPresentada = rolId === 3 && enMiPoder && estadoGlobal === 'AP' && formularioCompletado;
    const puedeImprimir = estadoGlobal === 'DOCP';
    // archivar: ultimo paso, recien con el expediente completo ya impreso. Se puede revertir.
    const archivado = Boolean(expediente?.archivado);
    const puedeArchivar = puedeImprimir && rolId === 3 && enMiPoder && !archivado && Boolean(expediente?.impreso);
    const puedeDesarchivar = rolId === 3 && enMiPoder && archivado;

    let textoBotonFormulario = "Crear formulario";
    if (esNuevaVisitaTrabajadoraSocial) {
        textoBotonFormulario = "Formulario de nueva visita";
    } else if (estadoInternoForm === "en progreso") {
        textoBotonFormulario = "Editar formulario";
    } else if (estadoInternoForm === "completado") {
        textoBotonFormulario = "Ver formulario";
    }

    return (
        <div className="w-full flex flex-col items-center p-4 py-8">
            <div className="w-full max-w-6xl flex flex-col gap-4">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Volver</span>
                    </button>
                </div>

                <div className="w-full bg-white dark:bg-slate-900 shadow-lg dark:shadow-black/30 border border-transparent dark:border-slate-800 rounded-2xl p-6 md:p-10 transition-colors">

                {/* DATOS DEL TITULAR */}
                <h3 className="text-gray-800 dark:text-slate-100 font-bold text-xl">Datos del Titular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Nombre completo</p>
                        <p className="text-gray-800 dark:text-slate-100 font-semibold">{expediente?.postulante_titular?.apellido} {expediente?.postulante_titular?.nombre}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">D.N.I</p>
                        <p className="text-gray-800 dark:text-slate-100 font-semibold">{expediente?.postulante_titular?.dni}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Domicilio</p>
                        <p className="text-gray-800 dark:text-slate-100 font-semibold">{expediente?.postulante_titular?.domicilio}</p>
                    </div>
                    <div>
                        <p className="text-gray-600 dark:text-slate-400 text-sm">Fecha de inicio</p>
                        <p className="text-gray-800 dark:text-slate-100 font-semibold">{expediente?.fecha_creacion
                            ? new Date(expediente.fecha_creacion).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                            : '---'}</p>
                    </div>
                    {(rolId === 3 || rolId === 4) && (
                        <>
                            <div>
                                <p className="text-gray-600 dark:text-slate-400 text-sm">Usuario Asignado</p>
                                <p className="text-gray-800 dark:text-slate-100 font-semibold capitalize">
                                    {nombreUsuarioAsignado(expediente)}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-slate-400 text-sm">Días en Poder</p>
                                <p className="text-gray-800 dark:text-slate-100 font-semibold">
                                    {expediente?.dias_en_poder ?? 0} días
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {(puedeMarcarDocPresentada || puedeImprimir) && (
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-xl px-4 py-3">
                        <p className="text-sm text-teal-800 dark:text-teal-300">
                            {archivado
                                ? <><span className="font-semibold">Expediente archivado</span>{expediente?.fecha_archivado ? ` el ${new Date(expediente.fecha_archivado).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` : ''}. Ya no se puede pasar ni modificar; se puede imprimir y desarchivar.</>
                                : puedeImprimir
                                    ? (puedeArchivar
                                        ? 'Expediente impreso. Si el trámite terminó, ya lo podés archivar.'
                                        : 'Documentación presentada: podés imprimir el expediente completo (datos del titular, informe socio-habitacional y documentos adjuntos).')
                                    : 'El expediente es Apto y tiene el formulario completo. Cuando la persona presente la documentación, marcalo como Doc Presentada.'}
                        </p>
                        {puedeImprimir ? (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleImprimirExpediente}
                                    disabled={imprimiendo}
                                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 h-9 rounded-lg transition whitespace-nowrap"
                                >
                                    {imprimiendo ? 'Armando PDF...' : 'Imprimir expediente'}
                                </button>
                                {puedeArchivar && (
                                    <button
                                        type="button"
                                        onClick={() => handleArchivo('archivar')}
                                        disabled={guardandoArchivo}
                                        className="bg-white dark:bg-slate-800 border border-teal-600 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 disabled:opacity-60 text-sm font-medium px-4 py-1.5 h-9 rounded-lg transition whitespace-nowrap"
                                    >
                                        Archivar
                                    </button>
                                )}
                                {puedeDesarchivar && (
                                    <button
                                        type="button"
                                        onClick={() => handleArchivo('desarchivar')}
                                        disabled={guardandoArchivo}
                                        className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-60 text-sm font-medium px-4 py-1.5 h-9 rounded-lg transition whitespace-nowrap"
                                    >
                                        Desarchivar
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={handleMarcarDocPresentada}
                                disabled={marcandoDocPresentada}
                                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-1.5 h-9 rounded-lg transition whitespace-nowrap"
                            >
                                {marcandoDocPresentada ? 'Guardando...' : 'Marcar Doc Presentada'}
                            </button>
                        )}
                    </div>
                )}

                {/* DOCUMENTOS DEL EXPEDIENTE: sección plegable y discreta, por encima del semáforo */}
                <div className="mt-5 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setDocumentosAbiertos((v) => !v)}
                        aria-expanded={documentosAbiertos}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 dark:bg-slate-800/60 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <span className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-slate-100">
                            <span aria-hidden="true">📎</span>
                            Documentos del expediente
                            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                {documentosExpediente.length}
                            </span>
                        </span>
                        <ChevronDownIcon className={`w-5 h-5 text-gray-500 dark:text-slate-400 shrink-0 transition-transform ${documentosAbiertos ? 'rotate-180' : ''}`} />
                    </button>

                    {documentosAbiertos && (
                        documentosExpediente.length === 0 ? (
                            <p className="px-4 py-4 text-gray-500 dark:text-slate-400 text-sm italic border-t border-gray-100 dark:border-slate-800">
                                Este expediente todavía no tiene documentos adjuntos.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border-t border-gray-100 dark:border-slate-800">
                                {documentosExpediente.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl"
                                    >
                                        <span className="text-2xl shrink-0" aria-hidden="true">{iconoAdjunto(doc)}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate" title={obtenerNombreAdjunto(doc)}>
                                                {obtenerNombreAdjunto(doc)}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                                                Subido por {doc.subido_por_display || '---'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => verAdjunto(doc)}
                                            className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition shrink-0"
                                        >
                                            Ver
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => descargarAdjunto(doc)}
                                            title="Descargar"
                                            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shrink-0"
                                        >
                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                            <span className="hidden lg:inline">Descargar</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* SEMÁFORO DE INCONSISTENCIAS: recién con el formulario socio-habitacional terminado */}
                {formularioCompletado && <SemaforoInconsistencias expedienteId={id} />}

                {!enMiPoder && (
                    <div className="mt-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 rounded-xl px-4 py-3 text-sm">
                        <span className="font-semibold">Solo lectura:</span> este expediente está en poder de{' '}
                        <span className="font-semibold capitalize">{nombreUsuarioAsignado(expediente)}</span>.
                        Para hacer un pase, adjuntar archivos o cambiar el estado, primero te lo tienen que pasar.
                    </div>
                )}

                {/* ─── SECCIÓN DE ACCIONES ─── */}
                {enMiPoder && !archivado && (
                <div className="mt-5 bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">



                    <div className="flex flex-col gap-1.5 mb-4">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                            Mensaje de Pase <span className="text-red-500 dark:text-red-400">*</span>
                        </label>
                        <textarea
                            value={mensajePase}
                            onChange={(e) => {
                                setMensajePase(e.target.value);
                                if (e.target.value.trim()) setErrorMensaje(false);
                            }}
                            placeholder="Escribí un mensaje o informe sobre lo realizado antes de enviar..."
                            className={`w-full min-h-[85px] p-3 text-sm bg-white dark:bg-slate-800 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 dark:placeholder-slate-500 text-gray-800 dark:text-slate-100 transition ${errorMensaje
                                ? 'border-red-500 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/30'
                                : 'border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:focus:ring-blue-500/40'
                                }`}
                            rows="3"
                        />

                        {errorMensaje && (
                            <span className="text-red-600 dark:text-red-400 text-xs font-semibold animate-fade-in">
                                ⚠️ Debes completar el mensaje de pase antes de enviar el expediente.
                            </span>
                        )}
                    </div>

                    {/* NUEVA VISITA: Mesa de Entrada pidio volver a entrevistar a la persona */}
                    {esNuevaVisitaTrabajadoraSocial && (
                        <div className="mb-4 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-800 dark:text-orange-300 px-3 py-2 rounded-lg text-sm">
                            <span className="font-semibold">Nueva visita solicitada.</span> Si hacés una nueva entrevista, cargá el
                            formulario de nueva visita: el anterior queda guardado en el historial. Si no hace falta, podés enviar
                            el expediente sin completarlo.
                        </div>
                    )}

                    {/* FORMULARIO COMPLETADO */}
                    {estadoInternoForm === "completado" && rolId === 1 && estadoGlobal !== 'AP' && (
                        <div className="mb-4 inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-400 px-3 py-1.5 rounded-lg text-xs font-semibold">
                            <span>✓ Ya completaste el formulario socio-habitacional</span>
                        </div>
                    )}

                    {/* Adjuntos para Legales, Mesa de Entrada o Trabajadora Social con expediente Apto */}
                    {mostrarAdjuntarArchivos && (
                        <div className="mb-4 p-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-200/60 dark:border-slate-700">
                            <AdjuntarArchivos expedienteId={id} adjuntosExcluidos={adjuntosHistorial} />
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 w-full">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-grow">

                            {mostrarFormularioTrabajadoraSocial && (
                                <>
                                    <Link
                                        to="/form1"
                                        state={{
                                            idExpediente: expediente?.id,
                                            ddjj: expediente?.DDJJ,
                                            nombreCompletoUsuario: `${expediente?.usuario_asignado?.apellido || ''} ${expediente?.usuario_asignado?.nombre || ''}`.trim() || 'Sin usuario',
                                            domicilio: expediente?.postulante_titular?.domicilio,
                                            idFormulario: formularioActual?.id || null,
                                            datosPrevios: formularioActual || null,
                                            soloLectura: formularioSoloLectura
                                        }}
                                        className="inline-flex items-center justify-center bg-white dark:bg-slate-800 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-semibold text-sm px-4 py-1.5 h-9 rounded-lg transition w-full sm:w-auto whitespace-nowrap"
                                    >
                                        {textoBotonFormulario}
                                    </Link>

                                    {mostrarBotonPdf && (
                                        <button
                                            type="button"
                                            onClick={handleGenerarPdf}
                                            className="inline-flex items-center justify-center bg-white dark:bg-slate-800 border border-green-600 dark:border-green-500 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 font-semibold text-sm px-4 py-1.5 h-9 rounded-lg transition w-full sm:w-auto whitespace-nowrap"
                                        >
                                            Generar PDF
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Contenedor de Selects flexibles */}
                            <div className="flex flex-col sm:flex-row gap-3 items-end w-full sm:w-auto">

                                {/*  rolId === 3 data entry */}
                                {rolId === 3 && (
                                    <div className="flex flex-col gap-1 w-full sm:w-48 animate-fade-in">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Estado de Expediente</label>
                                        <select
                                            value={estadoSeleccionado}
                                            onChange={(e) => setEstadoSeleccionado(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg text-sm px-3 py-1.5 h-9 text-gray-700 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/40 transition cursor-pointer font-medium"
                                        >
                                            {tipo_estado.map((estado) => (
                                                <option key={estado.value} value={estado.value}>
                                                    {estado.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* cambia el estado sin hacer pase: Mesa de Entrada se queda con el expediente
                                    (por ejemplo para ponerlo en Apto y despues marcar Doc Presentada) */}
                                {rolId === 3 && (
                                    <button
                                        type="button"
                                        onClick={handleGuardarEstado}
                                        disabled={!estadoSeleccionado || guardandoEstado}
                                        className="inline-flex items-center justify-center bg-white dark:bg-slate-800 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm px-4 py-1.5 h-9 rounded-lg transition w-full sm:w-auto whitespace-nowrap"
                                    >
                                        {guardandoEstado ? 'Guardando...' : 'Guardar estado'}
                                    </button>
                                )}

                                {/* Enviar a Perfil */}
                                <div className="flex flex-col gap-1 w-full sm:w-48">
                                    <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Enviar a Perfil</label>
                                    <select
                                        value={rolSeleccionado}
                                        onChange={(e) => {
                                            setRolSeleccionado(e.target.value);
                                            setUsuarioDestino('');
                                        }}
                                        className="w-full border border-gray-300 dark:border-slate-600 rounded-lg text-sm px-3 py-1.5 h-9 text-gray-700 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/40 transition"
                                    >
                                        <option value="">Seleccionar perfil...</option>
                                        <option value="1">Trabajadora Social</option>
                                        <option value="2">Legales</option>
                                        <option value="3">Mesa de Entrada</option>
                                        <option value="4">Administrador</option>
                                    </select>
                                </div>

                                {/*  Usuario Destino */}
                                {rolSeleccionado && (
                                    <div className="flex flex-col gap-1 w-full sm:w-56 animate-fade-in">
                                        <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Usuario Destino</label>
                                        <select
                                            value={usuarioDestino}
                                            onChange={(e) => setUsuarioDestino(e.target.value)}
                                            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg text-sm px-3 py-1.5 h-9 text-gray-700 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/40 transition"
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

                        {/* BOTÓN ENVIAR */}
                        <button
                            onClick={handleEnviarPase}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-1.5 h-9 rounded-lg transition font-medium shadow-sm w-full md:w-auto whitespace-nowrap self-stretch sm:self-end"
                        >
                            Enviar
                        </button>
                    </div>
                </div>
                )}

                {/* HISTORIAL DE MOVIMIENTOS */}
                <h3 className="text-gray-800 dark:text-slate-100 font-bold text-xl mt-8">Historial de Movimiento</h3>

                {!historialPases || historialPases.length === 0 ? (
                    <p className="text-gray-500 dark:text-slate-400 text-sm mt-2 italic">Este expediente aún no registra pases en el historial.</p>
                ) : (
                    historialPases.map((movimiento, index) => {
                        const adjuntosMovimiento = obtenerAdjuntosMovimiento(movimiento);

                        return (
                            <div key={movimiento.id || index} className="relative flex gap-4 pb-6">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 shrink-0"></div>
                                    <div className="w-0.5 bg-blue-200 dark:bg-blue-500/30 flex-1"></div>
                                </div>
                                <div className='bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm w-full'>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">
                                        Fecha: <span className="text-gray-800 dark:text-slate-100 font-semibold">
                                            {movimiento.fecha_envio
                                                ? new Date(movimiento.fecha_envio).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
                                                : '---'}
                                        </span>
                                    </p>
                                    {movimiento.es_asignacion_inicial ? (
                                        <>
                                            {/* el primer movimiento no es un pase: es la carga y la asignacion automatica */}
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                Caso asignado a: <span className="text-blue-700 dark:text-blue-400 font-semibold">{movimiento.usuario_destino_display || '---'}</span>
                                                {ROLES_PASE[movimiento.usuario_destino_rol] && (
                                                    <span className="text-xs"> ({ROLES_PASE[movimiento.usuario_destino_rol]})</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                                Cargado por: <span className="text-gray-800 dark:text-slate-100 font-semibold">{movimiento.usuario_origen_display || '---'}</span>
                                                {ROLES_PASE[movimiento.usuario_origen_rol] && (
                                                    <span className="text-xs"> ({ROLES_PASE[movimiento.usuario_origen_rol]})</span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 italic">Asignación automática al cargar el expediente</p>
                                        </>
                                    ) : (
                                    <>
                                    {/* quien envia -> quien recibe, en un solo renglon */}
                                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                        <span className="text-gray-800 dark:text-slate-100 font-semibold">{movimiento.usuario_origen_display || '---'}</span>
                                        {ROLES_PASE[movimiento.usuario_origen_rol] && (
                                            <span className="text-xs">({ROLES_PASE[movimiento.usuario_origen_rol]})</span>
                                        )}
                                        <ArrowRightIcon className="w-4 h-4 mx-1 text-gray-400 dark:text-slate-500" aria-label="envió a" />
                                        <span className="text-blue-700 dark:text-blue-400 font-semibold">{movimiento.usuario_destino_display || '---'}</span>
                                        {ROLES_PASE[movimiento.usuario_destino_rol] && (
                                            <span className="text-xs">({ROLES_PASE[movimiento.usuario_destino_rol]})</span>
                                        )}
                                    </p>
                                    {/* el mensaje del pase es lo que explica que se hizo: va en su propio recuadro */}
                                    <div className="mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 border-l-4 border-l-gray-300 dark:border-l-slate-500 rounded-lg px-3 py-2">
                                        <p className="text-xs text-gray-500 dark:text-slate-400">Observaciones</p>
                                        <p className="text-sm text-gray-800 dark:text-slate-100 whitespace-pre-line break-words">
                                            {movimiento.observacion || <span className="italic text-gray-400 dark:text-slate-500">Sin observaciones</span>}
                                        </p>
                                    </div>
                                    </>
                                    )}

                                    {adjuntosMovimiento.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2">
                                                Archivos enviados en este pase ({adjuntosMovimiento.length})
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {adjuntosMovimiento.map((adjunto, adjuntoIndex) => {
                                                    const urlAdjunto = obtenerUrlAdjunto(adjunto);
                                                    if (!urlAdjunto) return null;
                                                    const nombreAdjunto = obtenerNombreAdjunto(adjunto);

                                                    return (
                                                        <div
                                                            key={adjunto.id || adjuntoIndex}
                                                            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg"
                                                        >
                                                            <span className="text-xl shrink-0" aria-hidden="true">{iconoAdjunto(adjunto)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => verAdjunto(adjunto)}
                                                                title={`Ver ${nombreAdjunto}`}
                                                                className="min-w-0 flex-1 text-left text-sm font-medium text-gray-800 dark:text-slate-100 truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                                            >
                                                                {nombreAdjunto}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => verAdjunto(adjunto)}
                                                                className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition shrink-0"
                                                            >
                                                                Ver
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => descargarAdjunto(adjunto)}
                                                                title="Descargar"
                                                                aria-label={`Descargar ${nombreAdjunto}`}
                                                                className="p-1.5 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/30 hover:bg-green-100 dark:hover:bg-green-500/20 transition shrink-0"
                                                            >
                                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                </div>
            </div>

            {adjuntoEnVista && (
                <VistaPreviaAdjunto
                    adjunto={adjuntoEnVista}
                    nombre={obtenerNombreAdjunto(adjuntoEnVista)}
                    onClose={() => setAdjuntoEnVista(null)}
                    onDescargar={() => descargarAdjunto(adjuntoEnVista)}
                />
            )}
        </div>
    )
}

export default DetailExpedientes;
