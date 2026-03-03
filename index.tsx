
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 7442610821c778858943f5c2ba4ef2c909b9d932

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
<<<<<<< HEAD
=======
=======
>>>>>>> 52bf42a0913516331346d464e05cdef6a94b819f
>>>>>>> 7442610821c778858943f5c2ba4ef2c909b9d932
