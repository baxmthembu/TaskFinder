import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import LoadingSpinner from "../Components/LoadingSpinner/LoadingSpinner";

const WorkerProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Authenticating freelancer..." />;
    }

    // Redirect if not authenticated or if the role is not 'freelancer'
    return user && user.role === 'freelancer' ? <Outlet /> : <Navigate to="/worker_login" />;
};

export default WorkerProtectedRoute;