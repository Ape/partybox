export default {
  props: ["card", "backside", "size"],
  template: `
  <a :href="card.scryfall_url" target="_blank">
    <img :src="image" :alt="name" width="480" height="680" class="img-fluid m-auto" :class="{ 'img-thumbnail': size != 'small' }">
  </a>
  `,
  setup (props) {
    const name = Vue.computed(() => {
      if (props.backside) {
        return props.card.name_back;
      }

      return props.card.name_front;
    });

    const image = Vue.computed(() => {
      if (props.backside) {
        return props.card.image_back;
      }

      return props.card.image;
    });

    return {
      name,
      image,
    };
  }
}
