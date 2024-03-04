export default {
  props: ["set"],
  template: `
  <div class="set-name">
    <div v-if="set.title_prefix" class="d-inline-block">{{ set.title_prefix }}&thinsp;</div>
    <div class="d-inline-block">{{ set.title }}</div>
  </div>
  `,
}
