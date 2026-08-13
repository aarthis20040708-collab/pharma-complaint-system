import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './complaintsSlice';
import aiCopilotReducer from './aiCopilotSlice';

export const store = configureStore({
  reducer: {
    complaints: complaintsReducer,
    aiCopilot: aiCopilotReducer
  }
});
