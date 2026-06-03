import { useState } from "react";
import { useForm } from "react-hook-form";

const FormExpedientes = () => {
    const { register, formState: { errors }, handleSubmit } = useForm();

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
                            maxLength: 40,
                            pattern: "^([^0-9]*)$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.nombre?.type === 'required' && <p className="font-sans text-sm text-red-600">El nombre es requerido</p>}
                    {errors.nombre?.type === 'minLength' && <p className="font-sans text-sm text-red-600">El nombre debe tener mas de dos caracteres</p>}
                    {errors.nombre?.type === 'maxLength' && <p className="font-sans text-sm text-red-600">El nombre debe tener menos de cuarenta caracteres</p>}
                    {errors.nombre?.type === 'pattern' && <p className="font-sans text-sm text-red-600">El nombre debe ser correcto (sin numeros y guiones)</p>}
                </div>

                <div className='grid grid-cols-1'>
                    <label className="text-gray-800 font-semibold text-base">Apellido</label>
                    <input
                        type="text"
                        {...register('apellido', {
                            required: true,
                            minLength: 2,
                            maxLength: 40,
                            pattern: "^([^0-9]*)$"
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.apellido?.type === 'required' && <p className="font-sans text-sm text-red-600">El apellido es requerido</p>}
                    {errors.apellido?.type === 'minLength' && <p className="font-sans text-sm text-red-600">El apellido debe tener mas de dos caracteres</p>}
                    {errors.apellido?.type === 'maxLength' && <p className="font-sans text-sm text-red-600">El apellido debe tener menos de cuarenta caracteres</p>}
                    {errors.apellido?.type === 'pattern' && <p className="font-sans text-sm text-red-600">El apellido debe ser correcto (sin numeros y guiones)</p>}
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
                    {errors.dni?.type === 'required' && <p className="font-sans text-sm text-red-600">El DNI es requerido</p>}
                    {errors.dni?.type === 'minLength' && <p className="font-sans text-sm text-red-600">El DNI debe tener mas de 7 caracteres</p>}
                    {errors.dni?.type === 'maxLength' && <p className="font-sans text-sm text-red-600">El DNI debe tener menos de 9 caracteres</p>}
                    {errors.dni?.type === 'pattern' && <p className="font-sans text-sm text-red-600">El DNI debe ser correcto (solo numeros)</p>}
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
                    {errors.email?.type === 'required' && <p className="font-sans text-sm text-red-600">El email es requerido</p>}
                    {errors.email?.type === 'pattern' && <p className="font-sans text-sm text-red-600">Email invalido</p>}
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
                    {errors.telefono?.type === 'required' && <p className="font-sans text-sm text-red-600">El telefono es requerido</p>}
                    {errors.telefono?.type === 'pattern' && <p className="font-sans text-sm text-red-600">Telefono invalido (ingresa sin 0 y 15)</p>}
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
                    {errors.direccion?.type === 'required' && <p className="font-sans text-sm text-red-600">Direccion es requerida</p>}
                    {errors.direccion?.type === 'pattern' && <p className="font-sans text-sm text-red-600">Ingresa una dirección válida. Usa letras, números, puntos o comas, y evita símbolos extraños. (Ej: Av. Rivadavia 1520, Piso 3° B)</p>}
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