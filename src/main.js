import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/index.css'
import { initBlogGenerationService } from './lib/blogGenerationService'

// Initialize the app
const app = createApp(App)

// Use router
app.use(router)

// Mount the app
app.mount('#app')

// Initialize blog generation service to monitor for new manga entries
initBlogGenerationService()
