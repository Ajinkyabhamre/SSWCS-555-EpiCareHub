/**
 * Navbar.jsx
 *
 * Modern, light health-tech navbar for EpiCareHub
 * - White background with mint accents
 * - Matches the clean landing page design
 * - Responsive, accessible, with active state styling
 * - Framer Motion entrance animations
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // Show nav links only when logged in
  const showNavLinks = isLoggedIn;

  const isActive = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userToken");

    // Navigate to landing page
    navigate("/");
  };

  const navVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: custom * 0.05, ease: "easeOut" },
    }),
  };

  return (
    <motion.header
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-emerald-50 shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Logo / Brand */}
        <motion.div
          custom={0}
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <Link
            to="/"
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <motion.div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="text-base font-semibold text-white">🧠</span>
            </motion.div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-slate-900">
                EpiCareHub
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                Presurgical Planning
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Nav Links - Conditional rendering based on auth state */}
        <nav className="flex items-center gap-1 md:gap-2 text-sm font-medium">
          {isLoggedIn ? (
            <>
              {/* Dashboard Link */}
              <motion.div
                custom={1}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/dashboard"
                  className={`inline-flex items-center rounded-full px-4 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                    isActive("/dashboard")
                      ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200/40"
                      : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Dashboard
                </Link>
              </motion.div>

              {/* Patients Link */}
              <motion.div
                custom={2}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/patients"
                  className={`inline-flex items-center rounded-full px-4 py-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                    isActive("/patients")
                      ? "bg-emerald-100 text-emerald-700 shadow-sm shadow-emerald-200/40"
                      : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Patients
                </Link>
              </motion.div>

              {/* Logout Button */}
              <motion.button
                custom={3}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                type="button"
                onClick={handleLogout}
                className="ml-2 inline-flex items-center rounded-full border-2 border-emerald-300 bg-white px-4 py-1.5 text-sm font-semibold text-emerald-700 transition-all duration-200 hover:bg-emerald-50 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                whileHover={{ scale: 1.05, backgroundColor: "#f0fdf4" }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </>
          ) : (
            /* Sign In Link for non-authenticated users */
            <motion.div
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/signin"
                className="inline-flex items-center rounded-full border-2 border-emerald-600 bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-700 hover:border-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Sign in
              </Link>
            </motion.div>
          )}
        </nav>
      </div>
    </motion.header>
  );
}
