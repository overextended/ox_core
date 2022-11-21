import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import { BrowserRouter } from 'react-router-dom';
import { VisibilityProvider } from './providers/VisibilityProvider';
import CharactersProvider from './providers/CharactersProvider';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';
import { isEnvBrowser } from './utils/misc';
import LocaleProvider from './providers/LocaleProvider';

if (isEnvBrowser()) {
  const root = document.getElementById('root');

  // https://i.imgur.com/iPTAdYV.png - Night time img
  // root!.style.backgroundImage = 'url("https://i.imgur.com/iPTAdYV.png")';
  root!.style.backgroundImage = 'url("https://i.imgur.com/3pzRj9n.png")';
  root!.style.backgroundSize = 'cover';
  root!.style.backgroundRepeat = 'no-repeat';
  root!.style.backgroundPosition = 'center';
}

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <VisibilityProvider>
        <CharactersProvider>
          <BrowserRouter>
          <LocaleProvider>
              <App />
            </LocaleProvider>
          </BrowserRouter>
        </CharactersProvider>
      </VisibilityProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
