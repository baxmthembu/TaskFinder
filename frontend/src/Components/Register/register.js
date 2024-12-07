import React, { useEffect, useState } from 'react';
import {useNavigate, Link} from 'react-router-dom'
import styles from './register.module.css';
import {toast} from 'react-toastify';
import Axios from 'axios';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        password: '',
        email: '',
        phone: '',
        username: '',
    });

    const [userLocation, setUserLocation] = useState(null)
    const [nearbyWorkers, setNearbyWorkers] = useState([]);


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
                const response = await Axios.post('http://localhost:3001/register', {...formData, ...location});

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
  

    const logo1 = require('../Images/Taskify.png');

    return (
        <div className={styles.app}>
          <div className={styles.back_button}>
            <Link to="/login">
              <button className={styles.button28}>Back</button>
           </Link>
          </div>
            <div className={styles.logo}>
                <img src={logo1} />
            </div>
            <div className={styles.login}>
              {/*<div className={styles.back}>
                <Link to="/login" className={styles.back}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className={styles.icon}><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
                </Link>
              </div>*/}
                <form onSubmit={handleSubmit}>

                    <div className={styles.container}>
                        <label>Name<span className={styles.error}>*</span></label>
                        <input value={formData.name} onChange={handleChange}type='text' name='name' placeholder='Name' />
                    </div>

                    <div className={styles.container}>
                        <label>Surname<span className={styles.error}>*</span></label>
                        <input value={formData.surname} onChange={handleChange}type='text' name='surname' placeholder='Surname' />
                    </div>

                    <div className={styles.container}>
                        <label>Password<span className={styles.error}>*</span></label>
                        <input value={formData.password} onChange={handleChange}type='password' name='password' placeholder='Password'  />
                    </div>

                    <div className={styles.container}>
                        <label>Email<span className={styles.error}>*</span></label>
                        <input value={formData.email} onChange={handleChange}type='email' name='email' placeholder='Email'  />
                    </div>

                    <div className={styles.container}>
                        <label>Phone <span className={styles.error}>*</span></label>
                        <input value={formData.phone} onChange={handleChange} type='tel' name='phone' className="form-control" placeholder='Phone Number'></input>
                    </div>

                    <div className={styles.container}>
                        <label>UserName <span className={styles.error}>*</span></label>
                        <input value={formData.username} onChange={handleChange} type='text' name='username' placeholder='Username' />
                    </div>

                    <div className={styles.buttoncontainer}>
                        <button type="submit" className={styles.buttons}>Register</button>     
                    </div>
                </form>
            </div>
        </div>
    )
}

  

export default Register