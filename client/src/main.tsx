import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { AppContent } from './App';
import './index.css';

// Detect iOS (iPhone/iPad/Xcode Simulator/Capacitor) for notch & Dynamic Island padding
if (typeof window !== 'undefined') {
  const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (window.location.protocol === 'capacitor:') ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isApple) {
    document.documentElement.classList.add('is-ios');
  }
}

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

