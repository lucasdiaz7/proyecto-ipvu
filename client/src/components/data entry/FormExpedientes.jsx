import { useState } from "react";


const FormExpedientes = () => {
    const [open, setOpen] = useState(false);
    const [perfil, setPerfil] = useState("");

    const label = ["Nombre", "Apellido", "DNI", "Email", "Telefono", "Direccion actual", "Telefono"]

    const perfiles = ["Rocio Lopez", "Cecilia Arce", "Sol Martinez", "Fernanda Zurita"]

    const handleSelect = (p) => {
        setPerfil(p);
        setOpen(false);
    }

    return (
        <form className="min-h-screen bg-gray-100 flex items-center justify-center ">
            <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-5">

                <h3 className="text-gray-800 font-bold text-[18px] tracking-tight text-center col-span-full">
                    Crear Nuevo Expediente
                </h3>

                {label.map((e) => (
                    <div key={e} className='grid grid-cols-1'>
                        <label className="text-gray-800 font-semibold text-base">{e}</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 font-normal text-sm border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 focus:bg-white transition-all duration-200 rounded-md"
                        />
                    </div>
                ))}

                <div className=" relative">
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
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-6 py-2 rounded-lg shadow-sm transition-colors duration-200"
                    >
                        Crear Expediente
                    </button>
                </div>

            </div>
        </form>
    )
}

export default FormExpedientes