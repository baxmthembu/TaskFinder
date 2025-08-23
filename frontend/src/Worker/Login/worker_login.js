import React, {useState, useContext} from "react";
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { toast, Bounce } from "react-toastify";
import ReCAPTCHA from 'react-google-recaptcha';
import Axios from 'axios';
import styles from '../../Components/Login/login.module.css';
import { Spinner } from 'react-bootstrap';
import { Link, useNavigate } from "react-router-dom";
//import { WorkerContext } from "../FreelancerContext";
import { useAuth } from "../../provider/AuthProvider.js";
import { UserContext } from "../../UserContext.js";
import logo from "../../Components/Images/taskaroo.svg"


const WorkerLogin = () => {
    //const [workerId, setWorkerId] = useState('')
    //const {setWorker} = useContext(WorkerContext)
    const { setUser } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const {setToken} = useAuth()
    const [captchaValue, setCaptchaValue] = useState('');

    const [formData, setFormData]= useState({
        name: '',
        password:'',
      })

    const navigate = useNavigate()

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
    

    const Login = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        
        try {
            if(validate()){
                const response = await Axios.post('http://localhost:3001/workerlogin', formData);
                //const response = await Axios.post(`${process.env.REACT_APP_API_URL}/workerlogin`, formData);
                if (response.data.msg === 'Authentication Successful') {
                  // Set user in context                 
                  //Assuming response.data.user contains the user details
                    console.log('User logged in:', response.data.user.name);  // Log user info
                    const workerId = response.data.user.id
                    const workerToken = response.data.user.token
                    const workerRole = response.data.user.role
                    localStorage.setItem('role', workerRole)
                    localStorage.setItem('id', workerId)
                    setUser({id:workerId, role:workerRole})
                    localStorage.setItem('token', workerToken)
                    setToken(workerToken)
                    toast.success(`Welcome ${response.data.user.name}`, {
                      position: toast.POSITION.TOP_CENTER
                    });
                    setTimeout(() => {
                      navigate('/freelancerhome', { replace: true });
                    }, 100);
                    console.log('logged in')
                    console.log(response.status)
                }else{
                    console.error('Failed')
                    toast.error("Error logging in", {
                      position: toast.POSITION.TOP_RIGHT,
                    })
                }
            }
        } catch (error) {
            console.error('Login error:', error);
        } finally{
          setIsLoading(false)
        }
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({...formData, [name]: value});
      }

    const handleCaptchaChange = (value) => {
        setCaptchaValue(value);
    }
    
    const logo3 = require('../../Components/Images/Taskify.png')
    
    return (
        <div className={styles.app}>
          <header className={styles.header}>
          <div className={styles.back_button}>
            <Link to="/">
              <button className={styles.button28}>Back</button>
           </Link>
          </div>
          <div className={styles.logo}>
            <img src={logo} alt="Logo" />
          </div>
          </header>
        <div className={styles.loginform}>
          <h1>Sign in</h1>
        <form onSubmit={Login}>
          <div className={styles.inputcontainer}>
            <label>Name<span className={styles.errmsg}>*</span> </label>
            <input type="text" value={formData.name}  onChange={handleChange} name='name' />
            {/*{errors.name && <span className="text-danger">{errors.name}</span>}*/}
          </div>
          <div className={styles.inputcontainer}>
            <label>Password<span className={styles.errmsg}>*</span></label>
            <input type="password" value={formData.password} onChange={handleChange} name='password'  />
            {/*{errors.password && <span className='text-danger'>{errors.password}</span>}*/}
          </div>
          <ReCAPTCHA
            sitekey="6Lc3CKYnAAAAAHjblBln1V7QStAE_H6kD5tYuMPl"
            onChange={handleCaptchaChange} />
          <div className={styles.buttoncontainer}>
            <button type="submit" className={`submit ${captchaValue ? 'enabled' : 'disabled'}`}
              disabled={!captchaValue || isLoading} style={{borderRadius:'5px'}} id={styles.buttons}>
                {isLoading ? (
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                'Login'
            )}</button>
          </div>
          <div className={styles.createaccount}>
            <p>or<Link to="/workerRegister" className={styles.text}>create account</Link></p>
          </div>
          <div>
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

export default WorkerLogin
