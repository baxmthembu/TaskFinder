import React, {useEffect, useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {toast, Bounce} from 'react-toastify';
import Axios, { AxiosError } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
//import Plumber from '../Components/Home/home';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { light } from '@mui/material/styles/createPalette';
import styles from '../Register/workerRegister.module.css'


function WorkerRegister({history}){
    const [file, setFile] = useState()

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        password: '',
        email: '',
        phone: '',
        occupation: '',
    })

    const [userLocation, setUserLocation] = useState(null)

    const navigate = useNavigate()
    //const logo3 = require('./../Components/Images/logo.png')


    const IsValidate = () => {
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
    };
  
    const uploadImage = async (e) => {
      e.preventDefault()
      if (!file) {
        console.error('No image selected');
        return;
      }
  
      /*const formData1 = new FormData();
      formData1.append("image", file);*/

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
       Axios.post("http://localhost:3001/registerWorker", completeFormData)
      .then(res => {
        if(res.data.status === 200) {
          console.log('Success')
          toast.success('Registered Successfuly', {
            position: toast.POSITION.TOP_CENTER
          })
          navigate('/worker_login.js')
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

    const logo1 = require('../../Components/Images/Taskify.png');


    return (
        <div className={styles.app}>
          <div className={styles.back_button}>
            <Link to="/worker_login">
              <button className={styles.button28}>Back</button>
           </Link>
          </div>
          <div className={styles.logo}>
            <img src= {logo1} />
          </div>
            <div className={styles.loginforms}>
                <form onSubmit={uploadImage} /*action='/upload' enctype='multipart/form-data'*/  encType='multipart/form-data'>
                    <div className={styles.inputcontainers}>
                        <label>Name <span className={styles.errmsg}>*</span></label>
                        <input value={formData.name} onChange={handleChange}type='text' name='name' placeholder='Name'/>
                    </div>
                    <div className={styles.inputcontainers}>
                        <label>Surname<span className={styles.errmsg}>*</span></label>
                        <input value={formData.surname} onChange={handleChange}type='text' name='surname' placeholder='Surname'/>
                    </div>
                    <div className={styles.inputcontainers}>
                        <label>Password<span className={styles.errmsg}>*</span></label>
                        <input value={formData.password} onChange={handleChange}type='password' name='password'  placeholder='Password'/>
                    </div>
                    <div className={styles.inputcontainers}>
                        <label>Email<span className={styles.errmsg}>*</span></label>
                        <input value={formData.email} onChange={handleChange}type='email' name='email'  placeholder='Email'/>
                    </div>
                    <div className={styles.inputcontainers}>
                        <label>Phone <span className={styles.errmsg}>*</span></label>
                        <input value={formData.phone} onChange={handleChange} type='tel' name='phone' className={styles.formcontrol} placeholder='Phone Number'></input>
                    </div>
                    <div className={styles.inputcontainers}>
                        <label>Occupation <span className={styles.errmsg}>*</span></label>
                        <input value={formData.occupation} onChange={handleChange} type='text' name='occupation' className={styles.formcontrol} placeholder='Occupation'></input>
                    </div>
                    <div className={styles.inputcontainers}>
                      <label>Upload Image <span className={styles.errmsg}>*</span></label>
                        <input type='file' /*accept='image/*'*/ onChange={handleImageChange} name='images' />
                    </div>
                    <div className={styles.buttoncontainers}>
                        <button className={styles.buttons} >Register</button>      
                    </div>
                </form>
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