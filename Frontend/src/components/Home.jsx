import React from 'react';
import BrainImage from '../assets/brain.png'; // Importing the image

const Home = () => {
  return (
    <div>
      <h1>Welcome to the Presurgical Epilepsy Evaluation Platform!</h1>
      <p>This web application platform is designed to assist doctors in accurately locating epileptic seizure areas in epilepsy patients' brains.</p>
      <p>By utilizing advanced 3D visualization techniques, doctors can interact with reconstructed brain models, enabling them to pinpoint areas of abnormal brain activity associated with epilepsy.</p>
      <p>This visualization provides crucial reference points for pre-surgical assessment, aiding doctors in planning and executing surgeries with greater precision and effectiveness.</p>
      <img src={BrainImage} alt="3D Brain Image" style={{ width: '100%', maxWidth: '500px', margin: '20px auto' }} />
    </div>
  );
};

export default Home;