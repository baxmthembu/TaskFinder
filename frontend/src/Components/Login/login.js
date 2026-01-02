import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../../provider/authProvider";
import logo from '../Images/taskaroo.svg'

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const {login, user} = useAuth()
  const [ , setUserLocation] = useState({ latitude: null, longitude: null });
  const [formData, setFormData] = useState({
    username: '',
    password:'',
  });
  const [errors, setErrors] = useState({});

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ latitude, longitude });
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            resolve({ latitude, longitude });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error("Geolocation is not available in this browser."));
      }
    });
  };


const ProceedLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (validate()) {
        
        const location = await getLocation();
        const credentials = { ...formData, ...location };
         
        const result = await login(credentials);
         
        if (result.success) {
          toast.success(`Welcome ${result.user.name}`, {
            position: toast.POSITION.TOP_CENTER
          });
           
          // Redirect based on user role
        } else {
          // Handle specific error types
          if (result.field) {
            setErrors({ [result.field]: result.error });
          } else {
            const errorMessage = result.error || result.msg || 'Login failed. Please try again.';
            
            // Check if it's a validation error (array of errors)
            if (result.errors && Array.isArray(result.errors)) {
              const validationErrors = result.errors.map(err => err.msg).join(', ');
              toast.error(validationErrors, {
                position: toast.POSITION.TOP_CENTER
              });
            } else {
              toast.error(errorMessage, {
                position: toast.POSITION.TOP_CENTER
              });
            }
          }
        }
      }
    } catch (error) {
      console.log('Error: ' + error);
      toast.error('An unexpected error occurred', {
        position: toast.POSITION.TOP_CENTER
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    let result = true;
    if (formData.username === '' || formData.username === null) {
      result = false;
      toast.warning('Please Enter Username');
    }
    if (formData.password === '' || formData.password === null) {
      result = false;
      toast.warning('Please Enter Password');
    }
    return result;
  };

  // Check if form is valid (all fields filled)
  const isFormValid = () => {
    return formData.username.trim() !== '' && formData.password.trim() !== '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    if (user) {
      // If user is already logged in, redirect them
      window.location.hash = '#/service_form';
    }
  }, [user]);

  if (user) {
    return <Navigate to="/service_form" replace />;
  }

  
return (
  <div className="min-h-screen flex flex-col bg-teal-50 font-sans overflow-hidden">
    {/* Header */}
    <header className="w-full max-w-screen-xl mx-auto flex items-center justify-between 
      py-4 px-6 border-b border-slate-300  backdrop-blur-md">
      {/* Back Button - LEFT */}
      <Link to="/" className="flex-shrink-0">
        <button
          className="flex items-center text-teal-600 hover:text-teal-800 font-semibold
          transition-all duration-300 hover:bg-teal-100 px-3 py-2 rounded-lg
          text-sm sm:text-base"
        >
          <svg xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>

          <span className="hidden sm:inline">Back to Navigator</span>
          <span className="sm:hidden text-m">Back</span>
        </button>
      </Link>

      {/* Logo - RIGHT */}
      <div className="flex-shrink-0 pt-6">
        <img
          src={logo}
          alt="Logo"
          className="w-32 sm:w-40 md:w-52 lg:w-60 drop-shadow-md"
        />
      </div>

    </header>



    {/* Main Content */}
    <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 overflow-y-auto">
      <div className="bg-white border border-lime-200 rounded-xl sm:rounded-2xl shadow-lg shadow-lime-100 w-full max-w-xs sm:max-w-sm md:max-w-md p-5 sm:p-6 md:p-8 lg:p-10 mx-auto">

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-teal-700 mb-2">Sign In</h1>
        <p className="text-slate-600 text-center text-sm sm:text-base mb-5 sm:mb-6 md:mb-8 font-medium">
          Welcome back! Please enter your details 🌟
        </p>

        <form onSubmit={ProceedLogin}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-slate-700 font-medium mb-1 text-sm sm:text-base">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border ${errors.username ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm sm:text-base`}
              placeholder="Enter your username"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-slate-700 font-medium mb-1 text-sm sm:text-base">
              Password <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border ${errors.password ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm sm:text-base`}
              placeholder="Enter your password"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className={`w-full py-2 sm:py-3 rounded-lg font-semibold text-lg sm:text-base md:text-lg transition-all duration-300
              ${isFormValid() ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Register Link */}
          <p className="text-center text-slate-600 text-sm sm:text-base mt-4">
            Don't have an account?
            <Link to="/register" className="text-teal-600 hover:text-emerald-600 font-semibold ml-1">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>

    {/* Toast Container */}
    <ToastContainer autoClose={5000} hideProgressBar theme="colored" transition={Bounce} />
  </div>
);
};

export default Login