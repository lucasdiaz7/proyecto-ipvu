import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ToastProvider } from "./context/ToastContext.jsx";

// Estructura base: se necesita siempre, va eager para que el login no parpadee al abrir la app.
import Login from "./components/login/login.jsx";
import Layout from "./components/navBar/Layout.jsx";
import ProtectedRoute from "./components/routes/ProtectedRoute.jsx";

// Pantallas con carga diferida (lazy): cada una se descarga recien cuando el usuario entra a su ruta,
// asi el bundle inicial es mas liviano y la app abre mas rapido.
const Auditoria = lazy(() => import("./components/admin/Auditoria/Auditoria.jsx"));
const ExportarExpedientes = lazy(() => import("./components/admin/Exportar/ExportarExpedientes.jsx"));
const TrabajadorSocial = lazy(() => import("./components/admin/Trabajador Social/TrabajadorSocial.jsx"));
const DetalleUsuario = lazy(() => import("./components/admin/Usuarios/DetalleUsuario.jsx"));
const FormUsuario = lazy(() => import("./components/admin/Usuarios/FormUsuario.jsx"));
const Usuarios = lazy(() => import("./components/admin/Usuarios/Usuarios.jsx"));
const FormExpedientes = lazy(() => import("./components/data entry/FormExpedientes.jsx"));
const Home = lazy(() => import("./components/data entry/Home.jsx"));
const DetailExpedientes = lazy(() => import("./components/expedientes/DetailExpedientes.jsx"));
const Expedientes = lazy(() => import("./components/expedientes/Expedientes.jsx"));
const CambiarContrasena = lazy(() => import("./components/login/CambiarContraseña.jsx"));
const Form1 = lazy(() => import("./components/trabajadorSocial/Form/Form1.jsx"));
const Form2 = lazy(() => import("./components/trabajadorSocial/Form/Form2.jsx"));

// Se muestra mientras se descarga el codigo de la pantalla a la que se entra.
const CargandoPantalla = () => (
  <div className="w-full flex justify-center items-center py-20 text-gray-400 dark:text-slate-500 text-sm animate-pulse">
    Cargando...
  </div>
);

function App() {
  return (
    <div>
      <BrowserRouter>
        <ToastProvider>
        <Suspense fallback={<CargandoPantalla />}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Nadie entra a Layout (ni ve el NavBar) sin estar logueado */}
          <Route element={<ProtectedRoute allowedRoles={["1", "2", "3", "4"]} />}>
            <Route element={<Layout />}>
              {/* Rutas accesibles por cualquier usuario logueado, sin importar el rol */}
              <Route path="/CambiarContraseña" element={<CambiarContrasena />} />
              <Route path="/expedientes" element={<Expedientes />} />
              <Route path="/Expediente/:id" element={<DetailExpedientes />} />

              {/* Trabajadora social (1) */}
              <Route element={<ProtectedRoute allowedRoles={["1", "4"]} />}>
                <Route path="/form1" element={<Form1 />} />
                <Route path="/form2" element={<Form2 />} />
              </Route>

              {/* Data entry (3) */}
              <Route element={<ProtectedRoute allowedRoles={["3", "4"]} />}>
                <Route path="/dataEntry" element={<Home />} />
              </Route>

              {/* cargar un expediente nuevo: solo Mesa de Entrada (el administrador no carga) */}
              <Route element={<ProtectedRoute allowedRoles={["3"]} />}>
                <Route path="/nuevoExpediente" element={<FormExpedientes />} />
              </Route>

              {/* Administración: solo rol 4 */}
              <Route element={<ProtectedRoute allowedRoles={["4"]} />}>
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/crearUsuario" element={<FormUsuario />} />
                <Route path="/trabajadoraSocial" element={<TrabajadorSocial />} />
                <Route path="/DetalleUsuario/:id" element={<DetalleUsuario />} />
                <Route path="/auditoria" element={<Auditoria />} />
                <Route path="/exportar" element={<ExportarExpedientes />} />
              </Route>
            </Route>
          </Route>
        </Routes>
        </Suspense>
        </ToastProvider>
      </BrowserRouter>
    </div>
  )
}
export default App;
