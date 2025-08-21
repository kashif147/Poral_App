import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './root.reducer';
import initialState from './initialState';

const store = configureStore({
  preloadedState: initialState,
  reducer: rootReducer,
});

export default store;
