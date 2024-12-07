import styles from './About.module.css'
import NavBar from  '../NavBar/navbar';
import DogWalker from '../Images/dogwalker'
import Nav from '../Nav/nav';
import Sidebar from '../SideBar/sidebar';


const logo1 = require('../Images/Taskify.png')
const cooking = require('../Images/cooking_1830839.png')
const grass = require('../Images/grass_5617791.png')
const plumber = require('../Images/plumber-man_5054602.png')
const queue = require('../Images/queue.png')

const About = () => {
    return (
        <>
        <header className={styles.header}>
            <Sidebar />
            <div className='image' style={{ textAlign: 'right', position: "relative", top: "-11em", left: "-1px",  }}>
                <img src={logo1} />
            </div>
        </header>
            <div className={styles.body_container}>
            <div className={styles.About}>
                <h1>About</h1>
                <p>
                Our app bridges the gap between clients and freelancers, offering a seamless platform for connecting people with professionals across a wide range of tasks.<br /> Whether you need help with basic household chores, daily errands, or specialized services like cooking, accounting, and more, our app provides an easy and efficient way to find the right freelancer for your needs. By bringing together skilled individuals and those seeking assistance, we ensure that every task, big or small, is handled with expertise and care.
                </p>
            </div>
            <div className={styles.card_container}>
            <div className={styles.card}>
                <div className={styles.cards_inner}>
                    <img src={cooking} alt="Avatar" style={{width:'50%'}} />
                    <div className={styles.container}>
                        <div className={styles.name}><h3><b>Private Chef</b></h3></div>
                    </div>
                </div>
                <div className={styles.cards_inner}>
                    <img src={grass} alt="Avatar" style={{width:'50%'}} />
                    <div className={styles.container}>
                        <div className={styles.name}><h3><b>Mowing lawn</b></h3></div>
                    </div>
                </div>
                <div className={styles.cards_inner}>
                    <img src={plumber} alt="Avatar" style={{width:'50%'}} />
                    <div className={styles.container}>
                        <div className={styles.name}><h3><b>Plumber</b></h3></div>
                    </div>
                </div>
                <div className={styles.cards_inner}>
                    <img src={queue} alt="Avatar" style={{width:'50%'}} />
                    <div className={styles.container}>
                        <div className={styles.name}><h3><b>Queuing</b></h3></div>
                    </div>
                </div>
            </div>
            </div>
            </div>
        </>
    );
}

export default About