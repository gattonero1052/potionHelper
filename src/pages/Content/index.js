import React from 'react';
import { createRoot } from "react-dom/client";
import App from './App';

/***************************** DOM Bindings ******************************/
; ((fn) => {
  console.log(document.readyState);
  if (document.readyState === 'complete') {
    fn();
  } else {
    window.addEventListener('load', fn);
  }
})(() => {
  const contextEl = document.createElement('div');
  document.body.prepend(contextEl);
  createRoot(contextEl).render(
    <App />
  );
});
