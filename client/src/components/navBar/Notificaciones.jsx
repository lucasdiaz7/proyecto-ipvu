import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { BellIcon } from "@heroicons/react/24/outline";
import { notificacionService } from "../../services/notificaciones/notificaciones";

// cada cuanto se buscan avisos nuevos sin recargar la pagina
const INTERVALO_ACTUALIZACION_MS = 60000;

const nombreTitular = (expediente) => {
    const postulante = expediente?.postulante;
    return [postulante?.nombre, postulante?.apellido].filter(Boolean).join(" ") || "sin titular";
};

// arma el texto del aviso: quien asigno o envio el expediente, de quien es y su DDJJ
const textoNotificacion = (notif) => {
    const expediente = notif.expediente;
    if (!expediente) return notif.mensaje;

    const caso = `el expediente de ${nombreTitular(expediente)}${expediente.ddjj ? ` (DDJJ ${expediente.ddjj})` : ""}`;
    if (notif.es_asignacion_inicial) {
        return `Se te asignó ${caso}${notif.enviado_por ? `, cargado por ${notif.enviado_por}` : ""}.`;
    }
    if (notif.enviado_por) {
        return `${notif.enviado_por} te envió ${caso}.`;
    }
    return `Recibiste ${caso}.`;
};

// Campanita de todos los roles: avisos de expedientes asignados o recibidos por pase, y en Mesa de
// Entrada tambien a quien quedo asignado cada expediente que cargo.
const Notificaciones = () => {
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const contenedorRef = useRef(null);

    const cargar = async () => {
        try {
            setNotificaciones(await notificacionService.obtenerMias());
        } catch (error) {
            console.error("Error al cargar notificaciones:", error);
        }
    };

    useEffect(() => {
        cargar();
        const intervalo = setInterval(cargar, INTERVALO_ACTUALIZACION_MS);
        return () => clearInterval(intervalo);
    }, []);

    // cerrar el panel al hacer click afuera
    useEffect(() => {
        if (!abierto) return;
        const cerrarSiEsAfuera = (evento) => {
            if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
                setAbierto(false);
            }
        };
        document.addEventListener("mousedown", cerrarSiEsAfuera);
        return () => document.removeEventListener("mousedown", cerrarSiEsAfuera);
    }, [abierto]);

    const noLeidas = notificaciones.filter((notif) => !notif.leida);

    const alternar = async () => {
        const abrir = !abierto;
        setAbierto(abrir);
        if (!abrir) return;

        await cargar();
        // al abrir el panel se dan por vistas
        if (noLeidas.length > 0) {
            await Promise.allSettled(noLeidas.map((notif) => notificacionService.marcarLeida(notif.id)));
            setNotificaciones((actuales) => actuales.map((notif) => ({ ...notif, leida: true })));
        }
    };

    const abrirExpediente = (notif) => {
        if (!notif.expediente?.id) return;
        setAbierto(false);
        navigate(`/Expediente/${notif.expediente.id}`);
    };

    return (
        <div className="relative" ref={contenedorRef}>
            <button
                onClick={alternar}
                title="Notificaciones"
                className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/90 hover:bg-white/15 transition-colors focus:outline-none"
            >
                <BellIcon className="w-5 h-5" />
                {noLeidas.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {noLeidas.length}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-y-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50">
                    <p className="px-4 py-2.5 text-sm font-semibold text-gray-800 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700">
                        Notificaciones
                    </p>
                    {notificaciones.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-center text-gray-500 dark:text-slate-400">
                            No hay notificaciones
                        </p>
                    ) : (
                        notificaciones.map((notif) => {
                            const clickeable = Boolean(notif.expediente?.id);
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => abrirExpediente(notif)}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-b-0 ${!notif.leida ? "bg-blue-50/60 dark:bg-blue-500/10" : ""} ${clickeable ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/60" : ""}`}
                                >
                                    {notif.expediente && (
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{notif.mensaje}</p>
                                    )}
                                    <p className="text-sm text-gray-700 dark:text-slate-200">{textoNotificacion(notif)}</p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                                        {new Date(notif.fecha_creacion).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default Notificaciones;
