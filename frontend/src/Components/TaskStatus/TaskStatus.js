import React, { useState, useEffect } from 'react';
import PayPal from '../Paypal/paypal';

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
    setSelectedTask(null);
  };

  const handlePaymentCancel = () => {
    setShowPayPal(false);
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
            className="bg-blue-500 text-white rounded-md px-4 py-2 relative"
        >
            Task Status
            {newTasksCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {newTasksCount}
                </span>
            )}
        </button>
      {isOpen && (
        <div className="absolute top-12 left-0 bg-white shadow-md rounded-md p-4 w-64 z-1">
          <h3 className="text-lg font-semibold mb-2">Task Status</h3>
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div key={index} className="border-b last:border-b-0 py-2">
                <p className="font-bold">{task.description}</p>
                <p><strong>Client:</strong> {task.clientName}</p>
                {userType === 'freelancer' && task.status === 'in_progress' && (
                  <div>
                    <p><strong>Timer:</strong> {formatTime(timers[task.id] || 0)}</p>
                    <button className="bg-red-500 text-white rounded-md px-2 py-1 mt-1" onClick={() => onFinishTask(task.id)}>Finish Task</button>
                  </div>
                )}
                {task.status === 'finished' ? (
                    <div className="flex items-center">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                        <p>Finished</p>
                        {userType === 'client' && (
                            <button className="bg-green-500 text-white rounded-md px-2 py-1 ml-4" onClick={() => handlePay(task)}>Pay</button>
                        )}
                    </div>
                ) : null}
              </div>
            ))
          ) : (
            <p>No tasks accepted yet.</p>
          )}
        </div>
      )}
      {showPayPal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
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
    </div>
  );
};

export default TaskStatus;