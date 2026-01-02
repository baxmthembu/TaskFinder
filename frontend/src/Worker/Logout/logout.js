// Logout.js
import { useAuth } from '../../provider/authProvider';
import { useNavigate } from 'react-router-dom';
import './logout.css';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'
import { Tooltip } from 'react-tooltip'

const Logout = ({ isMobile = false }) => {
    const { logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            localStorage.clear();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            localStorage.clear();
            navigate('/');
        }
    };

    // Mobile-friendly logout content
    const logoutContent = (
        <div className="flex items-center space-x-3">
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            {!isMobile && <span>Logout</span>}
            {isMobile && <span className="font-medium">Sign Out</span>}
        </div>
    );

    if (isMobile) {
        return (
            <div className="w-full">
                <button 
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg shadow-md transition-colors flex items-center justify-center text-sm font-medium border border-red-200"
                    data-tooltip-id="logout-tooltip"
                    data-tooltip-content="Logout"
                >
                    {logoutContent}
                </button>
                <Tooltip id="logout-tooltip" />
            </div>
        );
    }

    // Desktop version (original)
    return (
      <div className="">
        <button 
            onClick={handleLogout}
            className="relative px-4 py-2 bg-transparent text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
            data-tooltip-id="logout-tooltip"
            data-tooltip-content="Logout"
        >
            <div className="flex items-center space-x-2">
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </div>
        </button>
        <Tooltip id="logout-tooltip" />
    </div>
    );
};


export default Logout;
