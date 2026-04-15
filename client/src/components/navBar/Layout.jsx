
import { Outlet } from "react-router"
import NavBar from "./NavBar"

const Layout = () => {
    return (
        <div>
            <NavBar />
            <Outlet />
        </div>
    )
}

export default Layout