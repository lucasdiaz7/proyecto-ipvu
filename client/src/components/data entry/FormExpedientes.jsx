import { useState } from "react";
import { useForm } from "react-hook-form";

const FormExpedientes = () => {
    const { register, formState: { errors }, handleSubmit } = useForm();
    const [open, setOpen] = useState(false);
    const [perfil, setPerfil] = useState("");

    const perfiles = ["Rocio Lopez", "Cecilia Arce", "Sol Martinez", "Fernanda Zurita"];

    const handleSelect = (p) => {
        setPerfil(p);
        setOpen(false);
    };

    const onSubmit = (data) => {
        console.log('data :>> ', data);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">

                <h3 className="text-gray-800 font-bold text-[18px] tracking-tight text-center col-span-full">
                    Crear Nuevo Expediente
                </h3>


                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Nombre</label>
                    <input
                        type="text"
                        {...register('nombre', {
                            required: true,
                            minLength: 2,
                            maxLength: 20,
                            pattern: "^([^0-9]*)$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.nombre?.type === 'required' && <p>El nombre es requerido</p>}
                    {errors.nombre?.type === 'minLength' && <p>El nombre debe tener mas de dos caracteres</p>}
                    {errors.nombre?.type === 'maxLength' && <p>El nombre debe tener menos de veinte caracteres</p>}
                    {errors.nombre?.type === 'pattern' && <p>El nombre debe ser correcto (sin numeros y guiones)</p>}
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Apellido</label>
                    <input
                        type="text"
                        {...register('apellido', {
                            required: true,
                            minLength: 2,
                            maxLength: 20,
                            pattern: "^([^0-9]*)$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">DNI (Sin puntos, guiones y espacios):</label>
                    <input
                        type="text"
                        {...register('dni', {
                            required: true,
                            minLength: 7,
                            maxLength: 9,
                            pattern: "^[0-9]+$"

                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Email</label>
                    <input
                        type="email"
                        {...register('email', {
                            required: true,
                            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Teléfono (Ingresa el nro sin 0 y 15): </label>
                    <input
                        type="text"
                        {...register('telefono', {
                            required: true,
                            minLength: 10,
                            maxLength: 13,
                            pattern: "^[0-9]+$"

                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Dirección actual</label>
                    <input
                        type="text"
                        {...register('direccion', {
                            required: true,
                            minLength: "5",
                            maxLength: "100",
                            pattern: "^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ°\s.,#-]+$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className="relative">
                    <label className="text-gray-800 font-semibold text-base mb-1 block">
                        Usuario Asignado
                    </label>

                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="w-full px-3 py-2 text-sm border font-normal border-gray-200 bg-gray-50 rounded-md text-left hover:bg-white focus:ring-1 focus:ring-blue-400"
                    >
                        {perfil || "Seleccionar perfil"}
                    </button>

                    {open && (
                        <div className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            {perfiles.map((p) => (
                                <div
                                    key={p}
                                    onClick={() => handleSelect(p)}
                                    className="px-3 py-2 text-sm font-normal hover:bg-gray-100 cursor-pointer"
                                >
                                    {p}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-full flex justify-center">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-colors duration-200"
                    >
                        Crear Expediente
                    </button>
                </div>

            </div>
        </form>
    );
};

export default FormExpedientes;