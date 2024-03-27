import React from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import "../assets/CSS/home.css"; // Add any custom CSS styles here
import "bootstrap/dist/css/bootstrap.min.css";

const Home = () => {
  return (
    <>
      {/* Main content */}
      <Container fluid className="main-content">
        <div>
          <Row>
            {/* Text content */}
            <Col md={6} className="align-self-center">
              <h1 className="main-title">
                Welcome to the Presurgical Epilepsy Evaluation Platform!
              </h1>
              <h3 className="main-sub-title">
                This web application platform is designed to assist doctors in
                accurately locating epileptic seizure areas in epilepsy
                patients' brains
              </h3>
              <p>
                By utilizing advanced 3D visualization techniques, doctors can
                interact with reconstructed brain models, enabling them to
                pinpoint areas of abnormal brain activity associated with
                epilepsy.
              </p>
            </Col>

            {/* Image */}
            <Col md={6} className="text-center">
              <img
                src="./public/assets/homePhoto.svg"
                alt="home"
                className="img-fluid"
              />
            </Col>
          </Row>
          {/* Footer */}
        </div>
        <footer className="footer">
          <Container>
            <p>
              Icons made by{" "}
              <a href="https://storyset.com/people">
                People illustrations by Storyset
              </a>
            </p>
            <p>© 2024 EpicareHub. All rights reserved.</p>
          </Container>
        </footer>
      </Container>
    </>
  );
};

export default Home;
