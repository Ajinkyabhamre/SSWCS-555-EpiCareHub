import { NavLink } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <NavLink activeClassName="active" className="navbar-brand" to="/" end>
          EpiCareHub
        </NavLink>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <NavLink activeClassName="active" className="nav-link" to="/" end>
              Home
            </NavLink>
            <NavLink
              activeClassName="active"
              className="nav-link"
              to="/pinput"
              end
            >
              PatientInput
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
