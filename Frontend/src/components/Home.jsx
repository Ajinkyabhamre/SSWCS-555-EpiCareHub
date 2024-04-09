import React from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      {/* Main content */}
      <div className="flex flex-col h-screen">
        <div className="flex-grow bg-gray-100">
          <div className="container mx-auto py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Text content */}
              <div className="flex flex-col justify-center">
                <h1 className="text-4xl font-bold mb-4">
                  Welcome to the Presurgical Epilepsy Evaluation Platform!
                </h1>
                <h3 className="text-lg mb-4">
                  This web application platform is designed to assist doctors in
                  accurately locating epileptic seizure areas in epilepsy
                  patients' brains
                </h3>
                <p className="text-gray-700">
                  By utilizing advanced 3D visualization techniques, doctors can
                  interact with reconstructed brain models, enabling them to
                  pinpoint areas of abnormal brain activity associated with
                  epilepsy.
                </p>
              </div>

              {/* Image */}
              <div className="flex justify-center">
                <img
                  src="./public/assets/homePhoto.svg"
                  alt="home"
                  className="w-full md:w-auto max-h-96"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-4">
          <div className="container mx-auto">
            <p className="text-center">
              Icons made by{" "}
              <a href="https://storyset.com/people" className="underline">
                People illustrations by Storyset
              </a>
            </p>
            <p className="text-center">
              &copy; 2024 EpicareHub. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
