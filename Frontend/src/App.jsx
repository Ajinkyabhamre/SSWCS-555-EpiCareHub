import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import "./App.scss";
import Home from "./components/Home";
import UserInput from "./components/RegistrationPage";
import Navbar from "./components/Navbar";
import Signin from "./components/EpiCareHubLogin";
import Brain from "./components/Brain";
import Patients from "./components/Patients";
import PatientDetails from "./components/PatientDetails";
import Dashboard from "./components/Dashboard";
import AdminPage from "./components/AdminPage";
import RequireAuth from "./routes/RequireAuth";
import PublicOnly from "./routes/PublicOnly";

// Redirect component for legacy brain routes
const BrainRedirect = () => {
  const { patientId } = useParams();
  return <Navigate to={`/patient/${patientId}`} replace />;
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
          {/* Public pages - accessible to all */}
          <Route path="/" element={<Home />} />

          {/* Public-only pages - redirects to dashboard if logged in */}
          <Route
            path="/signin"
            element={
              <PublicOnly>
                <Signin />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <UserInput />
              </PublicOnly>
            }
          />

          {/* Protected pages - require authentication */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/patients"
            element={
              <RequireAuth>
                <Patients />
              </RequireAuth>
            }
          />
          <Route
            path="/patient/:id"
            element={
              <RequireAuth>
                <PatientDetails />
              </RequireAuth>
            }
          />
          {/* Legacy brain routes - redirect to patient details */}
          <Route
            path="/patient/:patientId/brain/:uploadId"
            element={
              <RequireAuth>
                <BrainRedirect />
              </RequireAuth>
            }
          />
          <Route
            path="/brain"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="/about"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />

          {/* Fallback - redirect based on auth state */}
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
