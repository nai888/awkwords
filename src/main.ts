import { createApp } from 'vue'
import App from './App.vue'
import { initTheme } from './composables/useTheme'
import './style.css'

initTheme() // establish theme immediately
createApp(App).mount('#app')
