// src/store/medsSlice.js

import { createSlice } from "@reduxjs/toolkit";

const medsSlice = createSlice({
  name: "meds",
  initialState: { medications: [], loading: false, error: null },
  reducers: {
    setMedications: (state, action) => { state.medications = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
  },
});

export const { setMedications, setLoading, setError } = medsSlice.actions;
export default medsSlice.reducer;