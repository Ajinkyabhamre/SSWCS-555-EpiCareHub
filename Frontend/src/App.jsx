/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.scss";
import Home from "./components/Home";
import PatientInput from "./components/PatientInput";
import UserInput from "./components/RegistrationPage";
import Navbar from "./components/Navbar";
import Signin from "./components/EpiCareHubLogin";
import Brain from "./components/Brain";
import Patients from "./components/Patients";

const PrivateRoute = ({ component: Component, ...rest }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  return isLoggedIn ? <Component {...rest} /> : <Navigate to="/signin" />;
};

const App = () => {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("isLoggedIn"));

  useEffect(() => {
    const authStatus = localStorage.getItem("isLoggedIn");
    setIsAuth(authStatus);
  }, [localStorage.getItem("isLoggedIn")]);

  return (
    <Router>
      <header>
        <Navbar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<PrivateRoute component={Home} />} />
          <Route
            path="/patients"
            element={<PrivateRoute component={Patients} />}
          />
          <Route path="/brain" element={<PrivateRoute component={Brain} />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/register" element={<UserInput />} />
          <Route
            path="*"
            element={
              isAuth ? (
                <Navigate to="/" replace />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />
        </Routes>
      </main>
      <footer></footer>
    </Router>
  );
};

export default App;
