// src/store/index.js

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import medsReducer from "./medsSlice";
import logsReducer from "./logsSlice";
import chatReducer from "./chatSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meds: medsReducer,
    logs: logsReducer,
    chat: chatReducer,
  },
});