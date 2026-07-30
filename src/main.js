import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import '@picocss/pico/css/pico.min.css';

const targetElement = document.getElementById('app');
if (!targetElement) throw new Error('Target element #app not found');

const app = mount(App, {
  target: targetElement,
})

export default app
