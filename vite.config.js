import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// هذا الملف ضروري لتعريف المسار الفرعي على GitHub Pages
export default defineConfig({
  base: '/vaeck/', // هذا هو سطر الإصلاح
  plugins: [react()],
})