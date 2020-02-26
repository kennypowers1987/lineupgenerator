<template>
  <div class="parse">
    <common-header
      site="Yahoo"
      contest="UCL"
    />
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
    <div class="body" />
    <b-tabs v-if="playersList">
      <b-tab
        title="All Players"
        active
      >
        <span class="float-right">
          <b-button
            :variant="theme"
            download
            class="badge badge-info"
            @click="savePlayersList"
          >
            Download This Player List
          </b-button>
          <b-button class="badge badge-danger">
            Remove Selected Players
          </b-button>
        </span>
        <b-table
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
              class="badge badge-danger"
              @click.stop="removePlayer(playersList[row.index])"
            >
              Remove
            </b-button>
            <b-button
              size="sm"
              class="badge badge-success"
              @click.stop="addPlayer(playersList[row.index])"
            >
              Increase Exposure
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
      <b-tab title="Lineups">
        <b-row>
          <b-col sm="2">
            <b-input-group prepend="#">
              <b-form-input
                v-model.number="progress.numberToGenerate"
                type="number"
                placeholder="enter the number of lineups to generate"
              />
              <b-input-group-append>
                <b-btn
                  :variant="theme"
                  @click="generate()"
                >
                  Generate
                </b-btn>
              </b-input-group-append>
            </b-input-group>
          </b-col>
          <b-col sm="10">
            <b-button
              :variant="theme"
              class="float-right"
              download
              @click="save"
            >
              Download {{ lineups.length }} Lineups
            </b-button>
            <b-button
              variant="danger"
              class="float-right"
              download
              @click="clearLineups"
            >
              Clear
            </b-button>
          </b-col>
        </b-row>
        <b-progress
          v-if="showSpinner.on"
          class="generate-progress-bar"
          :value="progress.totalLineups"
          :max="progress.numberToGenerate"
          show-progress
          animated
        />

        <b-table
          v-if="lineups.length"
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
  Name: 'yahoo',
  data () {
    return {
      playersList: null,
      theme: Vue.localStorage.get("theme"),
      playersListFields: [],
      file: {},
      team: {},
      teams: {},
      position: {},
      positions: {},
      lineups: [],
      fullLineups: [],
      showSpinner: {
        on: false
      },
      generateCount: 0,
      progress: {
        numberToGenerate: 10,
        totalLineups: 0
      },
      lineup: {
        'F': null,
        'F2': null,
        'M': null,
        'M2': null,
        'M3': null,
        'M4': null,
        'D': null,
        'D2': null,
        'D3': null,
        'UTIL': null,
        'GK': null,
        'Total Salary': null
      }
    }
  },
  created () {
    this.$bus.$on("theme-changed", () => {
      this.updateTheme();
    });
  },
  methods: {
    drawTeams () {
      this.teams = this.groupBy(this.playersList, "Team");
      delete this.teams["undefined"];
    },
    drawPositions () {
      this.positions = this.groupBy(this.playersList, "Position");
    },
    clearLineups () {
      this.lineups = [];
      this.fulllineups = [];
    },
    calculateExposures () {
      var that = this;
      let qbCount = 0;
      let rbCount = 0;
      let wrCount = 0;
      let teCount = 0;
      let dstCount = 0;
      this.playersList.forEach(function (player) {
        qbCount += player.Position === "QB" ? 1 : 0;
        rbCount += player.Position === "RB" ? 1 : 0;
        wrCount += player.Position === "WR" ? 1 : 0;
        teCount += player.Position === "TE" ? 1 : 0;
        dstCount += player.Position === "DEF" ? 1 : 0;
      });
      this.playersList.forEach(function (player) {
        player.Exposure = that.playersList.reduce(function (r, a) {
          if (player.Position === "QB") {
            return r + +(a.ID === player.ID) / qbCount;
          }
          if (player.Position === "RB") {
            return r + +(a.ID === player.ID) / rbCount;
          }
          if (player.Position === "WR") {
            return r + +(a.ID === player.ID) / wrCount;
          }
          if (player.Position === "TE") {
            return r + +(a.ID === player.ID) / teCount;
          }
          if (player.Position === "DEF") {
            return r + +(a.ID === player.ID) / dstCount;
          }
        }, 0);

      });
      this.playersList.forEach(function (player) {
        if (player.Exposure) {
          player.Exposure = parseFloat(player.Exposure).toFixed(3);
        }
      }, 0);
    },
    removePlayer (player) {
      let id = player.ID;
      this.playersList = this.playersList.filter(function (player) {
        return player.ID !== id;
      });
      this.drawTeams();
      this.drawPositions();
      this.calculateExposures();
    },
    addPlayer (player) {
      this.playersList.push(player);
      this.teams = this.groupBy(this.playersList, "Team");
      delete this.teams["undefined"];
      this.positions = this.groupBy(this.playersList, "Position");
      this.calculateExposures();
    },
    upload () {
      let that = this;
      let fileToLoad = that.file;
      const reader = new FileReader();
      reader.onload = fileLoadedEvent => {
        Papa.parse(fileLoadedEvent.target.result, {
          header: true,
          complete (results) {
            that.playersList = results.data;
            that.calculateExposures();
            that.playersListFields = Object.keys(that.playersList[0]).map(str => {
              return {
                key: str,
                sortable: true
              }
            });
            that.playersListFields.push('delete_btn');
            that.drawTeams();
            that.drawPositions();
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
      FileSaver.saveAs(blob, 'yahoo .csv');
    },
    savePlayersList () {
      const blob = new Blob([this.parseJSONtoCSV(this.playersList)], {
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
    },
    setTeam (team) {
      this.team = this.teams[team];
    },
    setPosition (pos) {
      this.position = this.positions[pos];
    },

    generate () {
      this.showSpinner.on = true;
      let that = this;
      let playerIds = [];

      function getF () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['F'].length - 1));
        that.lineup.F = that.positions['F'][index];
        playerIds.push(that.lineup.F.ID);
        getF2();

      }

      function getF2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['F'].length));
        that.lineup.F2 = that.positions['F'][index];
        playerIds.push(that.lineup.F2.ID);
        getM();
      }

      function getM () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['M'].length));
        that.lineup.M = that.positions['M'][index];
        playerIds.push(that.lineup.M.ID);
        getM2();
      }

      function getM2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['M'].length));
        that.lineup.M2 = that.positions['M'][index];
        playerIds.push(that.lineup.M2.ID);
        getM3();
      }

      function getM3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['M'].length));
        that.lineup.M3 = that.positions['M'][index];
        playerIds.push(that.lineup.M3.ID);
        getM4();
      }

      function getM4 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['M'].length));
        that.lineup.M4 = that.positions['M'][index];
        playerIds.push(that.lineup.M4.ID);
        getD();
      }

      function getD () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['D'].length));
        that.lineup.D = that.positions['D'][index];
        playerIds.push(that.lineup.D.ID);
        getD2();
      }

      function getD2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['D'].length));
        that.lineup.D2 = that.positions['D'][index];
        playerIds.push(that.lineup.D2.ID);
        getD3();
      }

      function getD3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['D'].length));
        that.lineup.D3 = that.positions['D'][index];
        playerIds.push(that.lineup.D3.ID);
        getUTIL();
      }

      function getUTIL () {
        let curPositions = that.groupBy(that.playersList, "Position");
        let index = Math.floor(Math.random() * Math.floor(curPositions['F'].length));
        that.lineup.UTIL = curPositions['F'][index];
        playerIds.push(that.lineup.UTIL.ID);
        getGK();
      }

      function getGK () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['GK'].length));
        that.lineup.GK = that.positions['GK'][index];
        playerIds.push(that.lineup.GK.ID);
        validateLineup();
      }

      function validateLineup () {
        function removeDuplicate (arr) {
          let c;
          let len = arr.length;
          let result = [];
          let obj = {};
          for (c = 0; c < len; c++) {
            obj[arr[c]] = 0;
          }
          for (c in obj) {
            result.push(c);
          }
          return result;
        }

        let tooManyPlayersVsGoalie = false;

        let gKteam = that.lineup['GK'].Team;

        const forwardsAndMidfieldersVsGoalie = Object.values(that.lineup).filter((p) => {
          if (p && p.Position) {
            return ((p.Position === 'M' && p.Opponent === gKteam) || (p.Position === 'F' && p.Opponent === gKteam))
          }
        })

        if(forwardsAndMidfieldersVsGoalie.length > 1){
          tooManyPlayersVsGoalie = true;
        }

        console.log(gKteam, forwardsAndMidfieldersVsGoalie)


        let checkDupes = removeDuplicate(playerIds);
        let totalSalary =
          parseInt(that.lineup.F.Salary) +
          parseInt(that.lineup.F2.Salary) +
          parseInt(that.lineup.M.Salary) +
          parseInt(that.lineup.M2.Salary) +
          parseInt(that.lineup.M3.Salary) +
          parseInt(that.lineup.M4.Salary) +
          parseInt(that.lineup.D.Salary) +
          parseInt(that.lineup.D2.Salary) +
          parseInt(that.lineup.D3.Salary) +
          parseInt(that.lineup.UTIL.Salary) +
          parseInt(that.lineup.GK.Salary);

        if (checkDupes.length < 11) {
          console.log('dupes')
          return setTimeout(() => {
            that.generate();
          }, 0);

        } else if (totalSalary < 190) {
          console.log('totalSalary min')
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 200) {
          console.log('total salary max')
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (tooManyPlayersVsGoalie) {
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        else {
          that.lineup['Total Salary'] = totalSalary;
          let lineup = {
            'F': that.lineup.F['ID + Name'] + " " + that.lineup.F['Team'] + " " + '$' + that.lineup.F['Salary'],
            'F2': that.lineup.F2['ID + Name'] + " " + that.lineup.F2['Team'] + " " + '$' + that.lineup.F2['Salary'],
            'M': that.lineup.M['ID + Name'] + " " + that.lineup.M['Team'] + " " + '$' + that.lineup.M['Salary'],
            'M2': that.lineup.M2['ID + Name'] + " " + that.lineup.M2['Team'] + " " + '$' + that.lineup.M2['Salary'],
            'M3': that.lineup.M3['ID + Name'] + " " + that.lineup.M3['Team'] + " " + '$' + that.lineup.M3['Salary'],
            'M4': that.lineup.M4['ID + Name'] + " " + that.lineup.M4['Team'] + " " + '$' + that.lineup.M4['Salary'],
            'D': that.lineup.D['ID + Name'] + " " + that.lineup.D['Team'] + " " + '$' + that.lineup.D['Salary'],
            'D2': that.lineup.D2['ID + Name'] + " " + that.lineup.D2['Team'] + " " + '$' + that.lineup.D2[
              'Salary'],
            'D3': that.lineup.D3['ID + Name'] + " " + that.lineup.D3['Team'] + " " + '$' + that.lineup.D3['Salary'],
            'UTIL': that.lineup.UTIL['ID + Name'] + " " + that.lineup.UTIL['Team'] + " " + '$' + that.lineup.UTIL['Salary'],
            'GK': that.lineup.GK['ID + Name'] + " " + that.lineup.GK['Team'] + " " + '$' + that.lineup.GK['Salary'],
            'Total Salary': totalSalary
          }

          that.lineups.unshift(lineup);
          setTimeout(() => {
            that.progress.totalLineups++;
            if (that.progress.totalLineups >= that.progress.numberToGenerate) {
              that.progress.totalLineups = 0;
              return that.showSpinner.on = false;
            } else {
              setTimeout(() => {
                that.generate();
              }, 0);
            }
          }, 0);



          lineup = {
            'F': that.lineup.F.ID,
            'F2': that.lineup.F2.ID,
            'M': that.lineup.M.ID,
            'M2': that.lineup.M2.ID,
            'M3': that.lineup.M3.ID,
            'M4': that.lineup.M4.ID,
            'D': that.lineup.D.ID,
            'D2': that.lineup.D2.ID,
            'D3': that.lineup.D3.ID,
            'UTIL': that.lineup.UTIL.ID,
            'GK': that.lineup.GK.ID
          };
          that.fullLineups.unshift(lineup);
        }
      }
      getF();

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