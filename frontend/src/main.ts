import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import './assets/tailwind.css';
import App from './App.vue';
import { router } from './router';

const app = createApp(App);

app
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
    },
  });

app.mount('#app');
