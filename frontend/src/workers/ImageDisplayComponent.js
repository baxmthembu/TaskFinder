import React from 'react';
import { Image, Transformation } from 'cloudinary-react';

const ImageDisplayComponent = ({ imageUrl }) => {
  return (
    <div>
      {/*<h2>Uploaded Image</h2>*/}
      {imageUrl && (
        <Image publicId={imageUrl}>
          <Transformation width="300" height="200" crop="fill" />
        </Image>
      )}
    </div>
  );
};

export default ImageDisplayComponent;
