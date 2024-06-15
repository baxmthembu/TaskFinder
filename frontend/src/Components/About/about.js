//import classes from './About.module.css'
import styles from './About.module.css'
import NavBar from  '../NavBar/navbar';
import DogWalker from '../Images/dogwalker'


const logo1 = require('../Images/logo.png')

const About = () => {
    return (
        <>
        <header className={styles.header}>
            <NavBar />
        </header>
            <div className={styles.body_container}>
            <div className={styles.About}>
                <h1>About</h1>
                <p>TaskFinder is an app that connects freelancers with customers requiring their services.<br /> As they are currently high number of skilled or unemployed people that can offer their services and time for different type of tasks.</p>
            </div>
            <div>
                <img src='https://cdn.vectorstock.com/i/1000x1000/01/77/professional-plumbers-vector-21580177.webp' alt='plumber image' className={styles.image1} /> 
            </div>
            <div id={styles.img2}>
                <img src='https://cdn.vectorstock.com/i/1000x1000/37/19/dog-walker-job-professional-dog-sitter-or-daycare-vector-47353719.webp' alt='person walking dog' className={styles.image2} />
            </div>
            <div>
                <img src='https://cdn.vectorstock.com/i/1000x1000/06/90/woman-cooking-concept-vector-47180690.webp' alt='cooking' className={styles.image3} />
            </div>
            </div>
        </>
    );
}

export default About