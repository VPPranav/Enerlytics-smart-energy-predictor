/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "#0f1319",
          panel: "#171c26",
          card: "#1e2532",
          subtle: "#273040",
        },
        ink: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
          muted: "#64748b",
          faint: "#475569",
        },
        line: {
          DEFAULT: "#2d3748",
          dark: "#4a5568",
          subtle: "#1f2633",
        },
        meter: {
          green: "#10b981",
          "green-bg": "rgba(16, 185, 129, 0.16)",
          amber: "#f59e0b",
          "amber-bg": "rgba(245, 158, 11, 0.16)",
          red: "#ef4444",
          "red-bg": "rgba(239, 68, 68, 0.16)",
          blue: "#3b82f6",
          "blue-bg": "rgba(59, 130, 246, 0.16)",
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
      },
      boxShadow: {
        'panel': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
