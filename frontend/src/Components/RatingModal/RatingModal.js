import { useState } from 'react';

const RatingModal = ({ isOpen, onClose, onSubmit, task }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit(task.task_id, { rating, comments });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Rate Your Experience</h2>
        <p className="text-center mb-4">Task: <span className="font-semibold">{task.description}</span></p>

        <div className="flex justify-center my-4">
          {[...Array(5)].map((/*star,*/ index) => {
            const ratingValue = index + 1;
            return (
              <label key={index}>
                <input
                  type="radio"
                  name="rating"
                  value={ratingValue}
                  onClick={() => setRating(ratingValue)}
                  className="hidden"
                />
                <svg
                  className="w-10 h-10 cursor-pointer"
                  onMouseEnter={() => setHover(ratingValue)}
                  onMouseLeave={() => setHover(0)}
                  fill={ratingValue <= (hover || rating) ? '#FFC107' : '#E4E5E9'}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </label>
            );
          })}
        </div>
        
        <textarea
          className="w-full p-2 border rounded-md mb-4"
          rows="4"
          placeholder="Add your comments... (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        ></textarea>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={!rating}
            className={`font-bold py-2 px-4 rounded-lg ${
              !rating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;