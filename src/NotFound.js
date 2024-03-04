export default {
  setup () {
    const errors = Vue.inject("errors");
    const path = VueRouter.useRoute().path;

    errors.value.push(`Page '${path}' not found!`);
  },
}
