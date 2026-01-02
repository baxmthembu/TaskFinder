import {useState, useEffect} from "react";
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Bounce } from "react-toastify";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../provider/authProvider";
import logo from "../../Components/Images/taskaroo.svg"

const WorkerLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { worker_login, user } = useAuth()

    const [formData, setFormData]= useState({
        name: '',
        password:'',
      })
    const [errors, setErrors] = useState({});

    const validate = () => {
        let result = true;
        if (formData.name === '' || formData.password === null) {
          result = false;
          toast.warning('Please Enter Username');
        }
        if (formData.password === '' || formData.password === null) {
              result = false;
              toast.warning('Please Enter Password');
        }
            return result;
    }

    // Check if form is valid (all fields filled)
    const isFormValid = () => {
        return formData.name.trim() !== '' && formData.password.trim() !== '';
    }
    
    const Login = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setErrors({});

      try {
        if (validate()) {
          
          const credentials = { ...formData };
         
          const result = await worker_login(credentials);
         
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


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name]: value});
      }
        
  useEffect(() => {
    if (user && user.role === 'freelancer') {
      // If user is already logged in as a freelancer, redirect them
      window.location.hash = '#/freelancerhome';
    }
  }, [user]);

  if (user && user.role === 'freelancer') {
    return <Navigate to="/freelancerhome" replace />;
  }
          
  return (
    <div className="min-h-screen bg-teal-50 flex flex-col font-sans">
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

      {/* Login Card */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="bg-white border border-teal-100 rounded-2xl shadow-lg shadow-lime-100 p-10 w-full max-w-md ">
          <h1 className="text-4xl font-extrabold text-center text-teal-700 mb-2 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-slate-600 text-center mb-8">
            Sign in and continue your adventure 🚀
          </p>

          <form onSubmit={Login}>
            {/* Name */}
            <div className="mb-5">
              <label className="block text-slate-700 font-medium mb-2">
                Name<span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleChange}
                name="name"
                className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition`}
                placeholder="Enter your username"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-slate-700 font-medium mb-2">
                Password<span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={handleChange}
                name="password"
                className={`w-full px-4 py-3 border ${errors.password ? 'border-red-500' : 'border-slate-300'} rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Sign In Button */}
            <div className="button-container mb-6">
              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
                isFormValid()
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Sign Up Redirect */}
            <div className="text-center">
              <p className="text-slate-600">
                Don’t have an account?
                <Link
                  to="/workerRegister"
                  className="text-teal-600 hover:text-emerald-600 font-semibold ml-1 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      <ToastContainer
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        theme="colored"
        transition={Bounce}
      />
    </div>
  )
};

export default WorkerLogin
