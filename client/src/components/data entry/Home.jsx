import { useRef, useState } from "react";
import { Link } from "react-router";
import {
    ChevronDownIcon,
    BellIcon,
    PlusIcon,
} from "@heroicons/react/24/outline";

const Home = () => {
    const count = 2;
    const [archivo, setArchivo] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);
    const inputRef = useRef(null);

    const seleccionarArchivo = (file) => {
        if (file) setArchivo(file);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setArrastrando(false);
        seleccionarArchivo(event.dataTransfer.files[0]);
    };

    const expedientes = [
        {
            ddjj: "DJ-001",
            titular: "María López",
            dni: "32.456.789",
            estado: "Sin Iniciar",
            entrevistada: "No",
            ultimaModificacion: "05/11/2024 09:30",
        },
        {
            ddjj: "DJ-002",
            titular: "Roberto Sánchez",
            dni: "29.876.543",
            estado: "1ª Visita",
            entrevistada: "Si",
            ultimaModificacion: "10/11/2024 14:15",
        },
        {
            ddjj: "DJ-003",
            titular: "Ana Martínez",
            dni: "31.234.567",
            estado: "Legales",
            entrevistada: "Si",
            ultimaModificacion: "09/11/2024 11:20",
        },
        {
            ddjj: "DJ-004",
            titular: "Jorge Pérez",
            dni: "30.123.456",
            estado: "Doc. Presentada",
            entrevistada: "Si",
            ultimaModificacion: "08/11/2024 16:45",
        },
        {
            ddjj: "DJ-005",
            titular: "Laura Gómez",
            dni: "28.987.654",
            estado: "Apto",
            entrevistada: "Si",
            ultimaModificacion: "07/11/2024 10:00",
        },
        {
            ddjj: "DJ-006",
            titular: "Carlos Díaz",
            dni: "33.456.789",
            estado: "Nueva Visita",
            entrevistada: "Si",
            ultimaModificacion: "06/11/2024 13:30",
        },
    ];

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-6xl rounded-2xl bg-white p-6 shadow-lg md:p-10">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">
                        Seguimiento de fichas
                    </h3>
                    <p className="font-light text-gray-600">
                        Vista general de todos los expedientes en el sistema
                    </p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="flex items-center justify-between rounded-xl bg-gray-100 p-3 shadow-sm transition hover:bg-gray-200">
                        <span className="font-medium text-gray-700">
                            Todos los estados
                        </span>
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>

                    <div className="rounded-xl bg-gray-100 p-3 shadow-sm">
                        <input
                            type="text"
                            placeholder="Buscar"
                            className="w-full bg-transparent text-gray-700 outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-gray-100 p-3 shadow-sm transition hover:bg-gray-200">
                        <Link
                            to="/nuevoExpediente"
                            className="font-medium text-gray-700"
                        >
                            Crear Nuevo Expediente
                        </Link>
                        <PlusIcon className="h-6 w-6" />
                    </div>
                </div>

                <div
                    role="button"
                    tabIndex={0}
                    aria-label="Seleccionar o arrastrar un archivo"
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setArrastrando(true);
                    }}
                    onDragLeave={(event) => {
                        if (
                            !event.currentTarget.contains(event.relatedTarget)
                        ) {
                            setArrastrando(false);
                        }
                    }}
                    onDrop={handleDrop}
                    className={`mt-6 cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${arrastrando
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400"
                        }`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) =>
                            seleccionarArchivo(event.target.files[0])
                        }
                    />

                    {archivo ? (
                        <p className="font-medium text-gray-800">
                            Archivo seleccionado: {archivo.name}
                        </p>
                    ) : (
                        <p className="text-gray-600">
                            Arrastrá tu archivo aquí o hacé clic para
                            seleccionarlo
                        </p>
                    )}
                </div>

                <div className="mt-6 overflow-x-auto">
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-gray-100 p-3 text-sm font-semibold text-gray-700 md:hidden">
                        <span>DD.JJ</span>
                        <span>Titular</span>
                        <span>DNI</span>
                    </div>

                    <div className="hidden grid-cols-6 rounded-lg bg-gray-100 p-3 text-sm font-semibold text-gray-700 md:grid">
                        <span>DD.JJ</span>
                        <span>Titular</span>
                        <span>DNI</span>
                        <span>Estado</span>
                        <span>Entrevistada</span>
                        <span>Última Modificación</span>
                    </div>

                    {expedientes.map((e) => (
                        <button
                            key={e.ddjj}
                            className="grid w-full grid-cols-3 items-center gap-2 border-b p-4 text-left transition hover:bg-gray-50 md:grid-cols-6"
                        >
                            <span className="font-medium text-gray-800">
                                {e.ddjj}
                            </span>
                            <span className="text-gray-700">{e.titular}</span>
                            <span className="text-gray-700">{e.dni}</span>
                            <span className="hidden md:block">{e.estado}</span>
                            <span className="hidden md:block">
                                <span
                                    className={`rounded-lg border px-2 py-1 text-sm font-medium ${e.entrevistada === "Si"
                                        ? "border-green-600 bg-green-100 text-green-700"
                                        : "border-red-600 bg-red-100 text-red-700"
                                        }`}
                                >
                                    {e.entrevistada}
                                </span>
                            </span>
                            <span className="hidden md:block">
                                {e.ultimaModificacion}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;