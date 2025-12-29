/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neon Brutalist Fitness Theme
        void: {
          DEFAULT: '#050505',
          100: '#0a0a0a',
          200: '#111111',
          300: '#1a1a1a',
          400: '#242424',
        },
        neon: {
          lime: '#BFFF00',
          cyan: '#00F5FF',
          magenta: '#FF00FF',
          orange: '#FF6B00',
          yellow: '#FFE600',
        },
        steel: {
          100: '#F5F5F5',
          200: '#E0E0E0',
          300: '#BDBDBD',
          400: '#9E9E9E',
          500: '#757575',
        },
      },
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-left': 'slide-left 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-right': 'slide-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'blur-in': 'blur-in 0.5s ease-out forwards',
        'counter': 'counter 2s ease-out forwards',
        'progress-fill': 'progress-fill 1.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'bounce-in': 'bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
        'streak-fire': 'streak-fire 1s ease-in-out infinite',
        'gradient-x': 'gradient-x 3s ease infinite',
        'morph': 'morph 8s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(191, 255, 0, 0.3), 0 0 40px rgba(191, 255, 0, 0.1)',
            borderColor: 'rgba(191, 255, 0, 0.5)'
          },
          '50%': {
            boxShadow: '0 0 40px rgba(191, 255, 0, 0.5), 0 0 80px rgba(191, 255, 0, 0.2)',
            borderColor: 'rgba(191, 255, 0, 0.8)'
          },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'blur-in': {
          '0%': { opacity: '0', filter: 'blur(20px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        'counter': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'progress-fill': {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shake': {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'streak-fire': {
          '0%, 100%': {
            textShadow: '0 0 10px #BFFF00, 0 0 20px #BFFF00, 0 0 30px #FF6B00',
            transform: 'scale(1)'
          },
          '50%': {
            textShadow: '0 0 20px #BFFF00, 0 0 40px #BFFF00, 0 0 60px #FF6B00',
            transform: 'scale(1.05)'
          },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'morph': {
          '0%, 100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'neon-lime': '0 0 30px rgba(191, 255, 0, 0.4)',
        'neon-cyan': '0 0 30px rgba(0, 245, 255, 0.4)',
        'neon-magenta': '0 0 30px rgba(255, 0, 255, 0.4)',
        'brutal': '8px 8px 0 0 #BFFF00',
        'brutal-sm': '4px 4px 0 0 #BFFF00',
        'inner-glow': 'inset 0 0 30px rgba(191, 255, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
