import {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {toast, Bounce} from 'react-toastify';
import Axios from 'axios';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from "../../Components/Images/taskaroo.svg"


function WorkerRegister(){
    const [file, setFile] = useState()

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        password: '',
        email: '',
        phone: '',
        occupation: '',
    })

    const [, setUserLocation] = useState(null)

    const navigate = useNavigate()


    /*const IsValidate = () => {
      console.log('IsValidate function called');
      const requiredFields = ['name', 'surname', 'password', 'email', 'phone', 'occupation'];
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
    };*/
  
    const uploadImage = async (e) => {
      e.preventDefault()
      if (!file) {
        console.error('No image selected');
        return;
      }
  
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
       //Axios.post("http://localhost:3001/registerWorker", completeFormData)
       Axios.post(`${process.env.REACT_APP_API_URL}/registerWorker`, completeFormData )
      .then(res => {
        if(res.status === 200) {
          console.log('Success')
          toast.success('Registered Successfuly', {
            position: toast.POSITION.TOP_CENTER
          })
          navigate('/worker_login')
        }else{
          console.log('Failed')
          toast.error('Failed to register', {
            position: toast.POSITION.TOP_CENTER
          })
          
          //navigate('/worker_login')
          
          return;
        }
      })
      .catch((err) => console.log(err))
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


    /*return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <header className="bg-transparent py-4 px-6 flex items-center justify-between">
          <div className="back-button">
            <Link to="/worker_login">
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
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Worker Registration</h1>
            <p className="text-gray-600 text-center mb-8">Join our team! Please fill in your details</p>
      
            <form onSubmit={uploadImage} encType='multipart/form-data'>
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
                    placeholder="Your Name"
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
                    placeholder="Your Surname"
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
                    placeholder="Create Password"
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
                    placeholder="your.email@example.com"
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
                    placeholder="Phone Number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                {/* Occupation Field *}
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Occupation <span className="text-red-500">*</span>
                  </label>
                  <input 
                    value={formData.occupation} 
                    onChange={handleChange}
                    type="text" 
                    name="occupation" 
                    placeholder="Your Occupation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Image Upload Field - Full Width *}
              <div className="mb-6 mt-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Profile Image <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors">
                  <input 
                    type="file" 
                    onChange={handleImageChange} 
                    name="images"
                    className="w-full"
                    accept="image/*"
                  />
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, JPEG up to 5MB</p>
                </div>
              </div>

              {/* Register Button *}
              <div className="mt-6">
                <button 
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  Register as Worker
                </button>
              </div>

              {/* Login Link *}
              <div className="text-center mt-6">
                <p className="text-gray-600">
                  Already have an account? 
                  <Link to="/worker_login" className="text-indigo-600 hover:text-indigo-800 font-medium ml-1 transition-colors">
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
    )*/
   return(
    <div className="min-h-screen bg-teal-50 flex flex-col">
  <header className="bg-transparent py-4 px-6 flex items-center justify-between">
    <div className="back-button">
      <Link to="/worker_login">
        <button className="flex items-center text-teal-600 hover:text-teal-800 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-teal-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
          Back to Login
        </button>
      </Link>
    </div>

    {/*<div className="logo ml-10 mt-9">
      <img src={logo} alt="Logo" className="max-w-[25rem]" />
    </div>*/}
    <div className="logo ml-10 mt-4">
          <img src={logo} alt="Logo" className="max-w-[18rem] drop-shadow-md" />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
            />
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