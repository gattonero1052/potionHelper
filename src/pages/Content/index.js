import React from 'react';
import { createRoot } from "react-dom/client";
import App from './App';

/***************************** DOM Bindings ******************************/

; ((fn) => {
  if (document.readyState === 'complete') {
    fn();
  } else {
    window.addEventListener('load', fn);
  }
})(() => {
  // inject widget
  const contextEl = document.createElement('div');
  contextEl.style.position = 'absolute';
  contextEl.style.zIndex = '100000';
  createRoot(contextEl).render(
    <App />
  );

  // inject animation style
  const styleElement = document.createElement("style");
  const cssRules = `
  .ant-notification {
    z-index:100001;
  }

  .ant-tooltip {
    z-index:100002;
  }

  @keyframes flash {
    0% {filter: brightness(1);}
    50% {filter: brightness(50);}
    100% {filter: brightness(1);}
  }
  @keyframes remove {
    0% {opacity:1;}
    50% {opacity:0;}
    100% {opacity:1;}
  }
  `;
  styleElement.appendChild(document.createTextNode(cssRules));
  document.head.appendChild(styleElement);
  document.body.prepend(contextEl);
});
