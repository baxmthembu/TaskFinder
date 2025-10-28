import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/Authprovider.js";

export const ProtectedRoute = () => {
    const {user,loading} = useAuth()

    if (loading) {
    return <div>Loading...</div>; // temporary loader
  }

    /*if(!token){
        return <Navigate to='/navigator' />
    }

    return <Outlet />*/
    return user ? <Outlet /> : <Navigate to="/navigator" />;
}
