import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store.js";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import axios from "axios";

// Configure axios to send credentials (cookies) with all requests
// This enables session-based authentication
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </ThemeProvider>
);
