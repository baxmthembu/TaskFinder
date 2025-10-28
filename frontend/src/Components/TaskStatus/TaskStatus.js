import React, { useState, useEffect } from 'react';
import PayPal from '../Paypal/paypal';

const TaskStatus = ({ tasks, userType, onFinishTask, onPay }) => {
  const [timers, setTimers] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-blue-500 text-white rounded-md px-4 py-2"
      >
        Task Status
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
          <div className="bg-white p-4 rounded-md">
            <PayPal
              amount={selectedTask.amount}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskStatus;