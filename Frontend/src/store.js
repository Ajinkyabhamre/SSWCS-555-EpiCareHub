import { configureStore } from "@reduxjs/toolkit";
import patientReducer from "./features/patientSlice";

const store = configureStore({
  reducer: {
    patients: patientReducer,
  },
});

export default store;
