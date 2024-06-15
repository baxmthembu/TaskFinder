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
  const {setUser} = useContext(UserContext)
  const [username, usernameupdate] = useState('');
  const [password, passwordupdate] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);


  const usenavigate=useNavigate();

  const [formData, setFormData]= useState({
    username: '',
    password:'',
  })

  const ProceedLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
  
      try {
        if(validate()) {
          const response = await Axios.post('http://localhost:3001/login', formData);

          if (response.data.msg === 200) {
            // Authentication successful, navigate to the home page
            console.log('Authentication Successful', response.data.user);
            setUser(response.data.user)
            toast.success('Welcome', {
              position: toast.POSITION.TOP_CENTER
            })  
            usenavigate('/workerhome')
            // Redirect to the home page using React Router or window.location
          } else {
            // Authentication failed, handle the error
            console.error('Authentication failed');
            toast.error('Log In Error', {
              position: toast.POSITION.TOP_CENTER
            })
          }
        }
      }catch(error){
        console.log('Error: ' + error)
    }finally{
      setIsLoading(false)
    }
  }
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
  }

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  }

  const logo3 = require('../Images/logos.png')


return (
  <div className={styles.app}>
    <div className={styles.logo}>
      <img src= {logo3} />
    </div>
    <div className={styles.loginform}>
    <form onSubmit={ProceedLogin}>
      <div className={styles.inputcontainer}>
        <label>Username<span className={styles.errmsg}>*</span> </label>
        <input type="text" value={formData.username}  onChange={/*e => usernameupdate(e.target.value)*/ handleChange} name='username' />
        {/*{errors.name && <span className="text-danger">{errors.name}</span>}*/}
      </div>
      <div className={styles.inputcontainer}>
        <label>Password<span className={styles.errmsg}>*</span></label>
        <input type="password" value={formData.password} onChange={/*e => passwordupdate(e.target.value)*/ handleChange} name='password'  />
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
        <Link to="/register" className={styles.text}>create account</Link>
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
}

export default Login