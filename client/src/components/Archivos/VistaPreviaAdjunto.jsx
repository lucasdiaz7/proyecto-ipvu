import React, { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { documentoAdjuntoService } from '../../services/documentos/documentoAdjunto';

// Muestra un documento adjunto dentro de la pantalla (PDF o imagen) sin descargarlo.
// El archivo pide login: se baja con axios (que manda el token) y se muestra desde una URL local del navegador.
export const VistaPreviaAdjunto = ({ adjunto, nombre, onClose, onDescargar }) => {
    const [url, setUrl] = useState(null);
    const [tipo, setTipo] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        let urlLocal = null;
        let cancelado = false;

        documentoAdjuntoService.obtenerArchivo(adjunto.id)
            .then((blob) => {
                if (cancelado) return;
                urlLocal = window.URL.createObjectURL(blob);
                setTipo(blob.type || '');
                setUrl(urlLocal);
            })
            .catch(() => !cancelado && setError(true));

        return () => {
            cancelado = true;
            if (urlLocal) window.URL.revokeObjectURL(urlLocal);
        };
    }, [adjunto.id]);

    // se cierra con Escape
    useEffect(() => {
        const alPresionar = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', alPresionar);
        return () => window.removeEventListener('keydown', alPresionar);
    }, [onClose]);

    const nombreMinuscula = (nombre || '').toLowerCase();
    const esPdf = tipo === 'application/pdf' || nombreMinuscula.endsWith('.pdf');
    const esImagen = tipo.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/.test(nombreMinuscula);

    let contenido;
    if (error) {
        contenido = <p className="text-sm text-red-600 dark:text-red-400">No se pudo cargar el archivo.</p>;
    } else if (!url) {
        contenido = <p className="text-sm text-gray-500 dark:text-slate-400">Cargando vista previa...</p>;
    } else if (esPdf) {
        contenido = <iframe src={url} title={nombre} className="w-full h-full rounded-lg bg-white" />;
    } else if (esImagen) {
        contenido = <img src={url} alt={nombre} className="max-w-full max-h-full object-contain rounded-lg" />;
    } else {
        contenido = (
            <p className="text-sm text-gray-600 dark:text-slate-300 text-center">
                Este tipo de archivo no tiene vista previa.<br />Descargalo para abrirlo.
            </p>
        );
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-6"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={`Vista previa de ${nombre}`}
        >
            <div
                className="w-full max-w-5xl h-full max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <p className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-800 dark:text-slate-100" title={nombre}>
                        {nombre}
                    </p>
                    {url && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir en otra pestaña"
                            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        >
                            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={onDescargar}
                        title="Descargar"
                        className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        title="Cerrar"
                        className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 min-h-0 flex items-center justify-center p-3 bg-gray-100 dark:bg-slate-950">
                    {contenido}
                </div>
            </div>
        </div>
    );
};
