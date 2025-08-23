import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider.js";

export const ProtectedRoute = () => {
    const {token} = useAuth()

    if (token === null) {
    return <div>Loading...</div>; // temporary loader
  }

    /*if(!token){
        return <Navigate to='/navigator' />
    }

    return <Outlet />*/
    return token ? <Outlet /> : <Navigate to="/navigator" />;
}
