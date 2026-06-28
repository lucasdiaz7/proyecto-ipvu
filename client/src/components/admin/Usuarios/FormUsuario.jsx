import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { usuarioService } from '../../../services/usuarios/usuarios';

const FormUsuario = () => {
    // Inicializamos React Hook Form
    const { register, watch, setValue, formState: { errors }, handleSubmit, reset } = useForm();
    const [open, setOpen] = useState(false);
    const [perfilSeleccionado, setPerfilSeleccionado] = useState("");
    const [cargando, setCargando] = useState(false);


    const handleSelect = (perfilNombre, rolId) => {
        setPerfilSeleccionado(perfilNombre);

        setValue("rol_id", rolId, {
            shouldValidate: true,
            shouldDirty: true
        });

        setOpen(false);
    }

    const onSubmit = async (data) => {
        try {
            setCargando(true);

            const payload = {
                nombre: data.nombre,
                apellido: data.apellido,
                dni: data.dni,
                email: data.email,
                matricula: data.matricula,
                rol: data.rol_id
            };



            const crearUsuario = await usuarioService.postUsuario(payload)
            console.log('crearUsuario :>> ', crearUsuario);
            alert("¡Usuario creado con éxito!");

            reset()
            setPerfilSeleccionado("")

        } catch (error) {
            console.error(error);
            alert("Error al crear el usuario.");
        } finally {
            setCargando(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">

                <h3 className="text-gray-800 font-bold text-[18px] tracking-tight text-center col-span-full">
                    Crear Usuario
                </h3>

                <div className='grid grid-cols-1 gap-1.5'>
                    <label className="text-gray-800 font-semibold text-sm ml-1">Nombre</label>
                    <input
                        type="text"
                        autoComplete="given-name"
                        {...register('nombre', { required: "El nombre es obligatorio" })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.nombre && <p className="text-xs text-red-600 ml-1">{errors.nombre.message}</p>}
                </div>

                <div className='grid grid-cols-1 gap-1.5'>
                    <label className="text-gray-800 font-semibold text-sm ml-1">Apellido</label>
                    <input
                        type="text"
                        autoComplete="family-name"
                        {...register('apellido', { required: "El apellido es obligatorio" })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.apellido && <p className="text-xs text-red-600 ml-1">{errors.apellido.message}</p>}
                </div>

                <div className='grid grid-cols-1 gap-1.5'>
                    <label className="text-gray-800 font-semibold text-sm ml-1">DNI</label>
                    <input
                        type="text"
                        {...register('dni', {
                            required: "El DNI es obligatorio",
                            pattern: { value: /^\d+$/, message: "Solo se permiten números" },
                            minLength: { value: 7, message: "El DNI debe tener mas de 7 caracteres" },
                            maxLength: { value: 9, message: "El DNI debe tener menos de 9 caracteres" },
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.dni && <p className="text-xs text-red-600 ml-1">{errors.dni.message}</p>}
                </div>

                <div className='grid grid-cols-1 gap-1.5'>
                    <label className="text-gray-800 font-semibold text-sm ml-1">Email</label>
                    <input
                        type="email"
                        autoComplete="email"
                        {...register('email', {
                            required: "El email es obligatorio",
                            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Formato de email inválido" }
                        })}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                    {errors.email && <p className="text-xs text-red-600 ml-1">{errors.email.message}</p>}
                </div>

                <div className='grid grid-cols-1 gap-1.5'>
                    <label className="text-gray-800 font-semibold text-sm ml-1">Matricula (No es obligatorio)</label>
                    <input
                        type="text"
                        autoComplete="matricula"
                        {...register('matricula')}
                        className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                    />
                </div>

                <div className="relative grid grid-cols-1 gap-1.5">
                    <label className="text-gray-800 font-semibold text-sm ml-1">Perfil</label>


                    <input type="hidden" {...register('rol_id', { required: "Debes seleccionar un perfil" })} />

                    <button
                        type="button"
                        onClick={() => setOpen(!open)}
                        className="w-full px-3 py-2 text-sm border font-normal border-gray-200 bg-gray-50 rounded-md text-left hover:bg-white focus:ring-1 focus:ring-blue-400 transition-colors"
                    >
                        {perfilSeleccionado || "Seleccionar perfil"}
                    </button>

                    {open && (
                        <div className="absolute w-full mt-[70px] bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">

                            <div
                                onClick={() => handleSelect("Trabajadora Social", 1)}
                                className="px-3 py-2 text-sm font-normal hover:bg-gray-100 cursor-pointer"
                            >
                                Trabajadora Social
                            </div>

                            <div
                                onClick={() => handleSelect("Legales", 2)}
                                className="px-3 py-2 text-sm font-normal hover:bg-gray-100 cursor-pointer"
                            >
                                Legales
                            </div>

                            <div
                                onClick={() => handleSelect("Mesa de Entrada", 3)}
                                className="px-3 py-2 text-sm font-normal hover:bg-gray-100 cursor-pointer"
                            >
                                Data Entry
                            </div>

                            <div
                                onClick={() => handleSelect("Administrador", 4)}
                                className="px-3 py-2 text-sm font-normal hover:bg-gray-100 cursor-pointer"
                            >
                                Administrador
                            </div>

                        </div>
                    )}
                    {errors.rol_id && <p className="text-xs text-red-600 ml-1">{errors.rol_id.message}</p>}
                </div>

                <div className="col-span-full flex justify-center mt-2">
                    <button
                        type="submit"
                        disabled={cargando}
                        className={`text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-colors duration-200
                        ${cargando ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {cargando ? "Creando..." : "Crear Usuario"}
                    </button>
                </div>

            </div>
        </form>
    )
}

export default FormUsuario;