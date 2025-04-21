import { createGlobalStyle } from 'styled-components';

// Глобальные стили приложения
export const GlobalStyles = createGlobalStyle`
  :root {
    /* Светлая тема (по умолчанию) */
    --bg-color: #ffffff;
    --bg-secondary: #f5f5f5;
    --text-primary: #000000;
    --text-secondary: #757575;
    --accent: #007aff;
    --accent-light: #e8f0fe;
    --border: #e0e0e0;
    --error: #ff3b30;
    --success: #34c759;
    --shadow: rgba(0, 0, 0, 0.1);
    --card-bg: #ffffff;
    --button-bg: #007aff;
    --button-text: #ffffff;
    --input-bg: #ffffff;
    --input-border: #e0e0e0;
    --header-bg: #f8f9fa;
  }

  /* Темная тема */
  [data-theme='dark'] {
    --bg-color: #1c1c1e;
    --bg-secondary: #2c2c2e;
    --text-primary: #ffffff;
    --text-secondary: #8e8e93;
    --accent: #0a84ff;
    --accent-light: #1c1c2e;
    --border: #38383a;
    --error: #ff453a;
    --success: #30d158;
    --shadow: rgba(0, 0, 0, 0.3);
    --card-bg: #2c2c2e;
    --button-bg: #0a84ff;
    --button-text: #ffffff;
    --input-bg: #1c1c1e;
    --input-border: #38383a;
    --header-bg: #1c1c1e;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--bg-color);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    text-align: center;
    transition: all 0.3s ease;
  }

  a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.3s ease;
  }

  a:hover {
    text-decoration: underline;
  }

  button {
    cursor: pointer;
    font-family: inherit;
    border: none;
    background: var(--button-bg);
    color: var(--button-text);
    padding: 10px 16px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  button:hover {
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  input, textarea, select {
    font-family: inherit;
    padding: 10px 14px;
    border: 1px solid var(--input-border);
    border-radius: 8px;
    background-color: var(--input-bg);
    color: var(--text-primary);
    transition: all 0.3s ease;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--accent);
  }

  /* Стили для скролл-бара */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: var(--bg-secondary);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--text-secondary);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }

  /* Стили Telegram Mini App для мобильных устройств */
  @media (max-width: 768px) {
    body {
      padding-bottom: env(safe-area-inset-bottom, 0);
      padding-top: env(safe-area-inset-top, 0);
    }
  }
`;
