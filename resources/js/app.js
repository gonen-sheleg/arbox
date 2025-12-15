import './bootstrap';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElevatorSystem from './components/ElevatorSystem.vue';

// Create Pinia store
const pinia = createPinia();

// Create Vue application
const app = createApp(ElevatorSystem);

// Use Pinia
app.use(pinia);

// Mount application
app.mount('#app');
