
import { Outlet } from "react-router"
import NavBar from "./NavBar"

const Layout = () => {
    return (
        <div>
            <NavBar />
            <div className="pt-12">

                <Outlet />
            </div>
        </div>
    )
}

export default Layout