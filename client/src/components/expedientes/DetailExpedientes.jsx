import React from 'react'

const DetailExpedientes = () => {
    const historial = [
        { estado: "Sin Iniciar", descripcion: "Recibido por Trabajador Social", fecha: "10/03/2024", responsable: "María López" },
        { estado: "1ª Visita", descripcion: "Trabajador Social realiza primera visita domiciliaria", fecha: "12/03/2024", responsable: "María López" },
        { estado: "Legales", descripcion: "Expediente derivado al área de Legales", fecha: "20/03/2024", responsable: "Ana Martínez" },
        { estado: "2ª Visita", descripcion: "Titular presenta documentación requerida", fecha: "15/03/2024", responsable: "María López" },
        { estado: "Apto", descripcion: "Expediente aprobado", fecha: "25/03/2024", responsable: "Roberto Díaz" },
    ]
    return (
        <div className="w-full min-h-screen bg-gray-50 flex justify-center items-center p-4">
            <div className="w-full max-w-6xl bg-white shadow-lg rounded-2xl p-6 md:p-10">
                <h3 className="text-gray-800 font-bold text-xl">Datos del Titular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <div>
                        <p className="text-gray-600 text-sm">Nombre completo</p>
                        <p className="text-gray-800 font-semibold">María González</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">D.N.I</p>
                        <p className="text-gray-800 font-semibold">30.456.789</p>

                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">Domicilio</p>
                        <p className="text-gray-800 font-semibold">Av. Belgrano 1234</p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">Fecha De Inicio</p>
                        <p className="text-gray-800 font-semibold">23/04/2024</p>
                    </div>
                </div>
                <h3 className="text-gray-800 font-bold text-xl">Historial de Movimiento</h3>
                {historial.map((movimiento) => (
                    <div key={movimiento.estado} className="relative flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shrink.0"></div>
                            <div className="w-0.5 bg-blue-200 flex-1"></div>

                        </div>
                        <div>
                            <p className="text-gray-800 font-semibold">{movimiento.estado}</p>
                            <p className="text-gray-600 text-sm">{movimiento.descripcion}</p>
                            <p className="text-gray-500 text-xs mt-1">{movimiento.fecha} • {movimiento.responsable}</p>
                        </div>
                    </div>

                ))}

            </div>

        </div>
    )
}

export default DetailExpedientes