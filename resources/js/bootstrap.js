import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Setup Axios
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// CSRF Token
let token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

// Setup Laravel Echo with Reverb
window.Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const reverbHost = import.meta.env.VITE_REVERB_HOST;
const enableWebSockets = import.meta.env.VITE_ENABLE_WEBSOCKETS === 'true';

if (enableWebSockets && reverbKey && reverbHost) {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: reverbHost,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });
}
