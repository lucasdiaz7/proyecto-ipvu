import React, { useEffect, useRef, useState } from 'react';
import { TrashIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { documentoAdjuntoService } from '../../services/documentos/documentoAdjunto';

const EXTENSIONES_PERMITIDAS = ['.pdf', '.png', '.jpg', '.jpeg'];

export const AdjuntarArchivos = ({ expedienteId, adjuntosExcluidos = [], onArchivosChange }) => {
  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState('');
  const [arrastrando, setArrastrando] = useState(false);
  const fileInputRef = useRef(null);
  const contadorArrastre = useRef(0);

  const obtenerClaveAdjunto = (archivo) => {
    return String(
      archivo?.id ||
      archivo?.archivo_url ||
      archivo?.archivo ||
      archivo?.url ||
      archivo?.tipo_documento ||
      ''
    );
  };

  useEffect(() => {
    const obtenerAdjuntosPendientes = async () => {
      if (!expedienteId) return;

      try {
        setCargando(true);
        setError('');
        const documentos = await documentoAdjuntoService.obtenerPorExpediente(expedienteId);
        const clavesExcluidas = new Set(adjuntosExcluidos.map(obtenerClaveAdjunto).filter(Boolean));
        const documentosPendientes = documentos.filter(
          (documento) => !clavesExcluidas.has(obtenerClaveAdjunto(documento))
        );
        setArchivos(documentosPendientes);
        onArchivosChange?.(documentosPendientes);
      } catch (error) {
        console.error('Error al obtener documentos adjuntos:', error);
        setError('No se pudieron cargar los archivos adjuntos.');
      } finally {
        setCargando(false);
      }
    };

    obtenerAdjuntosPendientes();
  }, [expedienteId, adjuntosExcluidos, onArchivosChange]);

  const subirArchivos = async (seleccionados) => {
    if (seleccionados.length === 0 || !expedienteId || subiendo) return;

    // al arrastrar no aplica el "accept" del input: se filtra aca con los mismos formatos
    const validos = seleccionados.filter((archivo) =>
      EXTENSIONES_PERMITIDAS.some((extension) => archivo.name.toLowerCase().endsWith(extension))
    );
    if (validos.length === 0) {
      setError('Formato no permitido. Solo se aceptan PDF, PNG o JPG.');
      return;
    }

    try {
      setSubiendo(true);
      setError(validos.length < seleccionados.length ? 'Se omitieron archivos con formato no permitido.' : '');
      const documentosSubidos = await Promise.all(
        validos.map((archivo) =>
          documentoAdjuntoService.crear({ expedienteId, archivo })
        )
      );
      const nuevosArchivos = [...archivos, ...documentosSubidos];
      setArchivos(nuevosArchivos);
      onArchivosChange?.(nuevosArchivos);
    } catch (error) {
      console.error('Error al subir documentos adjuntos:', error);
      setError('No se pudo subir uno de los archivos. Intenta nuevamente.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleFileChange = async (e) => {
    const seleccionados = Array.from(e.target.files);
    e.target.value = '';
    await subirArchivos(seleccionados);
  };

  // dragenter/dragleave tambien se disparan al pasar por los elementos de adentro: se cuentan para
  // no apagar el resaltado mientras el archivo sigue sobre el recuadro
  const handleDragEnter = (e) => {
    e.preventDefault();
    contadorArrastre.current += 1;
    setArrastrando(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    contadorArrastre.current -= 1;
    if (contadorArrastre.current <= 0) {
      contadorArrastre.current = 0;
      setArrastrando(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    contadorArrastre.current = 0;
    setArrastrando(false);
    const soltados = Array.from(e.dataTransfer.files);
    // una imagen arrastrada desde una pagina web o una app no llega como archivo: hay que guardarla antes
    if (soltados.length === 0) {
      setError('No se pudo leer lo que arrastraste. Guardá el archivo en la compu y arrastralo desde la carpeta.');
      return;
    }
    await subirArchivos(soltados);
  };

  const abrirArchivo = async (documentoId) => {
    try {
      setError('');
      await documentoAdjuntoService.abrirEnPestania(documentoId);
    } catch (error) {
      console.error('Error al abrir documento adjunto:', error);
      setError('No se pudo abrir el archivo adjunto.');
    }
  };

  const removerArchivo = async (documentoId) => {
    if (!documentoId) return;

    try {
      setEliminandoId(documentoId);
      setError('');
      await documentoAdjuntoService.eliminar(documentoId);
      const filtrados = archivos.filter((archivo) => archivo.id !== documentoId);
      setArchivos(filtrados);
      onArchivosChange?.(filtrados);
    } catch (error) {
      console.error('Error al eliminar documento adjunto:', error);
      setError('No se pudo eliminar el archivo adjunto.');
    } finally {
      setEliminandoId(null);
    }
  };

  const obtenerNombreArchivo = (archivo) => {
    const nombreDesdeUrl = archivo.archivo?.split('/').pop() || archivo.archivo_url?.split('/').pop();
    return archivo.tipo_documento || nombreDesdeUrl || 'Archivo adjunto';
  };

  const archivoEsPdf = (archivo) => obtenerNombreArchivo(archivo).toLowerCase().endsWith('.pdf');

  return (
    <div
      className={`w-full pt-1 rounded-lg transition-colors ${arrastrando ? 'bg-blue-50 outline-dashed outline-2 outline-blue-400 outline-offset-4' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept=".pdf,.png,.jpg,.jpeg"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          disabled={subiendo || !expedienteId}
          className="whitespace-nowrap px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors h-9 inline-flex items-center justify-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {subiendo ? 'Subiendo...' : 'Adjuntar archivo'}
        </button>
        <span className="text-xs font-medium text-gray-500 pl-1 sm:pl-0">
          {arrastrando
            ? 'Soltá el archivo para adjuntarlo'
            : cargando
              ? 'Cargando archivos...'
              : archivos.length === 0
                ? 'Ningun archivo adjunto · o arrastralo acá'
                : `${archivos.length} archivo(s) adjunto(s) · podés arrastrar más acá`}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-semibold mt-2">{error}</p>
      )}

      {archivos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
          {archivos.map((archivo) => {
            const nombreArchivo = obtenerNombreArchivo(archivo);
            const estaEliminando = eliminandoId === archivo.id;

            return (
              <div
                key={archivo.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200/80 shadow-sm text-sm"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {archivoEsPdf(archivo) ? (
                    <DocumentTextIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <PhotoIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => abrirArchivo(archivo.id)}
                    className="truncate font-medium text-gray-700 hover:text-blue-600 text-left"
                    title={nombreArchivo}
                  >
                    {nombreArchivo}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removerArchivo(archivo.id)}
                  disabled={estaEliminando}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar archivo adjunto"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
