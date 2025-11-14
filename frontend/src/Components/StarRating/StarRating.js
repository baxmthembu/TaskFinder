
const StarRating = ({ rating }) => {
  const numericRating = typeof rating === 'number' ? rating : 0;
  const totalStars = 5;
  const fullStars = Math.floor(numericRating);
  const halfStar = numericRating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <svg key={`full-${i}`} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.45a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.37-2.45a1 1 0 00-1.175 0l-3.37 2.45c-.784.57-1.838-.197-1.539-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.094 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
      {halfStar && (
         <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.45a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118L10 13.347V2.221l-1.287 3.965a1 1 0 00-.95.69H3.593c-.969 0-1.371 1.24-.588 1.81l3.37 2.45a1 1 0 00.364 1.118l-1.287 3.965c-.3.921.755 1.688 1.54 1.118L9 15.653z" />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <svg key={`empty-${i}`} className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.37 2.45a1 1 0 00-.364 1.118l1.287 3.965c.3.921-.755 1.688-1.54 1.118l-3.37-2.45a1 1 0 00-1.175 0l-3.37 2.45c-.784.57-1.838-.197-1.539-1.118l1.287-3.965a1 1 0 00-.364-1.118L2.094 9.392c-.783-.57-.38-1.81.588-1.81h4.17a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

export default StarRating;