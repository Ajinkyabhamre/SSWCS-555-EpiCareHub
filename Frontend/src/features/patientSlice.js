import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPatient: null,
  selectedUpload: null,
};

export const patientSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    selectUpload: (state, action) => {
      const uploadId = action.payload;
      state.selectedUpload = uploadId;
    },
    clearUpload: (state) => {
      state.selectedUpload = null;
    },
  },
});

export const { selectUpload, clearUpload } = patientSlice.actions;

export default patientSlice.reducer;
