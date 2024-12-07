import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/workerAuthProvider";

const workerProtectedRoute = () => {
    const {workerToken} = useAuth()

    if(!workerToken){
        <Navigate to="/worker_login" />
    }
}