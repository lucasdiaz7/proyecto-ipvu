import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { postulanteTitular } from "../../services/DataEntry/formDataEntry";
import { useToast } from "../../context/ToastContext";
import { api } from "../../api/axiosConfig";

const FormExpedientes = () => {
    const { register, formState: { errors }, handleSubmit, setValue } = useForm();
    const toast = useToast();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);

    // Estados para Drag & Drop 
    const [fileName, setFileName] = useState("Ningún archivo seleccionado");
    const [isDragging, setIsDragging] = useState(false);

    const onSubmit = async (data) => {
        const datos = {
            ddjj: data.ddjj,
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono,
            dni: data.dni,
            domicilio_actual: data.domicilio_actual,
            email: data.email,
            discapacidad: data.discapacidad,
            fecha_inscripcion: data.fecha_inscripcion
        };

        console.log('Enviando formato exacto a Django :>> ', datos);

        try {
            const crearPostualnte = await postulanteTitular.crearPostulante(datos);
            toast.success("¡Postulante Titular registrado con éxito en el IPVU!");
            console.log("Respuesta de Django:", crearPostualnte);
            navigate("/expedientes");
        } catch (error) {
            console.log(error);
        }
    };

    // --- FUNCIÓN UNIFICADA DE PROCESAMIENTO  ---
    const procesarArchivo = async (file) => {
        if (!file) return;

        setFileName(file.name);

        const formData = new FormData();
        formData.append("documento", file);

        setIsProcessing(true);
        try {
            const response = await api.post("/procesar-documento/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const datosExtraidos = response.data;

            const opciones = { shouldValidate: true, shouldDirty: true };
            if (datosExtraidos.ddjj) setValue("ddjj", datosExtraidos.ddjj, opciones);
            if (datosExtraidos.nombre) setValue("nombre", datosExtraidos.nombre, opciones);
            if (datosExtraidos.apellido) setValue("apellido", datosExtraidos.apellido, opciones);
            if (datosExtraidos.dni) setValue("dni", datosExtraidos.dni, opciones);
            if (datosExtraidos.telefono) setValue("telefono", datosExtraidos.telefono, opciones);
            if (datosExtraidos.domicilio_actual) setValue("domicilio_actual", datosExtraidos.domicilio_actual, opciones);
            if (datosExtraidos.email) setValue("email", datosExtraidos.email, opciones);
            if (datosExtraidos.discapacidad) setValue("discapacidad", datosExtraidos.discapacidad, opciones);
            if (datosExtraidos.fecha_inscripcion) setValue("fecha_inscripcion", datosExtraidos.fecha_inscripcion, opciones);

            toast.success("¡Documento procesado con éxito! Campos autocompletados.");
        } catch (error) {
            console.error("Error procesando documento:", error);
            const mensajeError = error.response?.data?.error || "No se pudo procesar el documento. Intenta manualmente.";
            toast.error(mensajeError);
            setFileName("Ningún archivo seleccionado");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- EVENTOS DEL INPUT Y DRAG & DROP ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        procesarArchivo(file);
        e.target.value = ""; // Permite reseleccionar
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];

            // INYECCIÓN: Guarda el archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            const fileInput = document.getElementById("archivo-input");
            if (fileInput) {
                fileInput.files = dataTransfer.files;
            }

            // Ejecuta tu lógica original de IA
            procesarArchivo(file);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div className="w-full flex flex-col items-center p-4 py-8">
            <div className="w-full max-w-3xl flex flex-col gap-4">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold transition group"
                    >
                        <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        <span>Volver</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl dark:shadow-black/30 border border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-5 transition-colors">

                    <h3 className="text-gray-800 dark:text-slate-100 font-bold text-[18px] tracking-tight text-center col-span-full">
                        Crear Nuevo Expediente
                    </h3>

                    {/* --- ZONA DE DRAG & DROP Y CARGA DE DOCUMENTO --- */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`col-span-full mb-2 p-5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${isDragging
                            ? "border-blue-500 bg-blue-100 dark:border-blue-400 dark:bg-slate-700 scale-[1.01]"
                            : "border-blue-300 bg-blue-50/50 dark:border-slate-600 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/50"
                            }`}
                    >
                        <label className="text-gray-700 dark:text-slate-300 font-semibold mb-4 text-center text-sm sm:text-base">
                            ¿Tienes el documento digitalizado? Adjúntalo para autocompletar (PDF o cualquier Imagen)
                        </label>

                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                            <label className={`cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                Seleccionar archivo
                                <input
                                    id="archivo-input"
                                    type="file"
                                    className="hidden"
                                    accept="image/*, application/pdf"
                                    onChange={handleFileUpload}
                                    disabled={isProcessing}
                                />
                            </label>
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate max-w-[200px] sm:max-w-[300px]">
                                {fileName}
                            </span>
                        </div>

                        {isProcessing && (
                            <p className="mt-4 text-blue-600 dark:text-blue-400 font-semibold text-sm animate-pulse flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Extrayendo datos del documento con IA/OCR...
                            </p>
                        )}
                        <span className="text-xs text-gray-400 dark:text-slate-400 mt-3 text-center">
                            Arrastra y suelta tu archivo aquí, o completa los campos manualmente.
                        </span>
                    </div>
                    {/* --- FIN ZONA DRAG & DROP --- */}

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">DDJJ:</label>
                        <input
                            type="text"
                            {...register('ddjj', { required: true })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.ddjj?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El campo DDJJ es requerido</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Nombre</label>
                        <input
                            type="text"
                            {...register('nombre', { required: true, minLength: 2, maxLength: 40, pattern: "^([^0-9]*)$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.nombre?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El nombre es requerido</p>}
                        {errors.nombre?.type === 'minLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El nombre debe tener mas de dos caracteres</p>}
                        {errors.nombre?.type === 'maxLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El nombre debe tener menos de cuarenta caracteres</p>}
                        {errors.nombre?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El nombre debe ser correcto (sin numeros y guiones)</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Apellido</label>
                        <input
                            type="text"
                            {...register('apellido', { required: true, minLength: 2, maxLength: 40, pattern: "^([^0-9]*)$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.apellido?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El apellido es requerido</p>}
                        {errors.apellido?.type === 'minLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El apellido debe tener mas de dos caracteres</p>}
                        {errors.apellido?.type === 'maxLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El apellido debe tener menos de cuarenta caracteres</p>}
                        {errors.apellido?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El apellido debe ser correcto (sin numeros y guiones)</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Teléfono (Ingresa el nro sin 0 y 15): </label>
                        <input
                            type="text"
                            {...register('telefono', { required: true, minLength: 10, maxLength: 13, pattern: "^[0-9]+$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.telefono?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El telefono es requerido</p>}
                        {errors.telefono?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Telefono invalido (ingresa sin 0 y 15)</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">DNI (Sin puntos, guiones y espacios):</label>
                        <input
                            type="text"
                            {...register('dni', { required: true, minLength: 7, maxLength: 9, pattern: "^[0-9]+$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.dni?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El DNI es requerido</p>}
                        {errors.dni?.type === 'minLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El DNI debe tener mas de 7 caracteres</p>}
                        {errors.dni?.type === 'maxLength' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El DNI debe tener menos de 9 caracteres</p>}
                        {errors.dni?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El DNI debe ser correcto (solo numeros)</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Domicilio actual</label>
                        <input
                            type="text"
                            {...register('domicilio_actual', { required: true, minLength: "5", maxLength: "100", pattern: "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ°\\s.,#-]+$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.domicilio_actual?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Direccion es requerida</p>}
                        {errors.domicilio_actual?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Ingresa una dirección válida. Usa letras, números, puntos o comas, y evita símbolos extraños. (Ej: Av. Rivadavia 1520, Piso 3° B)</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Email</label>
                        <input
                            type="email"
                            {...register('email', { required: true, pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.email?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El email es requerido</p>}
                        {errors.email?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Email invalido</p>}
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Discapacidad</label>
                        <input
                            type="text"
                            placeholder="Ej: Ninguna, Motriz, Visual..."
                            {...register('discapacidad', { required: false })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                    </div>

                    <div className='grid grid-cols-1'>
                        <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Fecha de Inscripción</label>
                        <input
                            type="date"
                            {...register('fecha_inscripcion', { required: true })}
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                        />
                        {errors.fecha_inscripcion?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">La fecha es requerida</p>}
                    </div>

                    <div className="col-span-full flex justify-center">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-colors duration-200 mt-4"
                        >
                            Crear Expediente
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default FormExpedientes;