import { useState, useEffect, useCallback } from 'react';
import StarRating from '../StarRating/StarRating';
import Axios from 'axios';

const CommentsModal = ({ isOpen, onClose, freelancerId }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 5;

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            /*const response = await Axios.get(`http://localhost:3001/freelancers/${freelancerId}/comments`, {
                params: { page, limit }
            });*/
            const response = await Axios.get(`${process.env.REACT_APP_API_URL}/freelancers/${freelancerId}/comments`, {
                params: { page, limit }
            });
            setComments(response.data.comments);
            setTotal(response.data.total);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [freelancerId, page, limit]);

    useEffect(() => {
        if (isOpen && freelancerId) {
            fetchComments();
        }
    }, [isOpen, freelancerId, page, fetchComments]);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Feedback & Comments</h2>
                
                <div className="overflow-y-auto flex-grow pr-4">
                    {loading ? (
                        <div className="text-center p-8">
                            <p className="text-gray-600">Loading comments...</p>
                        </div>
                    ) : comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={index} className="border-b border-gray-200 py-4 last:border-b-0">
                                <div className="flex items-center mb-2">
                                    <p className="font-semibold text-gray-700 mr-2">{comment.user_name}</p>
                                    <StarRating rating={comment.rating} />
                                </div>
                                <p className="text-gray-600">{comment.comments}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center p-8 text-gray-500">No comments yet.</p>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 mt-auto">
                    {total > limit && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span>Page {page} of {Math.ceil(total / limit)}</span>
                            <button
                                onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
                                disabled={page * limit >= total}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 ml-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentsModal;