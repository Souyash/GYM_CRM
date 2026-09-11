import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </React.StrictMode>
);

// Gracefully dismiss the zero-latency HTML preloader
const initialPreloader = document.getElementById('initial-preloader');
if (initialPreloader) {
  initialPreloader.style.opacity = '0';
  setTimeout(() => {
    initialPreloader.remove();
  }, 400);
}

