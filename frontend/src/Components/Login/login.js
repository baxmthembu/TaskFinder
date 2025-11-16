import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import ReCAPTCHA from 'react-google-recaptcha';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from "../../provider/authProvider";
import logo from '../Images/taskaroo.svg'

const Login = () => {
  const [captchaValue, setCaptchaValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {login, user} = useAuth()
  const [ , setUserLocation] = useState({ latitude: null, longitude: null });
  const [formData, setFormData] = useState({
    username: '',
    password:'',
  });

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
          toast.error(result.error || 'Log In Error', {
            position: toast.POSITION.TOP_CENTER
          });
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

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
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

  /*return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-transparent py-4 px-6 flex items-center justify-between">
        <div className="back-button">
          <Link to="/">
            <button className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
          </Link>
        </div>
        <div className="logo ml-10 mt-9"> 
          <img src={logo} alt="Logo" className="max-w-[25rem]" />
        </div>
      </header>
  
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Sign In</h1>
          <p className="text-gray-600 text-center mb-8">Welcome back! Please enter your details</p>
      
          <form onSubmit={ProceedLogin}>
            <div className="mb-5">
              <label className="block text-gray-700 font-medium mb-2">Username<span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formData.username} 
                onChange={handleChange} 
                name='username'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your username"
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Password<span className="text-red-500">*</span></label>
              <input 
                type="password" 
                value={formData.password} 
                onChange={handleChange} 
                name='password'
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                placeholder="Enter your password"
              />
            </div>
        
            <div className="mb-6">
              <ReCAPTCHA
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                className="flex justify-center"
              />
            </div>
        
        
            <div className="button-container mb-6">
              <button 
                type="submit"
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${captchaValue 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                disabled={!captchaValue || isLoading} 
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
        
            <div className="text-center">
              <p className="text-gray-600">Don't have an account? 
                <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
  
      <ToastContainer
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        theme="colored"
        transition={Bounce}
      />
    </div>
  );*/
  return (
    <div className="min-h-screen flex flex-col bg-teal-50 font-sans">
  {/* Header */}
  <header className="bg-transparent py-6 px-8 flex items-center justify-between">
    <div className="back-button">
      <Link to="/">
        <button className="flex items-center text-teal-600 hover:text-teal-800 font-semibold transition-all duration-300 hover:bg-teal-100 px-4 py-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Navigator
        </button>
      </Link>
    </div>

    <div className="logo ml-10 mt-6">
      <img src={logo} alt="Logo" className="max-w-[20rem] drop-shadow-md" />
    </div>
  </header>

  {/* Main Content */}
  <div className="flex flex-1 items-center justify-center p-6">
    <div className="bg-white border border-lime-200 rounded-2xl shadow-lg shadow-lime-100 p-10 w-full max-w-md  ">
      <h1 className="text-4xl font-extrabold text-center text-teal-700 mb-2 tracking-tight">
        Sign In
      </h1>
      <p className="text-slate-600 text-center mb-8">
        Welcome back! Please enter your details 🌟
      </p>

      <form onSubmit={ProceedLogin}>
        {/* Username */}
        <div className="mb-5">
          <label className="block text-slate-700 font-medium mb-2">
            Username<span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={handleChange}
            name="username"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            placeholder="Enter your username"
          />
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
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            placeholder="Enter your password"
          />
        </div>

        {/* reCAPTCHA */}
        <div className="mb-6 flex justify-center">
          <ReCAPTCHA
            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
        </div>

        {/* Sign In Button */}
        <div className="button-container mb-6">
          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
              captchaValue
                ? 'bg-teal-500 hover:bg-emerald-500 text-white shadow-md shadow-teal-200'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!captchaValue || isLoading}
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

        {/* Register Link */}
        <div className="text-center">
          <p className="text-slate-600">
            Don’t have an account?
            <Link
              to="/register"
              className="text-teal-600 hover:text-emerald-600 font-semibold ml-1 transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </form>
    </div>
  </div>

  {/* Toast Notifications */}
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

export default Login