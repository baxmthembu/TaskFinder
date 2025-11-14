import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../provider/authProvider";

export const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner component
    }

    // Redirect if not authenticated or if the role is not 'client'
    return user && user.role === 'client' ? <Outlet /> : <Navigate to="/login" />;
};
