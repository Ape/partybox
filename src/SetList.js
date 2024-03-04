import SetName from "./SetName.js";

export default {
  components: {SetName},
  template: `
  <ul class="set-list list-group">
    <router-link v-for="set in sets" :key="set.code" :to="set.route" class="set-row list-group-item list-group-item-action" :class="{ 'list-group-item-light': set.premier, 'list-group-item-warning': set.supplemental }">
      <img :src="set.icon_svg_uri" :alt="set.code" class="set-icon">
      <set-name :set="set" class="set-list-name"></set-name>
      <span class="badge text-bg-secondary">{{ set.year }}</span>
    </router-link>
  </ul>
  `,
  setup() {
    return {
      sets: Vue.inject("sets"),
    };
  },
}
