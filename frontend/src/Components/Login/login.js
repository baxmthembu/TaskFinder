import { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Bounce } from "react-toastify";
import styles from '../Login/login.module.css';
import ReCAPTCHA from 'react-google-recaptcha';
import Axios from 'axios';
import { Spinner } from 'react-bootstrap';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserContext } from "../../UserContext";

const Login = () => {
  const { setUser } = useContext(UserContext);
  const [captchaValue, setCaptchaValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState({ latitude: null, longitude: null });
  const [formData, setFormData] = useState({
    username: '',
    password:'',
  });

  const usenavigate = useNavigate();

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
        const response = await Axios.post('http://localhost:3001/login', { ...formData, ...location });

        if (response.data.msg === "Authentication Successful") {
          // Determine user role (example: check a flag or field)
          const userRole = response.data.user.isFreelancer ? 'freelancer' : 'client';

          // Set user in context
          const user = {
            ...response.data.user,
            role: userRole
          };
          setUser(user);
          console.log(user.role)

          localStorage.setItem('userId', response.data.user.id); // Adjust to match role-based IDs
          toast.success(`Welcome ${response.data.user.name}`, {
            position: toast.POSITION.TOP_CENTER
          });
          usenavigate('/home');
        } else {
          console.error('Authentication failed');
          toast.error('Log In Error', {
            position: toast.POSITION.TOP_CENTER
          });
        }
      }
    } catch (error) {
      console.log('Error: ' + error);
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

  const logo3 = require('../Images/logos.png');

  return (
    <div className={styles.app}>
      <div className={styles.logo}>
        <img src={logo3} alt="Logo" />
      </div>
      <div className={styles.loginform}>
        <form onSubmit={ProceedLogin}>
          <div className={styles.inputcontainer}>
            <label>Username<span className={styles.errmsg}>*</span> </label>
            <input type="text" value={formData.username} onChange={handleChange} name='username' />
          </div>
          <div className={styles.inputcontainer}>
            <label>Password<span className={styles.errmsg}>*</span></label>
            <input type="password" value={formData.password} onChange={handleChange} name='password' />
          </div>
          <ReCAPTCHA
            sitekey="6Lc3CKYnAAAAAHjblBln1V7QStAE_H6kD5tYuMPl"
            onChange={handleCaptchaChange}
          />
          <div className={styles.buttoncontainer}>
            <button type="submit" className={`submit ${captchaValue ? 'enabled' : 'disabled'}`}
              disabled={!captchaValue || isLoading} style={{ borderRadius: '5px' }} id={styles.buttons}>
              {isLoading ? (
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
              ) : (
                'Login'
              )}
            </button>
          </div>
          <div className={styles.createaccount}>
            <Link to="/register" className={styles.text}>Create account</Link>
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
  );
};

export default Login