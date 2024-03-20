export default {
  template: `
  <div class="app-container container-fluid">
    <h1 class="logo">
      <router-link to="/">Party Box Boosters</router-link>
    </h1>
    <div v-for="error in errors" class="alert alert-danger fade" :class="{ 'show': error }">{{ error }}</div>
    <router-view></router-view>
    <div class="alert alert-primary fade" :class="{ 'd-none': sets, 'show': timePassed }">
      <span class="spinner-border spinner-border-sm"></span>
      Fetching set data...
    </div>
  </div>
  `,
  setup() {
    const errors = Vue.ref([]);
    const sets = Vue.ref(null);
    const boosters = Vue.ref({});
    const timePassed = Vue.ref(false);

    if (localStorage.boosters) {
      boosters.value = JSON.parse(localStorage.boosters);
    }

    Vue.onMounted(async () => {
      try {
        sets.value = await fetchSets();
      } catch (error) {
        console.error(error);
        errors.value.push(error.message);
        sets.value = [];
      }
    });

    Vue.onMounted(() => setTimeout(() => timePassed.value = true, 400));

    // Clear errors on navigation
    VueRouter.useRouter().afterEach((to, from) => errors.value.length = 0);

    Vue.provide("errors", errors);
    Vue.provide("sets", sets);
    Vue.provide("boosters", boosters);

    return {
      errors,
      sets,
      timePassed,
    };
  },
}

async function fetchSets() {
  const url = "https://api.scryfall.com/sets";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sets: ${await getScryfallError(response)}`);
  }

  return (await response.json()).data
    .filter(x => !x.digital)
    .filter(x => x.code != "plst")
    .filter(x => !x.name.includes("Jumpstart"))
    .filter(x => !x.hasOwnProperty("parent_set_code"))
    .filter(x => new Date(x.released_at) <= new Date())
    .filter(x => new Date(x.released_at) >= new Date("2003-07-28"))
    .map(x => ({...x, route: `/set/${x.code}`}))
    .map(x => {
      const [, title_prefix, title] = x.name.match(/([^:]*:)? ?(.*)/);

      return {...x, title, title_prefix,
        premier: ["core", "expansion"].includes(x.set_type),
        supplemental: ["masters", "draft_innovation"].includes(x.set_type),
        year: Number(x.released_at.split("-")[0]),
        release_month: new Date(x.released_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    })
    .filter(x => x.premier || x.supplemental);
}

async function getScryfallError(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const error = await response.json();

    if ("warnings" in error) {
      return `${error.details} ${error.warnings}`;
    }

    return error.details;
  }

  return await response.text();
}
