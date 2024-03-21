import CardImage from "./CardImage.js";
import SetName from "./SetName.js";

export default {
  props: ["code"],
  components: {CardImage, SetName},
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
      <div>Opened {{ boosterAge }}</div>
      <button type="button" class="btn btn-warning" @click="reopen()">
        <i class="bi bi-recycle"></i>
        Open a new booster
      </button>
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
        <template v-for="card in booster?.cards">
          <div v-if="card.can_flip && size != 'small'" class="flip-card-wrapper">
            <div class="flip-card" :class="{ 'flip-card-flipped': card.flipped}">
              <div class="flip-card-back">
                <card-image :card="card" backside="true" :size="size">
              </div>
              <div class="flip-card-front">
                <card-image :card="card" :size="size">
              </div>
            </div>
            <button type="button" @click="card.flipped ^= true" class="btn btn-primary flip-button" title="Flip">
              <svg class="bi" width="32" height="32" fill="currentColor">
                <use xlink:href="icons/arrow-repeat.svg#arrow-repeat"/>
              </svg>
            </button>
          </div>
          <card-image v-else :card="card" :size="size">
        </template>
      </div>
      <div class="card-table table-responsive">
        <table v-if="size == 'table'" class="table text-nowrap">
          <tbody>
            <tr v-for="card in booster?.cards" :class="card.table_class">
              <td class="card-table-art-cell">
                <img :src="card.art" :alt="card.name_front" class="card-table-art">
              </td>
              <td class="text-start">
                <a :href="card.scryfall_url" target="_blank">{{ card.name_front }}</a>
              </td>
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
  <div class="alert alert-primary" :class="{ 'd-none': !set || booster }">
    <span class="spinner-border spinner-border-sm"></span>
    Opening a booster pack...
  </div>
  `,
  setup(props) {
    const errors = Vue.inject("errors");
    const sets = Vue.inject("sets");
    const boosters = Vue.inject("boosters");

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

    const booster = Vue.ref(null);

    const boosterAgeUpdate = Vue.ref(0);
    const boosterAge = Vue.computed(() => {
      boosterAgeUpdate.value;
      const timestamp = booster.value ? booster.value.timestamp : new Date();
      return dateFns.formatDistanceToNow(timestamp, { addSuffix: true });
    });

    Vue.onMounted(() => {
      function updateBoosterAge() {
        boosterAgeUpdate.value++;
      }

      const timer = setInterval(updateBoosterAge, 30000);
      Vue.onUnmounted(() => clearInterval(timer));
    });

    const size = Vue.ref("medium");

    if (localStorage.cardSize) {
      size.value = localStorage.cardSize;
    }

    async function openBooster(set) {
      try {
        booster.value = await fetchBooster(set);
        boosters.value[set.code] = booster.value;
        localStorage.boosters = JSON.stringify(boosters.value);

        if (!["draft", "play", "default"].includes(booster.value.booster_type)) {
          errors.value.push(`Warning: Booster type is '${booster.value.booster_type}'`);
        }
      } catch (error) {
        console.error(error);
        errors.value.push(error.message);
        booster.value = {};
      }
    }

    Vue.watch(set, async newSet => {
      if (!newSet) {
        return;
      }

      if (newSet.code in boosters.value) {
        booster.value = boosters.value[newSet.code];
        return;
      }

      openBooster(newSet);
    }, { immediate: true });

    Vue.watch(size, newSize => localStorage.cardSize = newSize);

    const reopen = () => {
      if (window.confirm("Are you sure you want to replace this booster with a new one?")) {
        delete boosters.value[set.value.code];
        booster.value = null;
        openBooster(set.value);
      }
    }

    return {
      set,
      booster,
      boosterAge,
      size,
      reopen,
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
      name_front: x.name.split(" // ")[0],
      name_back: x.name.split(" // ")[1],
      art: image_url(x, "art_crop"),
      image: image_url(x, "border_crop"),
      image_back: image_url(x, "border_crop", "back"),
      table_class: `table-${tableClasses[x.rarity]}`,
      cost: x.mana_cost
        ? Array.from(x.mana_cost
          .matchAll(/{([^}]+)}/g), x => x[1]
          .replace(/\//, ""))
        : [],
      scryfall_url: `https://scryfall.com/card/${x.scryfall_id}`,
      can_flip: ["modal_dfc", "transform", "reversible_card"].includes(x.layout),
      flipped: false,
    }));

  return {
    ...booster,
    cards: cards,
    timestamp: new Date(),
  };
}

function image_url(card, version, side="front") {
  const id = card.scryfall_id;
  return `https://cards.scryfall.io/${version}/${side}/${id[0]}/${id[1]}/${id}.jpg`
}
