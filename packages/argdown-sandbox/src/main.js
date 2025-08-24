// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App";
import router from "./router";

const app = createApp(App);
const pinia = createPinia();

app.config.globalProperties.$filters = {
  tokenName: function (token) {
    return token.tokenType.name;
  },
};

app.use(pinia);
app.use(router);

app.mount("#app");
