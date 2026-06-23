import { Link, useNavigate } from "react-router";
import { authService } from "../../services/authService/authService";

const NavBar = () => {
    const navigate = useNavigate();

    const nombreUsuario = localStorage.getItem("nombre_completo")

    const handleLogout = () => {
        authService.cerrarSesion()

        navigate("/login")
    }

    const onClickUsuario = () => {
        try {
            const userRolId = localStorage.getItem("rol_id");

            switch (userRolId) {
                // trabajadora social
                case "1":
                    navigate("/expedientes");
                    break;

                case "2":
                    navigate("/expedientes");
                    break;

                // data entry
                case "3":
                    navigate("/expedientes");
                    break;

                case "4":
                    navigate("/homeAdmin");
                    break;
            }

        } catch (err) {
            console.log(err)
        }
    }

    return (
        <nav className="fixed top-0 left-0 z-50 bg-blue-500 w-full h-12 px-4 flex items-center justify-between">


            <div className="flex items-center cursor-pointer" onClick={onClickUsuario}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-6 h-6 text-white sm:hidden"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 6h18M3 12h18M3 18h18"
                    />
                </svg>
                <svg
                    className="w-6 h-6 text-white hidden sm:block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                </svg>
                <h3 className="hidden sm:block text-white text-[15px] leading-tight ml-2 font-medium">
                    IPVU Santiago del Estero
                </h3>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 sm:hidden">
                <h3 className="text-white text-[15px] font-medium">
                    IPVU
                </h3>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-white hidden sm:block">
                    {nombreUsuario}
                </span>

                <span className="text-white sm:hidden">
                    {nombreUsuario}
                </span>

                <button onClick={handleLogout} className="hidden sm:block text-white px-3 py-1 bg-blue-800 hover:bg-blue-950 rounded-lg font-semibold transition-colors cursor-pointer">
                    Salir
                </button>

            </div>
        </nav>
    );
};

export default NavBar;