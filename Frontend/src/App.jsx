import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.scss";
import Home from "./components/Home";
import PatientInput from "./components/PatientInput";
import UserInput from "./components/RegistrationPage";
import Navbar from "./components/Navbar";
import Signin from './components/EpiCareHubLogin';
import Brain from "./components/Brain";

//function App() {
const App = () => {
  return (
    <Router>
      <header>
        <Navbar />
      </header>
      <main>
        <Routes>
          <Route path="/Signin" element={<Signin />} />
          <Route path="/register" element={<UserInput />} />
          {/*<Route path="/" element={<Signin />} />*/}
          <Route path="/home" element={<Home />} />
          <Route path="/brain" element={<Brain />} />
          <Route path="/pinput" element={<PatientInput />} />
          {/*<Route path="/register" element={<RegistrationPage />} />*/}
          {/*<Route path="/" element={<Home />} />
          <Route path="/pinput" element={<PatientInput />} />
          <Route path="/register" element={<RegistrationPage />} />*/}
        </Routes>
      </main>
      <footer></footer>
    </Router>
  );
};

export default App;
