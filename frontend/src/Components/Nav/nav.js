import react, {useState} from 'react'
import './nav.css'
import WorkerLogout from '../../Worker/Worker_Logout/workerlogout';
import { Link } from 'react-router-dom';

const Nav = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
      };
    
    return (
        <div>
            <nav className='nav'>
                <div className="burger-menu" onClick={toggleMenu}>
                    ☰
                </div>
            <ul className={menuOpen ? "nav-list show" : "nav-list"}>
                <li className='li'><Link to='/home'>Home</Link></li>
                <li className='li'><a href="news.asp">News</a></li>
                <li className='li'><Link to='/profile'>Profile</Link></li>
                <li className='li'><Link to='/about'>About</Link></li>
                <li className='li'><WorkerLogout /></li>
            </ul>
            
            </nav>
        </div>
    )

}

export default Nav