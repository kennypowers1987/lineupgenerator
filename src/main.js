import Vue from 'vue'
import VueRouter from 'vue-router'
import BootstrapVue from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import "./styles/test.scss";
import nav from './components/MyNav'
import router from './utils/myRouter'
import VueTruncate from 'vue-truncate-filter'
import VueLocalStorage from 'vue-localstorage'
import Vuex from 'vuex'
import Spinner from 'vue-simple-spinner'
import infiniteScroll from 'vue-infinite-scroll'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons'

library.add(faQuestionCircle)
Vue.use(BootstrapVue)
Vue.use(VueTruncate)
Vue.use(VueLocalStorage)
Vue.use(Vuex)
Vue.use(infiniteScroll)

Vue.component('navbar', nav);
Vue.component('vue-simple-spinner', Spinner)

if (!Vue.localStorage.get('theme')) {
  Vue.localStorage.set('theme', 'dark')
}

router.replace('/CaptainMode')

// eslint-disable-next-line no-unused-vars
const app = new Vue({
  components: nav,
  router,
  Spinner
}).$mount('#app')
