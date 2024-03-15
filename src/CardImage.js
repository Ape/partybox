export default {
  props: ["name", "url", "size"],
  template: `<img :src="url" :alt="name" width="480" height="680" class="img-fluid m-auto" :class="{ 'img-thumbnail': size != 'small' }">`,
}
