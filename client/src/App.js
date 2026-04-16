import HomeAdmin from "./components/admin/HomeAdmin.jsx";
import Expedientes from "./components/expedientes/Expedientes.jsx";
import Login from "./components/login/login.jsx";
import Layout from "./components/navBar/Layout.jsx";
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

          <Route element={<Layout />}>
            <Route path="/expedientes" element={<Expedientes />} />
            <Route path="/form1" element={<Form1 />} />
            <Route path="/form2" element={<Form2 />} />
            <Route path="/homeAdmin" element={<HomeAdmin />} />
          </Route>


        </Routes>

      </BrowserRouter>
    </div>
  )
}

export default App;
