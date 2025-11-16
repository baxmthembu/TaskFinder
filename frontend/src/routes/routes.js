// routes.js
import { RouterProvider, createHashRouter, Navigate} from "react-router-dom";
import Home from "../Components/Home/home";
import ServiceRequestForm from "../Components/ServiceRequestForm/service_form";
import FreelancerLocationTracker from "../WorkerHome/workerhome";
import WorkerRegister from "../Worker/Register/workerRegister";
import WorkerLogin from "../Worker/Login/worker_login";
import FreelancerHome from "../Worker/FreelancerHome/freelancerhome";
import Navigator from "../Components/navigator";
import Login from "../Components/Login/login";
import Register from "../Components/Register/register";
import { ProtectedRoute } from "./ProtectedRoutes.js";
import WorkerProtectedRoute from "./workerProtectedRoute.js";

const router = createHashRouter([
  // Public routes - load immediately without waiting for auth
  {
    path: "/",
    element: <Navigator />,
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/workerRegister", element: <WorkerRegister /> },
  { path: "/worker_login", element: <WorkerLogin /> },

  // Client-specific routes (protected)
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/service_form", element: <ServiceRequestForm /> },
    ],
  },

  // Freelancer-specific routes (protected)
  {
    element: <WorkerProtectedRoute />,
    children: [
      { path: "/freelancerhome", element: <FreelancerHome /> },
      { path: "/workerhome", element: <FreelancerLocationTracker /> },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

const Routes = () => {
  return <RouterProvider router={router} />;
};

export default Routes;
