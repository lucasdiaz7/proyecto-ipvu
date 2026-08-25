import HomeAdmin from "./components/admin/HomeAdmin.jsx";
import DetalleTS from "./components/admin/Trabajador Social/DetalleTS.jsx";
import TrabajadorSocial from "./components/admin/Trabajador Social/TrabajadorSocial.jsx";
import FormUsuario from "./components/admin/Usuarios/FormUsuario.jsx";
import Usuarios from "./components/admin/Usuarios/Usuarios.jsx";
import FormExpedientes from "./components/data entry/FormExpedientes.jsx";
import Home from "./components/data entry/Home.jsx";
import DetailExpedientes from "./components/expedientes/DetailExpedientes.jsx";
import Expedientes from "./components/expedientes/Expedientes.jsx";
import CambiarContraseña from "./components/login/CambiarContraseña.jsx";
import Login from "./components/login/login.jsx";
import Layout from "./components/navBar/Layout.jsx";
import ProtectedRoute from "./components/routes/ProtectedRoute.jsx";
import Form1 from "./components/trabajadorSocial/Form/Form1.jsx";
import Form2 from "./components/trabajadorSocial/Form/Form2.jsx";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";


function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Nadie entra a Layout (ni ve el NavBar) sin estar logueado */}
          <Route element={<ProtectedRoute allowedRoles={["1", "2", "3", "4"]} />}>
            <Route element={<Layout />}>
              {/* Rutas accesibles por cualquier usuario logueado, sin importar el rol */}
              <Route path="/CambiarContraseña" element={<CambiarContraseña />} />
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
                <Route path="/nuevoExpediente" element={<FormExpedientes />} />
              </Route>

              {/* Administración: solo rol 4 */}
              <Route element={<ProtectedRoute allowedRoles={["4"]} />}>
                <Route path="/homeAdmin" element={<HomeAdmin />} />
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/crearUsuario" element={<FormUsuario />} />
                <Route path="/trabajadoraSocial" element={<TrabajadorSocial />} />
                <Route path="/DetalleTS" element={<DetalleTS />} />
                <Route path="/DetalleTS/:id" element={<DetalleTS />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  )
}
export default App;
