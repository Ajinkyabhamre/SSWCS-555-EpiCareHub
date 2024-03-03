import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.scss";
import Home from "./components/Home";
import PatientInput from "./components/PatientInput";
import Navbar from "./components/Navbar";

function App() {
  return (
    <Router>
      <header>
        <Navbar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pinput" element={<PatientInput />} />
        </Routes>
      </main>
      <footer></footer>
    </Router>
  );
}

export default App;
