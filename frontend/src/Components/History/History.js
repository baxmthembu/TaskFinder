import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip'
import Axios from 'axios';
import './History.css';

const History = ({ userType, userId, isOpen, setIsOpen, isMobile = false }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            if (userId) {
                setIsLoading(true);
                try {
                    const response = await Axios.get(`${process.env.REACT_APP_API_URL}/history/${userType}/${userId}`);
                    setHistory(response.data);
                } catch (error) {
                    console.error('Error fetching history:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, userType, userId]);

    // Mobile-friendly button content
    const buttonContent = (
        <div className="flex items-center space-x-3">
            <ClockIcon className="h-6 w-6" />
            {!isMobile && <span className="font-medium">History</span>}
            {isMobile && <span className="font-medium">View Task History</span>}
        </div>
    );

    if (isMobile) {
        return (
            <div className="w-full">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg shadow-md transition-colors flex items-center justify-center text-sm font-medium border border-teal-200"
                    data-tooltip-id="history-tooltip"
                    data-tooltip-content="History"
                >
                    {buttonContent}
                </button>
                {isOpen && (
                    <div className="mt-3 w-full bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-800">Task History</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                                </div>
                            ) : history.length > 0 ? (
                                history.slice(0, 8).map((item, index) => (
                                    <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                                        <div className="flex items-start space-x-3">
                                            {userType === 'client' && item.freelancer_image && (
                                                <img
                                                    src={item.freelancer_image}
                                                    alt={item.freelancer_name}
                                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm leading-tight">{item.task_title}</p>
                                                {userType === 'client' && (
                                                    <p className="text-sm text-gray-600 mt-1 truncate">
                                                        <span className="font-medium">Freelancer:</span> {item.freelancer_name}
                                                    </p>
                                                )}
                                                {userType === 'freelancer' && (
                                                    <p className="text-sm text-gray-600 mt-1 truncate">
                                                        <span className="font-medium">Client:</span> {item.user_name}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mt-2">
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(item.date_finished).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        R{item.amount}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm font-medium">No history yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Your completed tasks will appear here</p>
                                </div>
                            )}
                        </div>
                        {history.length > 8 && (
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                                <p className="text-center text-xs text-gray-500">
                                    Showing latest 8 tasks
                                </p>
                            </div>
                        )}
                    </div>
                )}
                <Tooltip id="history-tooltip" />
            </div>
        );
    }

    // Desktop version (original)
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
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                            </div>
                        ) : history.length > 0 ? (
                            history.slice(0, 5).map((item, index) => (
                                <div key={index} className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50">
                                    <p className="font-bold text-gray-800">{item.task_title}</p>
                                    {userType === 'client' && (
                                        <div className="flex items-center mt-2">
                                            {item.freelancer_image && (
                                                <img src={item.freelancer_image} alt={item.freelancer_name} className="w-8 h-8 rounded-full mr-3 object-cover"/>
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