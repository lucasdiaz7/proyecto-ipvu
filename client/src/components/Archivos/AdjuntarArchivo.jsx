import React, { useState, useRef } from 'react';
import { TrashIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline';

export const AdjuntarArchivos = ({ onArchivosChange }) => {
  const [archivos, setArchivos] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const seleccionados = Array.from(e.target.files);
    const nuevosArchivos = [...archivos, ...seleccionados];

    setArchivos(nuevosArchivos);
    onArchivosChange(nuevosArchivos);
  };

  const removerArchivo = (indexTarget) => {
    const filtrados = archivos.filter((_, index) => index !== indexTarget);

    setArchivos(filtrados);
    onArchivosChange(filtrados);
  };

  return (
    <div className="w-full pt-1">

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

          className="whitespace-nowrap px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors h-9 inline-flex items-center justify-center gap-1"
        >
          📎 Adjuntar archivo
        </button>
        <span className="text-xs font-medium text-gray-500 pl-1 sm:pl-0">
          {archivos.length === 0 ? "Ningún archivo seleccionado" : `${archivos.length} archivo(s) listo(s)`}
        </span>
      </div>

      {/* Grid de archivos seleccionados */}
      {archivos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100">
          {archivos.map((archivo, index) => {
            const esPdf = archivo.type === "application/pdf";
            return (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200/80 shadow-sm text-sm"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {esPdf ? (
                    <DocumentTextIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <PhotoIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium text-gray-700" title={archivo.name}>
                    {archivo.name}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removerArchivo(index)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                  title="Eliminar de la lista"
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