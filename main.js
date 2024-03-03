async function fetchSets() {
  const url = "https://api.scryfall.com/sets";

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch sets: ${await getScryfallError(response)}`);
  }

  const sets = (await response.json()).data
    .filter(x => !x.digital)
    .filter(x => x.code != "plst")
    .filter(x => !x.name.includes("Jumpstart"))
    .filter(x => new Date(x.released_at) <= new Date())
    .filter(x => new Date(x.released_at) >= new Date("2003-07-28"));

  const masterpiece = sets
    .filter(x => x.set_type == "masterpiece")
    .filter(x => x.hasOwnProperty("parent_set_code"));

  return sets
    .filter(x => !x.hasOwnProperty("parent_set_code"))
    .map(x => ({...x,
      premier: ["core", "expansion"].includes(x.set_type),
      supplemental: ["masters", "draft_innovation"].includes(x.set_type),
      shortname: x.name.split(":").pop().trim(),
      year: Number(x.released_at.split("-")[0]),
      children: masterpiece.filter(y => y.parent_set_code == x.code),
    }))
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

Vue.createApp({
  setup() {
    const errors = Vue.ref([]);
    const sets = Vue.ref(null);
    const timePassed = Vue.ref(false);

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

    return {
      errors,
      sets,
      timePassed,
    };
  }
}).mount("#app");
