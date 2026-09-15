import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { postulanteTitular } from "../../services/DataEntry/formDataEntry";
import { useToast } from "../../context/ToastContext";

const FormExpedientes = () => {
    const { register, formState: { errors }, handleSubmit } = useForm();
    const toast = useToast();
    const navigate = useNavigate();

    const onSubmit = async (data) => {

        const datos = {
            ddjj: data.ddjj,
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono,
            dni: data.dni,
            domicilio_actual: data.domicilio_actual,
            email: data.email
        };

        console.log('Enviando formato exacto a Django :>> ', datos);

        try {
            const crearPostualnte = await postulanteTitular.crearPostulante(datos);
            toast.success("¡Postulante Titular registrado con éxito en el IPVU!");
            console.log("Respuesta de Django:", crearPostualnte);
            navigate("/expedientes");
        } catch (error) {
            console.log(error)
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


                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">DDJJ:</label>
                    <input
                        type="text"
                        {...register('ddjj', {
                            required: true
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                    />
                    {errors.ddjj?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El campo DDJJ es requerido</p>}
                </div>
                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Nombre</label>
                    <input
                        type="text"
                        {...register('nombre', {
                            required: true,
                            minLength: 2,
                            maxLength: 40,
                            pattern: "^([^0-9]*)$"
                        })}
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
                        {...register('apellido', {
                            required: true,
                            minLength: 2,
                            maxLength: 40,
                            pattern: "^([^0-9]*)$"
                        })}
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
                        {...register('telefono', {
                            required: true,
                            minLength: 10,
                            maxLength: 13,
                            pattern: "^[0-9]+$"

                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                    />
                    {errors.telefono?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El telefono es requerido</p>}
                    {errors.telefono?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Telefono invalido (ingresa sin 0 y 15)</p>}
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">DNI (Sin puntos, guiones y espacios):</label>
                    <input
                        type="text"
                        {...register('dni', {
                            required: true,
                            minLength: 7,
                            maxLength: 9,
                            pattern: "^[0-9]+$"

                        })}
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
                        {...register('domicilio_actual', {
                            required: true,
                            minLength: "5",
                            maxLength: "100",
                            pattern: "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ°\s.,#-]+$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                    />
                    {errors.domicilio_actual?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Direccion es requerida</p>}
                    {errors.domicilio_actual?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Ingresa una dirección válida. Usa letras, números, puntos o comas, y evita símbolos extraños. (Ej: Av. Rivadavia 1520, Piso 3° B)</p>}
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 dark:text-slate-200 font-semibold text-base">Email</label>
                    <input
                        type="email"
                        {...register('email', {
                            required: true,
                            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-500/40 focus:border-blue-400 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-200 rounded-md"
                    />
                    {errors.email?.type === 'required' && <p className="font-sans text-sm text-red-600 dark:text-red-400">El email es requerido</p>}
                    {errors.email?.type === 'pattern' && <p className="font-sans text-sm text-red-600 dark:text-red-400">Email invalido</p>}
                </div>

                <div className="col-span-full flex justify-center">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-colors duration-200"
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