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
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

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
      className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-emerald-50 dark:border-slate-800 shadow-sm"
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
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                EpiCareHub
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                Presurgical Planning
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Nav Links - Conditional rendering based on auth state */}
        <nav className="flex items-center gap-1 md:gap-2 text-sm font-medium">
          {/* Theme Toggle - Always visible */}
          <motion.button
            custom={0}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isDark ? (
              <>
                <LightModeIcon style={{ fontSize: "1rem" }} />
                <span className="hidden sm:inline text-slate-700 dark:text-slate-200">Light</span>
              </>
            ) : (
              <>
                <DarkModeIcon style={{ fontSize: "1rem" }} />
                <span className="hidden sm:inline text-slate-700 dark:text-slate-200">Dark</span>
              </>
            )}
          </motion.button>

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
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/40"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-200/40 dark:shadow-emerald-900/40"
                      : "text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
                className="ml-2 inline-flex items-center rounded-full border-2 border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400 transition-all duration-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 dark:hover:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                whileHover={{ scale: 1.05 }}
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
