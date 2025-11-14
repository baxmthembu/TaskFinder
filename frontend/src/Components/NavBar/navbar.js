import classes from './NavBar.module.css';
import {Link, useResolvedPath, useMatch, useNavigate} from 'react-router-dom'
import { useAuth } from '../../provider/authProvider';

const logo1 = require("../Images/logo.png")

const NavBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div>
        <div className={classes.NavBar}>
        <div style={{position: 'absolute', left: '1em'}}>
        <img src={logo1}  />
        </div>
            <nav>
                <ul>
                    <li>
                        <Link to='/home'>Home</Link>
                    </li>
                    <CustomLink to="/about">About</CustomLink>
                    <CustomLink to="/task-status">Task Status</CustomLink>
                    <CustomLink to="/history">History</CustomLink>
                    {user ? (
                        <li>
                            <button onClick={handleLogout} className={classes.logoutButton}>Logout</button>
                        </li>
                    ) : (
                        <CustomLink to="/login">Login</CustomLink>
                    )}
                </ul>
            </nav>
        </div>
        </div>
    );
}

function CustomLink({to, children, ...props}) {
    const resolvedPath = useResolvedPath(to)
    const isActive = useMatch({path: resolvedPath.pathname, end:true})

    return (
        <li className={isActive ? "active" : ""}>
            <Link to={to} {...props}>{children}</Link>
        </li>
    )
}

export default NavBar