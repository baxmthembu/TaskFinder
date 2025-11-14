import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip'
import Axios from 'axios';
import './History.css';

const History = ({ userType, userId, isOpen, setIsOpen }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            if (userId) {
                try {
                    //const response = await Axios.get(`http://localhost:3001/history/${userType}/${userId}`);
                    const response = await Axios.get(`${process.env.REACT_APP_API_URL}/history/${userType}/${userId}`);
                    setHistory(response.data);
                } catch (error) {
                    console.error('Error fetching history:', error);
                }
            }
        };

        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, userType, userId]);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative px-4 py-2 bg-transparent text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                data-tooltip-id="history-tooltip"
                data-tooltip-content="History"
            >
                <ClockIcon className="h-6 w-6" />
                <span className="sr-only">History</span>
            </button>
            {isOpen && (
                <div className="absolute top-12 right-0 bg-white shadow-lg rounded-lg w-80 z-50">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Task History</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {history.length > 0 ? (
                            history.slice(0, 5).map((item, index) => (
                                <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                                    <p className="font-bold text-gray-800">{item.task_title}</p>
                                    {userType === 'client' && (
                                        <div className="flex items-center mt-2">
                                            {item.freelancer_image && (
                                                <img src={`http://localhost:3001/images/${item.freelancer_image}`} alt={item.freelancer_name} className="w-8 h-8 rounded-full mr-3 object-cover"/>
                                            )}
                                            <p className="text-sm text-gray-600"><strong>Freelancer:</strong> {item.freelancer_name}</p>
                                        </div>
                                    )}
                                    {userType === 'freelancer' && <p className="text-sm text-gray-600 mt-2"><strong>Client:</strong> {item.user_name}</p>}
                                    <p className="text-sm text-gray-600 mt-1"><strong>Date:</strong> {new Date(item.date_finished).toLocaleDateString()}</p>
                                    <p className="text-sm font-semibold text-gray-700"><strong>Amount:</strong> R{item.amount}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-center py-6 text-gray-500">No history yet.</p>
                        )}
                        {history.length > 5 && (
                            <div className="px-4 py-2 text-center text-sm text-gray-500">
                                Scroll for more
                            </div>
                        )}
                    </div>
                </div>
            )}
            <Tooltip id="history-tooltip" />
        </div>
    );
};

export default History;