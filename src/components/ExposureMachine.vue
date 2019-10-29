<template>
  <div class="parse">
    <h2>Exposure</h2>
    <div>
      <!-- Styled -->
      <b-form-file
        v-model="file"
        :state="Boolean(file)"
        placeholder="Choose a file..."
        drop-placeholder="Drop file here..."
        accept=".csv"
        @input="upload"
      />
      <div class="mt-3">
        Selected file: {{ file ? file.name : '' }}
      </div>
    </div>
    <div class="body col-md-12">
      <b-table
        v-if="playersList"
        striped
        hover
        :items="getUnique(playersList, 'ID')"
        :fields="playersListFields"
        style="font-size: small;"
      >
        <template
          slot="delete_btn"
          slot-scope="row"
        >
          <b-button
            size="sm"
            class="badge badge-primary"
            @click.stop="addToPlayerPool(playersList[row.index])"
          >
            Add to Pool
          </b-button>
        </template>
      </b-table>
      <span>
        <b-button
          :variant="theme"
          download
          class="badge badge-info"
          @click="savePlayersList"
        >
          Download This Player List
        </b-button>
      </span>
      <span class="col-md-6 float-right">
        <b-table
          striped
          hover
          :items="getUnique(playerPool.players, 'ID')"
          :fields="playersListFields"
          style="font-size: small;"
        >
          <template
            slot="delete_btn"
            slot-scope="row"
          >
            <b-button
              size="sm"
              class="badge badge-danger"
              @click.stop="removePlayer(playerPool.players[row.index])"
            >
              Remove
            </b-button>
            <br>            
            <b-button
              size="sm"
              class="badge badge-success"
              @click.stop="addPlayer(playerPool.players[row.index])"
            >
              Increase Exposure
            </b-button>
          </template>
        </b-table>
      </span>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import VueLocalStorage from "vue-localstorage";
import Papa from 'papaparse';
import Blob from 'blob';
import FileSaver from 'file-saver';
Vue.use(VueLocalStorage);
export default {
  Name: 'draftkings',
  data () {
    return {
      selectedFlex: 'RB',
      playersList: null,
      theme: Vue.localStorage.get("theme"),
      playersListFields: [],
      file: {},
      team: {},
      teams: {},
      position: {},
      positions: {},
      showSpinner: {
        on: false
      },
      exposure: {},
      playerPool: { players: [] }
    }
  },
  created () {
    this.$bus.$on("theme-changed", () => {
      this.updateTheme();
    });
  },
  methods: {
    addToPlayerPool (player) {
      this.playerPool.players.push(player);
      console.log(this.playerPool.players)
    },
    removePlayer (player) {
      let id = player.ID
      this.playerPool = this.playerPool.filter(function (player) {
        return player.ID !== id;
      });
    },
    addPlayer (player) {
      this.playerPool.players.push(player);
    },
    upload () {
      let that = this;
      let fileToLoad = that.file;
      const reader = new FileReader()
      reader.onload = fileLoadedEvent => {
        Papa.parse(fileLoadedEvent.target.result, {
          header: true,
          complete (results) {
            that.playersList = results.data;
            that.playersListFields = Object.keys(that.playersList[0]).map(str => {
              return {
                key: str,
                sortable: true
              }
            });
            that.playersListFields.push('delete_btn');
          },
          error (errors) {
            console.warn('error', errors)
          }
        })
      }
      reader.readAsText(fileToLoad)
    },
    save () {
      const blob = new Blob([this.parseJSONtoCSV(this.fullLineups)], {
        type: 'text/csv'
      })
      FileSaver.saveAs(blob, 'DK' + new Date() + '.csv');
    },
    savePlayersList () {
      const blob = new Blob([this.parseJSONtoCSV(this.playerPool.players)], {
        type: 'text/csv'
      })
      FileSaver.saveAs(blob, 'DK' + new Date() + '.csv')

    },
    parseJSONtoCSV (table) {
      return Papa.unparse(table, {
        header: true,
        skipEmptyLines: true
      })
    },
    getUnique (arr, comp) {
      const unique = arr
        .map(e => e[comp])
        // store the keys of the unique objects
        .map((e, i, final) => final.indexOf(e) === i && i)
        // eliminate the dead keys & store unique objects
        .filter(e => arr[e]).map(e => arr[e]);
      return unique;
    },
    updateTheme () {
      this.theme = Vue.localStorage.get("theme");
    },
    groupBy (arr, property) {
      return arr.reduce((arr, x) => {
        if (!arr[x[property]]) {
          arr[x[property]] = [];
        }
        arr[x[property]].push(x);
        return arr;
      }, {});
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.body {
  display: flex;
  justify-content: center;
}
.entry {
  width: 40%;
}

.entry-result {
  width: 100%;
  height: 50vh;
}

.preview {
  width: 40%;
  text-align: left;
}

.parse {
  margin: 3%;
  font-size: 12px;
}

.generate-progress-bar {
  margin-top: 10px !important;
}
</style>