/*import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useAuth } from "../provider/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoutes";
import { Children } from "react";
import SearchJobs from "../Components/SearchBar/searchbar";
import SearchBar from "../Components/SearchBar/searchbar";
//import Card from "../Components/Cards/card";
import Home from "../Components/Home/home";
//import Properties from "../Components/Properties/properties"
import Login from "../Components/Login/login"
import Register from "../Components/Register/register";
import Plumber from "../Components/Home/home";
import Profile from "../Components/Profile/profile";
import About from "../Components/About/about";
import ClientComponent from "../Components/Home2/home2";
import FreelancerLocationTracker from "../WorkerHome/workerhome";
import Chat from "../Chat";
import Logout from "../Worker/Logout/logout";
import WorkerRegister from "../Worker/Register/workerRegister";
import WorkerLogin from "../Worker/Login/worker_login";
import FreelancerHome from "../Worker/FreelancerHome/freelancerhome";
import FreelancerAbout from "../Components/About/about";
import Navigator from "../Components/navigator";


const Routes = () => {
    const {token} = useAuth()

    //routes accessible only to authenticated users
    const routesForAuthenticatedOnly = [
        {
            path: "/",
            element: <ProtectedRoute />,
            children: [
                {
                    path: "/searchbar",
                    element: <SearchBar />
                },
                {
                    path: "/home",
                    element: <Plumber />
                },
                {
                    path: "/profile",
                    element: <Profile />
                },
                {
                    path: "/about",
                    element: <About />
                },
                {
                    path: "/home2",
                    element: <ClientComponent />
                },
                {
                    path: "/workerhome",
                    element: <FreelancerLocationTracker />
                },
                {
                    path: "/Chat",
                    element: <Chat />
                },
                {
                    path: "/logout",
                    element: <Logout />
                },
                {
                    path: "/freelancerhome",
                    element: <FreelancerHome />
                },
                {
                    path: "/about",
                    element: <FreelancerAbout />
                }
            ]
        }
    ]

    //routes accessible only to none authenticated users
    const routesForNotAuthenticatedOnly = [
        {
            path: "/login",
            element: <Login />
        },
        {
            path: "/register",
            element: <Register />
        },
        {
            path: "/workerRegister",
            element: <WorkerRegister />
        },
        {
            path: "/worker_login",
            element: <WorkerLogin />
        },
        {
            path: "/navigator",
            element: <Navigator />
        }

    ]

    // Catch-all route to handle 404s
    const catchAllRoute = {
        path: "*",
        element: token ? <Home /> : <Login />  // Redirect based on authentication state
    };

    //createBrowserRouter function is used to create the router configuration. It takes an array of routes as its argument
    //the spread operator (...) is used to merge the route arrays into a single array
    //The conditional expression (!token ? routesForNotAuthenticatedOnly : []) checks if the user is authenticated (token exists). If not, it includes the routesForNotAuthenticatedOnly array; otherwise, it includes an empty array.
    const router = createBrowserRouter([
        ...(!token ? routesForNotAuthenticatedOnly : []),
        ...routesForAuthenticatedOnly,
        catchAllRoute
    ])

    return <RouterProvider router={router} />
}

export default Routes*/

import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { useContext, Navigate } from "react";
import { useAuth } from "../provider/AuthProvider";
import { ProtectedRoute } from "./ProtectedRoutes";
import SearchBar from "../Components/SearchBar/searchbar";
import Home from "../Components/Home/home";
import Profile from "../Components/Profile/profile";
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
import { UserContext } from "../UserContext";

const Routes = () => {
  const { token } = useAuth();
  const { user } = useContext(UserContext); // Get user from context to determine role

  // Routes accessible to authenticated clients only
  const clientRoutes = [
    {
        path: '/',
        element: <ProtectedRoute />,
        children: [
            { path: "/searchbar", element: <SearchBar /> },
            { path: "/home", element: <Home /> },
            { path: "/profile", element: <Profile /> },
            { path: "/workerhome", element: <FreelancerLocationTracker /> }, // Common route
            { path: "/chat", element: <Chat /> }, // Common route
            {path: "/about", element: <About />}
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
            { path: "/chat", element: <Chat /> }, // Common route
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

  // Determine accessible routes based on role
  const authenticatedRoutes = user?.role === 'client'
    ? clientRoutes
    : user?.role === 'freelancer'
    ? workerRoutes
    : [];

  // Catch-all route to handle 404s or redirection
  const catchAllRoute = {
    path: "*",
    element: token ? (user ? <Login /> : <WorkerLogin />) : <Navigator />//<Navigator />,// Redirect to <Navigator /> if no token is present
};


  const router = createBrowserRouter([
    { path: "/", element: <Navigator /> },
    ...(!token ? routesForNotAuthenticatedOnly : []),
    ...authenticatedRoutes.map((route) => ({
      ...route,
      element: <ProtectedRoute>{route.element}</ProtectedRoute>,
    })),
    catchAllRoute,
  ]);

  return <RouterProvider router={router} />;
};

export default Routes;
