import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './monacoSetup.js'; // cấu hình Monaco local (phải chạy trước khi render editor)
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
