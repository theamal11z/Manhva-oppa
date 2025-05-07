/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'gray-900': '#111827',
        'gray-800': '#1F2937',
        'red-500': '#EF4444',
        'red-600': '#DC2626',
        'yellow-400': '#FACC15',
      },
    },
  },
  plugins: [],
};
