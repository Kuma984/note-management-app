import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Bootstrap 5 & Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';

import { initOffline } from './offline';

initOffline();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
