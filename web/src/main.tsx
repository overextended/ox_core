import { Provider } from 'jotai';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import CharacterSelector from './layouts/characters';
import { isEnvBrowser } from './utils/misc';
import LocaleProvider from './providers/LocaleProvider';
import { Sidebar } from './layouts/Sidebar';

if (isEnvBrowser()) {
  const root = document.getElementById('root');

  // https://i.imgur.com/iPTAdYV.png - Night time img
  root!.style.backgroundImage = 'url("https://i.imgur.com/3pzRj9n.png")';
  root!.style.backgroundSize = 'cover';
  root!.style.backgroundRepeat = 'no-repeat';
  root!.style.backgroundPosition = 'center';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LocaleProvider>
      <Provider>
        <Sidebar />
      </Provider>
    </LocaleProvider>
  </React.StrictMode>,
);
