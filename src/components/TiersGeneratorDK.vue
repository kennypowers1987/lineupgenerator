<template>
  <div class="parse">
    <common-header
      site="DraftKings"
      contest="Tiers"
    />
    <b-form-file      
      v-model="file"
      :state="Boolean(file)"
      placeholder="Choose a file..."
      drop-placeholder="Drop file here..."
      accept=".csv"
      @input="upload"
    />

    <div class="body" />
    <b-tabs v-if="playersList">
      <b-tab
        title="All Players"
        active
      >
        <b-button
          :variant="theme"
          download
          @click="savePlayersList"
        >
          Download Player List
        </b-button>
        <b-table
          striped
          hover
          :items="playersList"
          :fields="playersListFields"
        >
          <template
            slot="delete_btn"
            slot-scope="row"
          >
            <b-button
              size="sm"
              class="btn btn-danger"
              @click.stop="removePlayer(playersList[row.index])"
            >
              Remove
            </b-button>
          </template>
        </b-table>
      </b-tab>
      <b-tab title="Players By Team">
        <div class="alert alert-light">
          <b-btn
            v-for="team in Object.keys(teams).sort()"
            :key="team.Team"
            variant="link"
            size="sm"
            @click="setTeam(team)"
          >
            {{ team }}
          </b-btn>
        </div>
        <b-table
          v-if="team.length"
          striped
          hover
          :items="team"
          :fields="playersListFields"
        />
      </b-tab>
      <b-tab title="Players By Position">
        <div class="alert alert-light">
          <b-btn
            v-for="position in Object.keys(positions)"
            :key="position.Position"
            variant="link"
            size="sm"
            @click="setPosition(position)"
          >
            {{ position }}
          </b-btn>
        </div>
        <b-table
          v-if="position.length"
          striped
          hover
          :items="position"
          :fields="playersListFields"
        />
      </b-tab>
      <b-tab
        v-if="lineups.length" 
        title="Lineups"
      >
        <h5>
          Exposure
        </h5>
        <pre>{{ exposures }}</pre>
        <b-btn @click="generate()">
          Generate
        </b-btn>
        <b-button
          :variant="theme"
          download
          @click="save"
        >
          Download {{ lineups.length }} Lineups
        </b-button>

        <h5>
          Lineups
        </h5>
        <b-table         
          striped
          hover
          :items="lineups"
          :fields="Object.keys(lineups[0]).map((key)=>{
            let field = {
              key: key,
              sortable: true
            }
            return field
          })"
        />
      </b-tab>
    </b-tabs>
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
  name: 'Tiers',
  data () {
    return {
      playersList: null,
      theme: Vue.localStorage.get("theme"),
      playersListFields: [],
      team: {},
      teams: {},
      position: {},
      positions: {},
      lineups: [],
      fullLineups: [],
      file : {},
      lineup: {
        'T1': null,
        'T2': null,
        'T3': null,
        'T4': null,
        'T5': null,
        'T6': null,
        'T7': null,
        'T8': null,
        'Total Salary': null
      },
      counts: {},
      exposures: {},
    }
  },
  created () {
    this.$bus.$on("theme-changed", () => {
      this.updateTheme();
    });
  },
  methods: {
    drawTeams () {
      this.teams = this.groupBy(this.playersList, "TeamAbbrev");
      delete this.teams["undefined"];
    },
    drawPositions () {
      this.positions = this.groupBy(this.playersList, "Roster Position");
    },
    removePlayer (player) {
      var id = player.ID

      this.playersList = this.playersList.filter(function (player) {
        return player.ID !== id;
      });
      this.drawTeams();
      this.drawPositions();
    },
    upload () {
      var that = this;
      const fileToLoad = this.file
      const reader = new FileReader()
      reader.onload = fileLoadedEvent => {
        Papa.parse(fileLoadedEvent.target.result, {
          header: true,
          complete (results) {
            that.playersList = results.data
            that.playersListFields = Object.keys(that.playersList[0]).map(str => {
              return {
                key: str,
                sortable: false
              }
            });
            that.playersListFields.push('delete_btn');
            that.drawTeams();
            that.drawPositions();
          },
          error (errors) {
            console.log('error', errors)
          }
        })
      }
      reader.readAsText(fileToLoad)
    },
    save () {
      const blob = new Blob([this.parseJSONtoCSV(this.fullLineups)], {
        type: 'text/csv'
      })
      FileSaver.saveAs(blob, 'DK' + new Date() + '.csv')

    },
    savePlayersList () {
      const blob = new Blob([this.parseJSONtoCSV(this.playersList)], {
        type: 'text/csv'
      })
      FileSaver.saveAs(blob, 'DK' + new Date() + '.csv')

    },
    parseJSONtoCSV (table) {
      return Papa.unparse(table)
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
    },
    setTeam (team) {
      this.team = this.teams[team];
    },
    setPosition (pos) {
      this.position = this.positions[pos];
    },
    shuffleArray (array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    },
    calculateExposure (id) {
      var that = this;
      if (!that.counts[id]) {
        that.counts[id] = 1
      }
      else {
        that.counts[id] = that.counts[id] + 1
      }
      that.exposures[id] = ((that.counts[id] / (that.lineups.length + 1)).toFixed(3)) * 100 + "%"
    },

    generate () {
      var that = this;
      var playerIds = [];
      var playerNames = [];
      that.lineup = {
        'T1': null,
        'T2': null,
        'T3': null,
        'T4': null,
        'T5': null,
        'T6': null,
        'T7': null,
        'T8': null
      }
      var getT1 = function () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['T1'].length));
        if (!that.positions['T1'][index].ID) {
          return that.generate();
        }
        that.lineup.T1 = that.positions['T1'][index];
        playerIds.push(that.lineup.T1.ID);
        playerNames.push(that.lineup.T1.Name);
        getT2();
      }

      var getT2 = function () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['T2'].length));
        if (!that.positions['T2'][index].ID) {
          return that.generate();
        }
        that.lineup.T2 = that.positions['T2'][index];
        playerIds.push(that.lineup.T2.ID);
        playerNames.push(that.lineup.T2.Name);
        getT3();
      }
      var getT3 = function () {
        that.positions['T3'].forEach(function (player) {
          if ((player.Position === "WR" || player.Position === "TE") && (player["Game Info"] === that.lineup.T1["Game Info"] ||
            player["Game Info"] === that.lineup.T2["Game Info"])) {
            that.lineup.T3 = player;
            playerIds.push(that.lineup.T3.ID);
            playerNames.push(that.lineup.T3.Name);
            that.shuffleArray(that.positions['T3'])
            return getT4();
          }
        });
        if (!that.lineup.T3) {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T3'].length));
          if (!that.positions['T3'][index].ID) {
            return that.generate();
          }
          that.lineup.T3 = that.positions['T3'][index];
          playerIds.push(that.lineup.T3.ID);
          playerNames.push(that.lineup.T3.Name);
          getT4();
        }

      }
      var getT4 = function () {
        that.positions['T4'].forEach(function (player) {
          if ((player.Position === "WR" || player.Position === "TE") && (player["Game Info"] === that.lineup.T1["Game Info"] ||
            player["Game Info"] === that.lineup.T2["Game Info"])) {
            that.lineup.T4 = player;
            playerIds.push(that.lineup.T4.ID);
            playerNames.push(that.lineup.T4.Name);
            that.shuffleArray(that.positions['T4'])
            return getT5();
          }
        });
        if (!that.lineup.T4) {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T4'].length));
          if (!that.positions['T4'][index].ID) {
            return that.generate();
          }
          that.lineup.T4 = that.positions['T4'][index];
          playerIds.push(that.lineup.T4.ID);
          playerNames.push(that.lineup.T4.Name);
          getT5();
        }
      }
      var getT5 = function () {
        that.positions['T5'].forEach(function (player) {
          if ((player.Position === "WR" || player.Position === "TE") && (player["Game Info"] === that.lineup.T1["Game Info"] ||
            player["Game Info"] === that.lineup.T2["Game Info"])) {
            that.lineup.T5 = player;
            playerIds.push(that.lineup.T5.ID);
            playerNames.push(that.lineup.T5.Name);
            that.shuffleArray(that.positions['T5'])
            return getT6();
          }
        });
        if (!that.lineup.T5) {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T5'].length));
          if (!that.positions['T5'][index].ID) {
            return that.generate();
          }
          that.lineup.T5 = that.positions['T5'][index];
          playerIds.push(that.lineup.T5.ID);
          playerNames.push(that.lineup.T5.Name);
          getT6();
        }
      }
      var getT6 = function () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['T6'].length));
        if (!that.positions['T6'][index].ID) {
          return that.generate();
        }
        that.lineup.T6 = that.positions['T6'][index];
        playerIds.push(that.lineup.T6.ID);
        playerNames.push(that.lineup.T6.Name);
        getT7();
      }
      var getT7 = function () {
        that.positions['T7'].forEach(function (player) {
          if ((player.Position === "WR" || player.Position === "TE") && (player["Game Info"] === that.lineup.T1["Game Info"] ||
            player["Game Info"] === that.lineup.T2["Game Info"])) {
            that.lineup.T7 = player;
            playerIds.push(that.lineup.T7.ID);
            playerNames.push(that.lineup.T7.Name);
            that.shuffleArray(that.positions['T7'])
            return getT8()
          }
        });
        if (!that.lineup.T7) {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T7'].length));
          if (!that.positions['T7'][index].ID) {
            return that.generate()
          }
          that.lineup.T7 = that.positions['T7'][index];
          playerIds.push(that.lineup.T7["Game Info"]);
          playerNames.push(that.lineup.T7.Name);
          getT8()
        }
      }
      var getT8 = function () {
        that.positions['T8'].forEach(function (player) {
          if ((player.Position === "WR" || player.Position === "TE") && (player["Game Info"] === that.lineup.T1["Game Info"] ||
            player["Game Info"] === that.lineup.T2["Game Info"])) {
            that.lineup.T8 = player;
            playerIds.push(that.lineup.T8.ID);
            playerNames.push(that.lineup.T8.Name);
            that.shuffleArray(that.positions['T8'])
            return validateLineup()
          }
        });
        if (!that.lineup.T8) {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T8'].length));
          if (!that.positions['T8'][index].ID) {
            return that.generate();
          }
          that.lineup.T8 = that.positions['T8'][index];
          playerIds.push(that.lineup.T8.ID);
          playerNames.push(that.lineup.T8.Name);
        }
        validateLineup();
      }

      var validateLineup = function () {
        let lineup = {
          'T1': that.lineup.T1.Name + " " + that.lineup.T1['TeamAbbrev'],
          'T2': that.lineup.T2.Name + " " + that.lineup.T2['TeamAbbrev'],
          'T3': that.lineup.T3.Name + " " + that.lineup.T3['TeamAbbrev'],
          'T4': that.lineup.T4.Name + " " + that.lineup.T4['TeamAbbrev'],
          'T5': that.lineup.T5.Name + " " + that.lineup.T5['TeamAbbrev'],
          'T6': that.lineup.T6.Name + " " + that.lineup.T6['TeamAbbrev'],
          'T7': that.lineup.T7.Name + " " + that.lineup.T7['TeamAbbrev'],
          'T8': that.lineup.T8.Name + " " + that.lineup.T8['TeamAbbrev'],
        }
        that.calculateExposure(that.lineup.T1.Name)
        that.calculateExposure(that.lineup.T2.Name)
        that.calculateExposure(that.lineup.T3.Name)
        that.calculateExposure(that.lineup.T4.Name)
        that.calculateExposure(that.lineup.T5.Name)
        that.calculateExposure(that.lineup.T6.Name)
        that.calculateExposure(that.lineup.T7.Name)
        that.calculateExposure(that.lineup.T8.Name)
        that.lineups.unshift(lineup);
        lineup = {
          'T1': that.lineup.T1.ID,
          'T2': that.lineup.T2.ID,
          'T3': that.lineup.T3.ID,
          'T4': that.lineup.T4.ID,
          'T5': that.lineup.T5.ID,
          'T6': that.lineup.T6.ID,
          'T7': that.lineup.T7.ID,
          'T8': that.lineup.T8.ID
        };
        that.fullLineups.unshift(lineup);
        that.lineup = {
          'T1': null,
          'T2': null,
          'T3': null,
          'T4': null,
          'T5': null,
          'T6': null,
          'T7': null,
          'T8': null
        }
      }
      getT1();
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.body {
  display: flex;
  justify-content: center;
  margin-top: 30px;
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
  margin-top: 7vh;
  margin: 3%;
}
</style>