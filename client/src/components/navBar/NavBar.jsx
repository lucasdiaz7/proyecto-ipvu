import { Link } from "react-router";

const NavBar = () => {
    return (
        <nav className=" relative bg-blue-500 w-full h-12 px-4 flex items-center justify-between">


            <div className="flex items-center">
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
                    Lucas Diaz
                </span>

                <span className="text-white sm:hidden">
                    Lucas
                </span>
                <Link to="/login">
                    <button className="hidden sm:block text-white px-3 py-1 bg-blue-800 hover:bg-blue-950 rounded-lg font-semibold transition-colors">
                        Salir
                    </button>
                </Link>
            </div>
        </nav>
    );
};

export default NavBar;