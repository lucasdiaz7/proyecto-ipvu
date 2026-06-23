import React from 'react'
import { Link } from 'react-router-dom';

const DetailExpedientes = () => {
    const historial = [
        { estado: "fecha:", descripcion: "Recibido por Trabajador Social", fecha: "10/03/2024", responsable: "María López" },
        { estado: "Usuario Origen:", descripcion: "Trabajador Social realiza primera visita domiciliaria", fecha: "12/03/2024", responsable: "María López" },
        { estado: "Usuario Destino:", descripcion: "Trabajador Social realiza primera visita domiciliaria", fecha: "12/03/2024", responsable: "María López" },
        { estado: "Estado:", descripcion: "Expediente derivado al área de Legales", fecha: "20/03/2024", responsable: "Ana Martínez" },
        { estado: "Observaciones:", descripcion: "Titular presenta documentación requerida", fecha: "15/03/2024", responsable: "María López" },
        { estado: "Archivo:", descripcion: "Expediente aprobado", fecha: "25/03/2024", responsable: "Roberto Díaz" },
        { estado: "Descarga:", descripcion: "Expediente aprobado", fecha: "25/03/2024", responsable: "Roberto Díaz" },
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
                <div>
                    <p>remitente:Melanie Ibarra</p>
                    <p>mensaje: Ya se completo el formulario socio habitacional esta todo bien continua con el segundo formulario</p>
                    <p>fsh : verarchivo descar</p>
                    <Link to="/form2">
                        Realizar Tarea
                    </Link>


                </div>
                <h3 className="text-gray-800 font-bold text-xl">Historial de Movimiento</h3>
                {historial.map((movimiento) => (
                    <div key={movimiento.estado} className="relative flex gap-4 pb-6">
                        <div className="flex flex-col items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shrink.0"></div>
                            <div className="w-0.5 bg-blue-200 flex-1"></div>

                        </div>
                        <div className='bg-gray-50 border border-gray-200 rounded-x1 p-4 shadow-sm w-full'>
                            <p className="text-sm text-gray-500">Fecha: <span className="text-gray-800 font-semibold">{movimiento.fecha}</span></p>
                            <p className="text-sm text-gray-500 mt-1">Usuario Asignado: <span className="text-gray-800 font-semibold">{movimiento.responsable}</span></p>
                            <p className="text-sm text-gray-500 mt-1">Usuario Destino: <span className="text-gray-800 font-semibold"></span></p>
                            <p className="text-sm text-gray-500 mt-1">Estado: <span className="text-gray-800 font-semibold">{movimiento.estado}</span></p>
                            <p className="text-sm text-gray-500 mt-1">Observaciones: <span className="text-gray-800 font-semibold">{movimiento.descripcion}</span></p>
                            <div className='flex gap-3 mt3'>
                                <button className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg transition">
                                    Ver Archivo
                                </button>
                                <button className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-sm px-4 py-1.5 rounded-lg transition">
                                    Descargar
                                </button>
                            </div>
                        </div>
                    </div>

                ))}

            </div>

        </div>
    )
}

export default DetailExpedientes