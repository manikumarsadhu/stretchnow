import { mount } from 'svelte'
import { registerSW } from 'virtual:pwa-register'
import './app.css'
import App from './App.svelte'
import '@picocss/pico/css/pico.min.css';

// Safe Service Worker Registration (catches rejections in bots/sandboxes like Googlebot WRS)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: true,
      onRegisterError(error) {
        console.warn('PWA Service Worker registration skipped or failed:', error);
      }
    });
  } catch (err) {
    console.warn('Service worker not supported in current environment:', err);
  }
}

const targetElement = document.getElementById('app');
if (!targetElement) throw new Error('Target element #app not found');

const app = mount(App, {
  target: targetElement,
})

export default app
