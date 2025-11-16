import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";
import LoadingSpinner from "../Components/LoadingSpinner/LoadingSpinner";

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingSpinner message="Authenticating user..." />;
    }

    // Redirect if not authenticated or if the role is not 'client'
    return user && user.role === 'client' ? <Outlet /> : <Navigate to="/login" />;
};
