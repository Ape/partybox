import SetName from "./SetName.js";

export default {
  components: {SetName},
  template: `
  <button v-if="numBoosters > 0" type="button" class="btn btn-danger" @click="clearBoosters()">
    <i class="bi bi-trash-fill"></i>
    Clear all {{numBoosters > 1 ? numBoosters : ""}} boosters
  </button>
  <ul class="set-list list-group">
    <router-link v-for="set in sets" :key="set.code" :to="set.route" class="set-row list-group-item list-group-item-action" :class="{ 'list-group-item-light': set.premier, 'list-group-item-warning': set.supplemental }">
      <img :src="set.icon_svg_uri" :alt="set.code" class="set-icon">
      <set-name :set="set" class="set-list-name" :class="{ 'set-list-opened': set.code in boosters }"></set-name>
      <span class="badge text-bg-secondary">{{ set.year }}</span>
    </router-link>
  </ul>
  `,
  setup() {
    const boosters = Vue.inject("boosters");
    const numBoosters = Vue.computed(() => Object.keys(boosters.value).length);

    const clearBoosters = () => {
      if (window.confirm("Are you sure you want to clear all opened boosters?")) {
        boosters.value = {};
        localStorage.removeItem("boosters");
      }
    }

    return {
      sets: Vue.inject("sets"),
      boosters,
      numBoosters,
      clearBoosters,
    };
  },
}
