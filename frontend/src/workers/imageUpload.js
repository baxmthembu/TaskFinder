import React from 'react';
import { useLocation } from 'react-router-dom';

const ImagePage = (props) => {
  const location = useLocation();
  console.log('Location:', location);  // Log the location object

  const searchParams = new URLSearchParams(location.search);
  const publicId = searchParams.get('publicId');
  console.log('Public ID:', publicId);  // Log the extracted public ID

  if (!publicId) {
    console.log('Invalid URL: No publicId parameter found')
  }

  const imageUrl = `https://res.cloudinary.com/dq9ostdw1/image/upload/${publicId}`;
  console.log('Image URL:', imageUrl);  // Log the constructed image URL


  return (
    <>
    <div>
      <img src={imageUrl} alt="Image" />
    </div>
    </>
  );
};

export default ImagePage;