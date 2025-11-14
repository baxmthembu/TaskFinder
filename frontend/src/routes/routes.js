/*import { RouterProvider, createBrowserRouter, createHashRouter } from "react-router-dom";
import { useContext, useNavigate, useState, useEffect, Children } from "react";
import { useAuth } from "./../provider/Authprovider";
import { ProtectedRoute } from "./ProtectedRoutes";
//import SearchBar from "../Components/SearchBar/searchbar";
import Home from "../Components/Home/home";
import ServiceRequestForm from "../Components/ServiceRequestForm/service_form";
import About from "../Components/About/about";
import FreelancerLocationTracker from "../WorkerHome/workerhome";
import Chat from "../Chat";
import WorkerRegister from "../Worker/Register/workerRegister";
import WorkerLogin from "../Worker/Login/worker_login";
import FreelancerHome from "../Worker/FreelancerHome/freelancerhome";
import FreelancerAbout from "../Worker/FreelancerAbout/freelancer_about";
import Navigator from "../Components/navigator";
import Login from "../Components/Login/login";
import Register from "../Components/Register/register";
import { Navigate } from "react-router-dom";

const Routes = () => {
    const { token } = useAuth();
  
    // While checking localStorage/user context
    if (loading) return <div>Loading...</div>;

    // Routes accessible to authenticated clients only
    const clientRoutes = [
        {
            path: '/',
            element: <ProtectedRoute />,
            children: [
                //{ path: "/searchbar", element: <SearchBar /> },
                { path: "/home", element: <Home /> },
                { path: "/service_form", element: <ServiceRequestForm /> },
                { path: "/workerhome", element: <FreelancerLocationTracker /> },
                { path: "/chat", element: <Chat /> },
                { path: "/about", element: <About /> },          
            ]
        }
    ];
  
    // Routes accessible to authenticated workers only
    const workerRoutes = [
        {
            path: '/',
            element: <ProtectedRoute />,
            children: [
                { path: "/freelancerhome", element: <FreelancerHome /> },
                { path: "/freelancer_about", element: <FreelancerAbout /> },
                { path: "/chat", element: <Chat /> },          
            ]
        }
    ];
  
    // Routes accessible to non-authenticated users
    const routesForNotAuthenticatedOnly = [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/workerRegister", element: <WorkerRegister /> },
      { path: "/worker_login", element: <WorkerLogin /> },
      { path: "/navigator", element: <Navigator /> },
    ];
  
    // Determine routes based on role
    const authenticatedRoutes =
      user?.role === "client"
        ? clientRoutes
        : user?.role === "freelancer"
        ? workerRoutes
        : [];
  
    // Catch-all route fallback
    const catchAllRoute = {
      path: "*",
      element: token
        ? user
          ? <Login />
          : <WorkerLogin />
        : <Navigate to="/navigator" replace />,
    };
  
    const router = createHashRouter([
      {
        path: "/",
        element: <Navigate to="/navigator" replace />,
      },
      ...(!token ? routesForNotAuthenticatedOnly : []),
      ...authenticatedRoutes.map((route) => ({
        ...route,
        element: <ProtectedRoute>{route.element}</ProtectedRoute>,
      })),
      catchAllRoute,
    ]);
  
    return <RouterProvider router={router} />;
  };
  
export default Routes*/
 
/*const router = createBrowserRouter([
    { path: "/", element: <Navigator /> },
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...authenticatedRoutes.map((route) => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>,
    })),
    catchAllRoute,
  ]);*/


// routes.js
import { RouterProvider, createHashRouter, Navigate} from "react-router-dom";
import { useAuth } from "./../provider/Authprovider";
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

const Routes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const router = createHashRouter([
    {
      path: "/",
      element: <Navigator />,
    },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/workerRegister", element: <WorkerRegister /> },
    { path: "/worker_login", element: <WorkerLogin /> },

    // Client-specific routes
    {
      element: <ProtectedRoute />,
      children: [
        { path: "/home", element: <Home /> },
        { path: "/service_form", element: <ServiceRequestForm /> },
      ],
    },

    // Freelancer-specific routes
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

  return <RouterProvider router={router} />;
};

export default Routes;
