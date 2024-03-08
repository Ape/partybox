import SetName from "./SetName.js";

export default {
  props: ["code"],
  components: {SetName},
  template: `
  <ul v-if="set" class="set-info list-group">
    <div class="list-group-item" :class="{ 'list-group-item-light': set.premier, 'list-group-item-warning': set.supplemental }">
      <img :src="set.icon_svg_uri" :alt="set.code" class="set-icon-big">
      <div class="set-header">
        <h2><set-name :set="set"></set-name></h2>
        <div class="set-badges">
          <span v-if="set.premier" class="badge text-bg-light">premier</span>
          <span v-if="set.supplemental" class="badge text-bg-warning">supplemental</span>
          <span class="badge text-bg-secondary">{{ set.release_month }}</span>
        </div>
      </div>
    </div>
    <div class="list-group-item">
      <input type="radio" id="size-small" v-model="size" value="small" class="btn-check">
      <label class="btn" for="size-small">Small</label>

      <input type="radio" id="size-medium" v-model="size" value="medium" class="btn-check">
      <label class="btn" for="size-medium">Medium</label>

      <input type="radio" id="size-large" v-model="size" value="large" class="btn-check">
      <label class="btn" for="size-large">Large</label>

      <input type="radio" id="size-table" v-model="size" value="table" class="btn-check">
      <label class="btn" for="size-table">Table</label>
    </div>
    <div class="card-list-container list-group-item">
      <div v-if="size != 'table'" class="card-list" :class="'card-list-' + size">
        <img v-for="card in cards" :src="card.image" :alt="card.name" width="480" height="680" class="img-fluid m-auto" :class="{ 'img-thumbnail': size != 'small' }">
      </div>
      <div class="card-table table-responsive">
        <table v-if="size == 'table'" class="table text-nowrap">
          <tbody>
            <tr v-for="card in cards" :class="card.table_class">
              <td class="card-table-art-cell">
                <img :src="card.art" :alt="card.frontname" class="card-table-art">
              </td>
              <td class="text-start">{{ card.frontname }}</td>
              <td>{{ card.types.join(" ") }}</td>
              <td class="text-end">
                <img v-for="symbol in card.cost" :src="'https://svgs.scryfall.io/card-symbols/' + symbol + '.svg'" :alt="symbol" class="mana-symbol">
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ul>
  <div class="alert alert-primary" :class="{ 'd-none': !set || cards }">
    <span class="spinner-border spinner-border-sm"></span>
    Opening a booster pack...
  </div>
  `,
  setup(props) {
    const errors = Vue.inject("errors");
    const sets = Vue.inject("sets");

    const set = Vue.computed(() => {
      if (!sets.value) {
        return null;
      }

      const result = sets.value.find(x => x.code == props.code);

      if (!result) {
        errors.value.push(`Set '${props.code}' not found!`);
      }

      return result;
    });

    const cards = Vue.ref(null);
    const size = Vue.ref("medium");

    if (localStorage.cardSize) {
      size.value = localStorage.cardSize;
    }

    Vue.watch(set, async newSet => {
      if (!newSet) {
        return;
      }

      try {
        const booster = await fetchBooster(newSet);
        cards.value = booster.cards;

        if (!["draft", "play", "default"].includes(booster.booster_type)) {
          errors.value.push(`Warning: Booster type is '${booster.booster_type}'`);
        }
      } catch (error) {
        console.error(error);
        errors.value.push(error.message);
        cards.value = [];
      }
    }, { immediate: true });

    Vue.watch(size, newSize => localStorage.cardSize = newSize);

    return {
      set,
      cards,
      size,
    };
  },
}

async function fetchBooster(set) {
  const url = `https://boosterapi.ape3000.com/booster/${set.code}`;
  const response = await fetch(url);
  const booster = await response.json()

  if (!response.ok) {
    throw new Error(`Failed to fetch a booster: ${booster.error}`);
  }

  const tableClasses = {
    common: "light",
    uncommon: "secondary",
    rare: "warning",
    mythic: "danger",
  };

  const cards = booster.cards
    .filter(x => !x.types.includes("Conspiracy"))
    .map(x => ({
      ...x,
      frontname: x.name.split(" // ")[0],
      art: image_url(x, "art_crop"),
      image: image_url(x, "border_crop"),
      table_class: `table-${tableClasses[x.rarity]}`,
      cost: x.mana_cost
        ? Array.from(x.mana_cost
          .matchAll(/{([^}]+)}/g), x => x[1]
          .replace(/\//, ""))
        : [],
    }));

  return {
    ...booster,
    cards: cards,
  };

}

function image_url(card, version) {
  const id = card.scryfall_id;
  return `https://cards.scryfall.io/${version}/front/${id[0]}/${id[1]}/${id}.jpg`
}
