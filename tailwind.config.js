/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./resources/**/*.blade.php",
        "./resources/**/*.js",
        "./resources/**/*.vue",
    ],
    theme: {
        extend: {
            colors: {
                elevator: {
                    idle: '#1f2937',      // gray-800
                    moving: '#ef4444',    // red-500
                    arrived: '#10b981',   // green-500
                },
                button: {
                    call: '#10b981',      // green-500
                    waiting: '#ef4444',   // red-500
                    arrived: '#3b82f6',   // blue-500
                },
            },
            spacing: {
                'floor-height': '80px',
                'elevator-width': '64px',
                'elevator-height': '72px',
            },
            transitionDuration: {
                'elevator': '500ms',
            },
            animation: {
                'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'ding': 'ding 0.3s ease-in-out',
            },
            keyframes: {
                ding: {
                    '0%, 100%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.05)' },
                },
            },
        },
    },
    plugins: [],
};
