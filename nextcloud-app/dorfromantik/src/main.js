import { createApp } from 'vue';
import App from './App.vue';
import { createApi } from './api.js';
import './style.css';

const host = document.getElementById('dorfromantik-app');
const { apiUrl, workerUrl, scope, homeUrl } = host.dataset;
const api = createApi({ apiUrl, token: () => document.head.dataset.requesttoken });

createApp(App, { api, homeUrl }).mount(host);

// Service Worker gibt es nur mit HTTPS (oder auf localhost); ohne läuft die App ganz normal im Browser.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(workerUrl, { scope }).catch((error) => {
    console.warn('Service Worker nicht registriert:', error);
  });
}
