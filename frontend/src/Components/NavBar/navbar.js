import classes from './NavBar.module.css';
import {Link, useResolvedPath, useMatch} from 'react-router-dom'

const logo1 = require("../Images/logo.png")

const NavBar = () => {
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
                    <CustomLink to="/profile">Profile</CustomLink>
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