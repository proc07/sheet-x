import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeicons/primeicons.css';
import './assets/tailwind.css';
import App from './App.vue';
import { router } from './router';
import DialogService from 'primevue/dialogservice';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

const app = createApp(App);

app
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
      options: {
        darkModeSelector: '.dark',
      }
    },
  })
  .use(DialogService)
  .use(ConfirmationService)
  .use(ToastService);

app.mount('#app');
