import React, { useState, useEffect } from 'react';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip'
import PayPal from '../Paypal/paypal';
import RatingModal from '../RatingModal/RatingModal';

const TaskStatus = ({
    tasks,
    userType,
    onFinishTask,
    onPay,
    newTasksCount,
    onViewTasks,
}) => {
    const [timers, setTimers] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [showPayPal, setShowPayPal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
    const [taskToRate, setTaskToRate] = useState(null);


    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (onViewTasks) {
            onViewTasks();
        }
    };

    const handlePay = (task) => {
        setSelectedTask(task);
        setShowPayPal(true);
    };

  const handlePaymentSuccess = (paymentDetails) => {
    console.log('Payment successful:', paymentDetails);
    onPay(selectedTask);
    setShowPayPal(false);
    setTaskToRate(selectedTask);
    setIsRatingModalOpen(true);
  };

  const handlePaymentCancel = () => {
    setShowPayPal(false);
    setSelectedTask(null);
  };

  const handleRatingSubmit = async (taskId, { rating, comments }) => {
    try {
        /*const response = await fetch(`http://localhost:3001/tasks/${taskId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating, comments }),
            credentials: 'include'
        });*/
        const response = await fetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/rate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ rating, comments }),
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            console.log('Rating submitted successfully!');
        } else {
            console.error('Failed to submit rating:', data.msg);
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
    }

    setIsRatingModalOpen(false);
    setTaskToRate(null);
    setSelectedTask(null);
  };

  const handleCloseRatingModal = () => {
    setIsRatingModalOpen(false);
    setTaskToRate(null);
    setSelectedTask(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        const newTimers = { ...prevTimers };
        tasks.forEach((task) => {
          if (task.status === 'in_progress') {
            newTimers[task.id] = (newTimers[task.id] || 0) + 1;
          }
        });
        return newTimers;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="relative">
        <button
            onClick={handleToggle}
            className="relative px-4 py-2 bg-transparent text-teal-700 rounded-md hover:bg-gray-100 transition-colors"
            data-tooltip-id="task-status-tooltip"
            data-tooltip-content="Task Status"
        >
            <ClipboardDocumentCheckIcon className="h-6 w-6" />
            <span className="sr-only">Task Status</span>
            {newTasksCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {newTasksCount}
                </span>
            )}
        </button>
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white shadow-lg rounded-lg w-80 z-20">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Task Status</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {tasks.length > 0 ? (
                    tasks.slice(0, 5).map((task, index) => (
                        <div key={index} className="px-4 py-3 border-b last:border-b-0">
                            <p className="font-bold text-gray-800">{task.description}</p>
                            <p className="text-sm text-gray-600"><strong>Client:</strong> {task.clientName}</p>
                            {userType === 'freelancer' && task.status === 'in_progress' && (
                                <div className="mt-2">
                                    <p className="text-sm"><strong>Timer:</strong> {formatTime(timers[task.id] || 0)}</p>
                                    <button className="bg-red-500 text-white rounded-md px-3 py-1 mt-2 text-sm" onClick={() => onFinishTask(task.id)}>Finish Task</button>
                                </div>
                            )}
                            {task.status === 'finished' && (
                                <div className="flex items-center mt-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                    <p className="text-sm font-semibold text-green-700">Finished</p>
                                    {userType === 'client' && (
                                        <button className="bg-green-500 text-white rounded-md px-3 py-1 ml-auto text-sm" onClick={() => handlePay(task)}>Pay</button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-center py-6 text-gray-500">No tasks accepted yet.</p>
                )}
                {tasks.length > 5 && (
                    <div className="px-4 py-2 text-center text-sm text-gray-500">
                        Scroll to see more
                    </div>
                )}
            </div>
        </div>
      )}
      {showPayPal && selectedTask && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handlePaymentCancel}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-gray-800">Complete Payment</h2>
              <button onClick={handlePaymentCancel} className="text-gray-500 hover:text-gray-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">You are about to pay for the following task:</p>
              <p className="font-bold text-lg text-gray-800 my-2">{selectedTask.description}</p>
              <p className="text-2xl font-bold text-center text-gray-900 my-4">R{selectedTask.amount}</p>
              <PayPal
                amount={selectedTask.amount}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentCancel={handlePaymentCancel}
              />
            </div>
          </div>
        </div>
      )}
       {taskToRate && (
        <RatingModal
            isOpen={isRatingModalOpen}
            onClose={handleCloseRatingModal}
            onSubmit={handleRatingSubmit}
            task={taskToRate}
        />
      )}
      <Tooltip id="task-status-tooltip" />
    </div>
  );
};

export default TaskStatus;