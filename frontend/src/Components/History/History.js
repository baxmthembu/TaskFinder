import React, { useState, useEffect } from 'react';
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
                    const response = await Axios.get(`http://localhost:3001/history/${userType}/${userId}`);
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
                className="bg-transparent text-gray-600 hover:bg-gray-100 rounded-md px-4 py-2 transition-colors"
                data-tooltip-id="history-tooltip"
                data-tooltip-content="History"
            >
                <ClockIcon className="h-6 w-6" />
                <span className="sr-only">History</span>
            </button>
            {isOpen && (
                <div className="absolute top-12 right-0 bg-white shadow-md rounded-md p-4 w-64 z-50">
                    <h3 className="text-lg font-semibold mb-2">Task History</h3>
                    {history.length > 0 ? (
                        history.map((item, index) => (
                            <div key={index} className="border-b last:border-b-0 py-2">
                                <p className="font-bold">{item.task_title}</p>
                                {userType === 'client' && <p><strong>Freelancer:</strong> {item.freelancer_name}</p>}
                                {userType === 'freelancer' && <p><strong>Client:</strong> {item.user_name}</p>}
                                <p><strong>Date:</strong> {new Date(item.date_finished).toLocaleDateString()}</p>
                                <p><strong>Amount:</strong> R{item.amount}</p>
                            </div>
                        ))
                    ) : (
                        <p>No history yet.</p>
                    )}
                </div>
            )}
            <Tooltip id="history-tooltip" />
        </div>
    );
};

export default History;