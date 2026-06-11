// src/store/chatSlice.js

import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: { messages: [], loading: false, error: null },
  reducers: {
    addMessage: (state, action) => { state.messages.push(action.payload); },
    setMessages: (state, action) => { state.messages = action.payload; },
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
  },
});

export const { addMessage, setMessages, setLoading, setError } = chatSlice.actions;
export default chatSlice.reducer;