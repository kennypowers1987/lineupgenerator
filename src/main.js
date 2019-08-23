import Vue from "vue";
import BootstrapVue from "bootstrap-vue";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "./styles/globals.scss";
import nav from "./components/MyNav";
import router from "./utils/myRouter";
import VueTruncate from "vue-truncate-filter";
import VueLocalStorage from "vue-localstorage";
import Vuex from "vuex";
import Spinner from "vue-simple-spinner";
import infiniteScroll from "vue-infinite-scroll";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

library.add(faQuestionCircle);
Vue.use(BootstrapVue);
Vue.use(VueTruncate);
Vue.use(VueLocalStorage);
Vue.use(Vuex);
Vue.use(infiniteScroll);

Vue.component("navBar", nav);
Vue.component("vue-simple-spinner", Spinner);

if (!Vue.localStorage.get("theme")) {
  Vue.localStorage.set("theme", "dark");
}

router.replace("/DraftKings");

Vue.component("common-header", {
  props: {
    site: {
      type: String,
      required: true,
      default: "DraftKings"
    },

    contest: {
      type: String,
      required: true,
      default: "CaptainMode"
    }
  },
  template: `<div class='common-header'>
              <h5>{{site}} {{contest}} Lineup Generator
                 <b-btn v-b-popover.hover="'Import the .csv for your contest , remove players you dislike, navigate to the lineups tab and start generating!'" 
                   size="sm" variant="danger" title="Instructions">?
                 </b-btn>
                 <h5 class="float-right" style="padding:10px;">
                   <a href="https://neocities.org/site/lineupgenerator">Donate if you win </a>
                   </h5>
                </h5>
                <label>
                  <strong>
                    Import Your Player Pool
                  </strong>
                  <br> in the same format as the .csv download from {{site}}
                </label>
              <br>
              </div>              
              `
});

// eslint-disable-next-line no-unused-vars
const app = new Vue({
  components: nav,
  router,
  Spinner
}).$mount("#app");
