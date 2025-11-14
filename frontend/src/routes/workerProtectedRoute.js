import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/Authprovider";

const WorkerProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    // Redirect if not authenticated or if the role is not 'freelancer'
    return user && user.role === 'freelancer' ? <Outlet /> : <Navigate to="/worker_login" />;
};

export default WorkerProtectedRoute;