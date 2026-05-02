// frontend/tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd0ff',
          400: '#7aa3f7',
          600: '#3b6ef0',
          700: '#2a57d4',
          800: '#1e3fa8',
          900: '#162d7a',
        },
        surface: {
          0:   '#ffffff',
          50:  '#f8f9fb',
          100: '#f0f2f6',
          200: '#e3e7ef',
          300: '#c8cedc',
        },
        ink: {
          900: '#111827',
          700: '#374151',
          500: '#6b7280',
          300: '#9ca3af',
        },
        success: '#16a34a',
        danger:  '#dc2626',
        warning: '#d97706',
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 16px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
}