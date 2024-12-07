import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider.js";

export const ProtectedRoute = () => {
    const {token} = useAuth()

    if(!token){
        return <Navigate to='/navigator' />
    }

    return <Outlet />
}