export default {
  props: ["card", "backside", "size"],
  template: `
  <div class="position-relative">
    <img :src="image" :alt="name" width="480" height="680" class="img-fluid m-auto" :class="{ 'img-thumbnail': size != 'small' }" @[card.can_flip&&"click"]="card.flipped ^= true">
    <a v-if="!backside && size != 'small'" v-show="!card.flipped" :href="card.scryfall_url" target="_blank" class="scryfall-button" :class="{ 'scryfall-button-battle': card.types.includes('Battle'), 'scryfall-button-split': card.layout == 'split' }">
      <img src="images/scryfall.svg" alt="Scryfall" width="40" height="40">
    </a>
  </div>
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
