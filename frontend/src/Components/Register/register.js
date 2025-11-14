import { useState } from 'react';
import {useNavigate, Link} from 'react-router-dom'
import {toast} from 'react-toastify';
import Axios from 'axios';
import logo from '../Images/taskaroo.svg'

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        password: '',
        email: '',
        phone: '',
        username: '',
    });

    const [ ,setUserLocation] = useState(null)


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
      
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData({...formData, [name]: value});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(IsValidate()){
            try {
                const location = await getLocation()
                //const response = await Axios.post('http://localhost:3001/register', {...formData, ...location});
                const response = await Axios.post(`${process.env.REACT_APP_API_URL}/register`, { ...formData, ...location});

                if(response.status === 200){
                    console.log('Register Successful')
                    toast.success('Registration Successful',{
                      position: toast.POSITION.TOP_CENTER
                    })
                    navigate('/login')
                }else{
                    console.error('Registration Failure')
                }
            }catch (error) {
                console.error('An error occured: ' + error)
            }
        }
    }

    const navigate = useNavigate();

    const IsValidate = () => {
        console.log('IsValidate function called');
        const requiredFields = ['name', 'surname', 'password', 'email', 'phone', 'username'];
        let isProceed = true;
        let errorMessage = 'Please enter a value for ';
    
        requiredFields.forEach(field => {
          if (!formData[field] || formData[field] === '') {
            isProceed = false;
            errorMessage += `${field.charAt(0).toUpperCase() + field.slice(1)}, `;
          }
        });
    
        if (!isProceed) {
          console.error(errorMessage.slice(0, -2)); // Remove the last comma and space
          return false;
        }
    
        if (!/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[A-Za-z]+$/.test(formData.email)) {
          console.error('Please enter a valid email');
          return false;
        }
    
        return true;
      };
  

    /*return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-transparent py-4 px-6 flex items-center justify-between">
          <div className="back-button">
            <Link to="/login">
              <button className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Login
              </button>
            </Link>
          </div>
          <div className="logo ml-10 mt-9">
            <img src={logo} alt="Logo" className="max-w-[25rem]" />
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Create Account</h1>
            <p className="text-gray-600 text-center mb-8">Join us today! Please fill in your details</p>
      
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.name} 
                    onChange={handleChange}
                    type="text" 
                    name="name" 
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Surname Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Surname <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.surname} 
                    onChange={handleChange}
                    type="text" 
                    name="surname" 
                    placeholder="Enter your surname"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Password Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.password} 
                    onChange={handleChange}
                    type="password" 
                    name="password" 
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Email Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.email} 
                    onChange={handleChange}
                    type="email" 
                    name="email" 
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Phone Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.phone} 
                    onChange={handleChange}
                    type="tel" 
                    name="phone" 
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Username Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.username} 
                    onChange={handleChange}
                    type="text" 
                    name="username" 
                    placeholder="Enter your username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Register Button *}
              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Create Account
                </button>
              </div>

              {/* Login Link *}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account? 
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
         </div>
        </div>
    )*/
   return (
    <div className="min-h-screen bg-teal-50 flex flex-col">
  <header className="bg-transparent py-4 px-6 flex items-center justify-between">
    <div className="back-button">
      <Link to="/login">
        <button className="flex items-center text-teal-600 hover:text-teal-800 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-teal-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Login
        </button>
      </Link>
    </div>

    {/*<div className="logo ml-10 mt-9">
      <img src={logo} alt="Logo" className="max-w-[25rem]" />
    </div>*/}
    <div className="logo ml-10 mt-6">
          <img src={logo} alt="Logo" className="max-w-[20rem] drop-shadow-md" />
        </div>
  </header>

  <div className="flex flex-1 items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl border border-teal-100">
      <h1 className="text-3xl font-bold text-center text-teal-700 mb-2">Create Account</h1>
      <p className="text-gray-600 text-center mb-8">Join our community! Fill in your details below</p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={handleChange}
              type="text"
              name="name"
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Surname <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.surname}
              onChange={handleChange}
              type="text"
              name="surname"
              placeholder="Enter your surname"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.password}
              onChange={handleChange}
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.email}
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.username}
              onChange={handleChange}
              type="text"
              name="username"
              placeholder="Enter your username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Create Account
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?
            <Link
              to="/login"
              className="text-teal-600 hover:text-teal-800 font-medium ml-1 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  </div>
</div>

   )
}

export default Register