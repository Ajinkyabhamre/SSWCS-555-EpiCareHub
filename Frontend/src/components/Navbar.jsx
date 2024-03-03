import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-header">
          <NavLink activeClassName="active" className="navbar-brand" to="/" end>
            EpiCareHub
          </NavLink>
        </div>
        <ul className="navbar-nav">
          <li className="nav-item">
            <NavLink activeClassName="active" className="nav-link" to="/" end>
              Home
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
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
