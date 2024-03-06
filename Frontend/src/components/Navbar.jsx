import { NavLink, useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("isLoggedIn"));
  const isLogin = localStorage.getItem("isLoggedIn");
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuth(localStorage.getItem("isLoggedIn"));
  }, [isLogin]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/signin");
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-header">
          {isAuth ? (
            <NavLink
              activeClassName="active"
              className="navbar-brand"
              to="/"
              end
            >
              EpiCareHub
            </NavLink>
          ) : (
            <NavLink
              activeClassName="active"
              className="navbar-brand"
              to="/"
              end
            >
              EpiCareHub
            </NavLink>
          )}
        </div>
        <ul className="navbar-nav">
          {isAuth && (
            <>
              <li className="nav-item">
                <NavLink
                  activeClassName="active"
                  className="nav-link"
                  to="/brain"
                  end
                >
                  Brain
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  activeClassName="active"
                  className="nav-link"
                  to="/pinput"
                  end
                >
                  Patient Input
                </NavLink>
              </li>
            </>
          )}

          {!isAuth && (
            <li className="nav-item">
              <NavLink
                activeClassName="active"
                className="nav-link"
                to="/signin"
                end
              >
                Login
              </NavLink>
            </li>
          )}

          {!isAuth && (
            <li className="nav-item">
              <NavLink
                activeClassName="active"
                className="nav-link"
                to="/register"
                end
              >
                Register
              </NavLink>
            </li>
          )}
          {isAuth && (
            <li className="nav-item">
              <button onClick={handleLogout}>
                <LogoutIcon />
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
