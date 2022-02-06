import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import { BrowserRouter } from 'react-router-dom';
import { VisibilityProvider } from './providers/VisibilityProvider';
import CharactersProvider from './providers/CharactersProvider';
import { ChakraProvider } from '@chakra-ui/react';
import { theme } from './styles/theme';

ReactDOM.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <VisibilityProvider>
        <CharactersProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CharactersProvider>
      </VisibilityProvider>
    </ChakraProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
