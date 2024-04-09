import { Link, useNavigate, useLocation } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState, useEffect } from "react";
import brain from "/brain.png";
import InfoIcon from "@mui/icons-material/Info";
import { navigation } from "../constants";
import Diversity1Icon from "@mui/icons-material/Diversity1";

const Navbar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Assume isLoggedIn is stored as a string "true" or "false" in localStorage
  const [isAuth, setIsAuth] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  useEffect(() => {
    setIsAuth(localStorage.getItem("isLoggedIn") === "true");
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsAuth(false);
    navigate("/signin");
  };

  return (
    <div className="static w-full top-0 bg-eh-1 z-50 font-crete">
      <nav className="flex justify-around w-full  top-[5rem] left-0 right-0 bottom-0 static mx-auto py-4">
        <div className="relative z-2 w-full flex items-center justify-around ">
          <Link
            className="flex justify-center items-center font-oswald w-[12rem] text-eh-2 font-medium text-2xl hover:text-eh-3"
            to="/"
          >
            <img src={brain} width={48} height={40} alt="EpiCareHub" />
            EpiCareHub
          </Link>
          <div className="flex gap-2">
            {navigation.map((item) => (
              <Link
                key={item.id}
                to={item.url}
                className={`flex mr-2 justify-center items-center font-oswald uppercase text-eh-2 transition-colors hover:text-eh-3 ${
                  pathname.includes(item.url) ? "z-10 text-eh-3" : "text-eh-2"
                }`}
              >
                <Diversity1Icon />
                {item.title}
              </Link>
            ))}
            <Link
              className={`flex mr-2 justify-center items-center font-oswald uppercase text-eh-2 transition-colors hover:text-eh-3 ${
                pathname?.includes("about") ? "z-10 text-eh-3" : "text-eh-2"
              } hover:text-sk-1`}
              to="/about"
            >
              <InfoIcon />
              About Us
            </Link>

              {/* Admin link */}
            <Link
              to="/admin"
              className={`block relative font-oswald uppercase text-eh-2 transition-colors hover:text-eh-3 px-6 ${
                pathname.includes("/admin") ? "z-10 text-eh-3" : "text-eh-2"
              }`}
            >
              Admin
            </Link>




            {isAuth && (
              <button
                className="flex justify-center items-center font-oswald uppercase text-eh-2 transition-colors hover:text-eh-3"
                onClick={handleLogout}
              >

                
                <LogoutIcon />
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
