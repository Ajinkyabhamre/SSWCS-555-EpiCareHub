import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import "./App.scss";
import Home from "./components/Home";
import UserInput from "./components/RegistrationPage";
import Navbar from "./components/Navbar";
import Signin from "./components/EpiCareHubLogin";
import Brain from "./components/Brain";
import Patients from "./components/Patients";
import PatientDetails from "./components/PatientDetails";
import RegistrationPage from "./components/RegistrationPage";
import Dashboard from "./components/Dashboard";

import AdminPage from "./components/AdminPage";

const PrivateRoute = ({ component: Component, ...rest }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  return isLoggedIn ? <Component {...rest} /> : <Navigate to="/signin" />;
};

const App = () => {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("isLoggedIn"));

  useEffect(() => {
    const authStatus = localStorage.getItem("isLoggedIn");
    setIsAuth(authStatus);
  }, []);

  return (
    <Router>
      <header>
        <Navbar />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/patients"
            element={<PrivateRoute component={Patients} />}
          />
          <Route
            path="/patient/:id"
            element={<PrivateRoute component={PatientDetails} />}
          />
          <Route path="/about" element={<PrivateRoute component={Home} />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute component={Dashboard} />}
          />
          <Route path="/brain" element={<PrivateRoute component={Brain} />} />
          <Route path="/signin" element={<Signin />} />
          <Route path="/register" element={<UserInput />} />
          <Route
            path="/admin"
            element={<PrivateRoute component={AdminPage} />}
          />
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
