import App from "./App.js";
import SetList from "./SetList.js";
import SetInfo from "./SetInfo.js";
import NotFound from "./NotFound.js";

Vue.createApp(App)
.use(VueRouter.createRouter({
  history: VueRouter.createWebHashHistory("/partybox/"),
  routes: [
    { path: "/", name: "Set List", component: SetList },
    { path: "/set/:code", name: "Set Info", component: SetInfo, props: true },
    { path: "/:pathMatch(.*)", component: NotFound },
  ]
}))
.mount("#app");
