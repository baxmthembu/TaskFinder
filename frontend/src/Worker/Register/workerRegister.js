import {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {toast, Bounce} from 'react-toastify';
import Axios from 'axios';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "../../Components/Images/taskaroo.svg"


function WorkerRegister(){
    const [file, setFile] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        password: '',
        email: '',
        phone: '',
        occupation: '',
    })

    const [, setUserLocation] = useState(null)
    const [errors, setErrors] = useState({});

    const navigate = useNavigate()
  
    const uploadImage = async (e) => {
      e.preventDefault()
      setErrors({});
      if (!file) {
        console.error('No image selected');
        toast.error('Please select a profile image');
        return;
      }
  
      try {
        const location = await getLocation()

        //append form input into my form data to send it to my server
        const completeFormData = new FormData();
        completeFormData.append("name", formData.name);
        completeFormData.append("surname", formData.surname);
        completeFormData.append("password", formData.password);
        completeFormData.append("email", formData.email);
        completeFormData.append("phone", formData.phone);
        completeFormData.append("occupation", formData.occupation);
        completeFormData.append("latitude", location.latitude);
        completeFormData.append("longitude", location.longitude);
        completeFormData.append("images", file);


        //Post my form data into my backend server
        const res = await Axios.post(`${process.env.REACT_APP_API_URL}/registerWorker`, completeFormData);
        
        if(res.status === 200) {
          console.log('Success')
          toast.success('Registered Successfully', {
            position: toast.POSITION.TOP_CENTER
          })
          navigate('/worker_login')
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
            const { field, msg } = err.response.data;
            setErrors({ [field]: msg });
        } else {
            console.log('Failed', err)
            toast.error(err.response?.data?.msg || 'Failed to register', {
            position: toast.POSITION.TOP_CENTER
            })
        }
      }
    }


    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
    };
  
    const handleImageChange = (e) => {
      //const file = e.target.files[0];
      setFile(e.target.files[0]);
    };
    
    const getLocation = () => {
      //fetch the users location and then set the userLocation state as their current location
      return new Promise((resolve, reject) => {
        if ("geolocation" in navigator) {
          //navigator.geolocation.getCurrentPosition gets the current position
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              //set the latitude and longitude fetched from geolocation into latitude and longitude variable so I can send it into server
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

   return(
    <div className="min-h-screen bg-teal-50 flex flex-col">
      <header className="w-full max-w-screen-xl mx-auto flex items-center justify-between 
          py-4 px-6 border-b border-slate-300  backdrop-blur-md">
        {/* Back Button - LEFT */}
        <Link to="/worker_login" className="flex-shrink-0">
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

  <div className="flex flex-1 items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl border border-teal-100">
      <h1 className="text-3xl font-bold text-center text-teal-700 mb-2">
        Worker Registration
      </h1>
      <p className="text-gray-600 text-center mb-8">
        Join our team! Please fill in your details
      </p>

      <form onSubmit={uploadImage} encType="multipart/form-data">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={handleChange}
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
          </div>

          {/* Surname */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Surname <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.surname}
              onChange={handleChange}
              type="text"
              name="surname"
              placeholder="Your Surname"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.password}
              onChange={handleChange}
              type="password"
              name="password"
              placeholder="Create Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.email}
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="your.email@example.com"
              className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              name="phone"
              placeholder="Phone Number"
              className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Occupation <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.occupation}
              onChange={handleChange}
              type="text"
              name="occupation"
              placeholder="Your Occupation"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Profile Image */}
        <div className="mb-6 mt-6">
          <label className="block text-gray-700 font-medium mb-2">
            Upload Profile Image <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-teal-400 transition-colors">
            <input
              type="file"
              onChange={handleImageChange}
              name="images"
              className="w-full"
              accept="image/*"
            />
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, JPEG up to 5MB
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6">
          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Register as Worker
          </button>
        </div>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?
            <Link
              to="/worker_login"
              className="text-teal-600 hover:text-teal-800 font-medium ml-1 transition-colors"
            >
              Sign in here
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

   )
}


export default WorkerRegister