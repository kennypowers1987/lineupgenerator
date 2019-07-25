<template>
  <div class="parse">
    <common-header
      site="DraftKings"
      contest="NFL Classic"
    />
    <label>
      <strong>
        Import Your Player Pool
      </strong>
      <br> in the same format as the .csv download from DraftKings</label>
    <br>    
    <div>
      <!-- Styled -->
      <b-form-file
        id="fileInput"
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
            :letiant="theme"
            download
            class="badge badge-info"
            @click="savePlayersList"
          >
            Download This Player List
          </b-button>
          <b-button class="badge badge-danger">
            Remove Selected Players
          </b-button>
          <b-button class="badge badge-dark">
            Increase Selected Exposure
          </b-button>
        </span>
        <b-table
          striped
          hover
          :items="playersList"
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
            <input type="checkbox">
          </template>          
        </b-table>
      </b-tab>
      <b-tab title="Players By Team">
        <div class="alert alert-light">
          <b-btn
            v-for="team in Object.keys(teams).sort()"
            :key="team.Team"
            letiant="link"
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
            letiant="link"
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
                placeholder="Enter your name"
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
          <b-col
            sm="10"
          >
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
      lineups: [],
      fullLineups: [],
      showSpinner: {
        on: false
      },
      generateCount: 0,
      progress: {
        numberToGenerate: 1,
        totalLineups: 0
      },
      exposure: {
        QB: [],
        RB: [],
        WR: [],
        TE: [],
        DST: [],
      },
      lineup: {
        'QB': null,
        'RB1': null,
        'RB2': null,
        'WR1': null,
        'WR2': null,
        'WR3': null,
        'TE': null,
        'FLEX': null,
        'DST': null,
        'Total Salary': null
      },
      stackCount: 0,
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
        dstCount += player.Position === "DST" ? 1 : 0;
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
          if (player.Position === "DST") {
            return r + +(a.ID === player.ID) / dstCount;
          }
        }, 0);

      });
      this.playersList.forEach(function (player) {
        if (player.Exposure && player.Exposure.length > 0) {
          player.Exposure = player.Exposure.toFixed(3);
        }
      }, 0);
    },
    removePlayer (player) {
      let id = player.ID

      this.playersList = this.playersList.filter(function (player) {
        return player.ID !== id;
      });
      this.drawTeams();
      this.drawPositions();
      this.calculateExposures();
    },
    addPlayer (player) {
      this.playersList.push(player);
      this.drawTeams();
      this.drawPositions();
      this.calculateExposures();
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
            that.calculateExposures();
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
      that.stackCount = 0;
      function getQB () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['QB'].length - 1));
        //that.lineup.QB = (({ Name, Salary, Position }) => ({ Name, Salary, Position }))(that.positions['QB'][index])
        that.lineup.QB = that.positions['QB'][index];
        playerIds.push(that.lineup.QB.ID);

        getRB1();
      }

      function getRB1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['RB'].length));
        that.lineup.RB1 = that.positions['RB'][index];
        playerIds.push(that.lineup.RB1.ID);
        if (that.lineup.RB1['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getRB2();
      }

      function getRB2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['RB'].length));
        that.lineup.RB2 = that.positions['RB'][index];
        playerIds.push(that.lineup.RB2.ID);
        if (that.lineup.RB2['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getWR1();
      }

      function getWR1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length));
        that.lineup.WR1 = that.positions['WR'][index];
        playerIds.push(that.lineup.WR1.ID);
        if (that.lineup.WR1['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getWR2();
      }

      function getWR2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length));
        that.lineup.WR2 = that.positions['WR'][index];
        playerIds.push(that.lineup.WR2.ID);
        if (that.lineup.WR2['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getWR3();
      }

      function getWR3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length));
        that.lineup.WR3 = that.positions['WR'][index];
        playerIds.push(that.lineup.WR3.ID);
        if (that.lineup.WR3['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getTE();
      }

      function getTE () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['TE'].length));
        that.lineup.TE = that.positions['TE'][index];
        playerIds.push(that.lineup.TE.ID);
        if (that.lineup.TE['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getFLEX();
      }

      function getFLEX () {
        let index = Math.floor(Math.random() * 10) + 1
        if (index == (1 || 2 || 3)
        ) {
          that.selectedFlex = 'WR'
        }

        if (index == (4 || 5)) {
          that.selectedFlex = 'TE'
        }
        if (index == (6 || 7 || 8 || 9 || 10)) {
          that.selectedFlex = 'RB'
        }
        index = Math.floor(Math.random() * Math.floor(that.positions[that.selectedFlex].length));
        that.lineup.FLEX = that.positions[that.selectedFlex][index];
        playerIds.push(that.lineup.FLEX.ID);
        if (that.lineup.FLEX['Game Info'] === that.lineup.QB['Game Info']) {
          that.stackCount = that.stackCount + 1
        }
        getDST();
      }

      function getDST () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['DST'].length));
        that.lineup.DST = that.positions['DST'][index];
        playerIds.push(that.lineup.DST.ID);
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
        let checkDupes = removeDuplicate(playerIds);
        let totalSalary =
          parseInt(that.lineup.QB.Salary) +
          parseInt(that.lineup.RB1.Salary) +
          parseInt(that.lineup.RB2.Salary) +
          parseInt(that.lineup.WR1.Salary) +
          parseInt(that.lineup.WR2.Salary) +
          parseInt(that.lineup.WR3.Salary) +
          parseInt(that.lineup.TE.Salary) +
          parseInt(that.lineup.FLEX.Salary) +
          parseInt(that.lineup.DST.Salary);

        if (checkDupes.length < 9) {
          return setTimeout(() => {
            that.generate();
          }, 0);

        } else if (totalSalary < 48900) {
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 50000) {
          return setTimeout(() => {
            that.generate();
          }, 0);
        }
        else if (that.lineup.QB.Name === ("Patrick Mahomes" || "Jared Goff" || "Nick Mullens" || "Derek Carr") && that.stackCount < 3) {
          return setTimeout(() => {
            that.generate();
          }, 0);
        }
        else if (that.stackCount < 1) {
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        else {
          that.lineup['Total Salary'] = totalSalary;
          let lineup = {
            'QB': that.lineup.QB.Name + " " + that.lineup.QB['TeamAbbrev'] + " " + that.lineup.QB['Salary'],
            'RB1': that.lineup.RB1.Name + " " + that.lineup.RB1['TeamAbbrev'] + " " + that.lineup.RB1['Salary'],
            'RB2': that.lineup.RB2.Name + " " + that.lineup.RB2['TeamAbbrev'] + " " + that.lineup.RB2['Salary'],
            'WR1': that.lineup.WR1.Name + " " + that.lineup.WR1['TeamAbbrev'] + " " + that.lineup.WR1['Salary'],
            'WR2': that.lineup.WR2.Name + " " + that.lineup.WR2['TeamAbbrev'] + " " + that.lineup.WR2['Salary'],
            'WR3': that.lineup.WR3.Name + " " + that.lineup.WR3['TeamAbbrev'] + " " + that.lineup.WR3['Salary'],
            'TE': that.lineup.TE.Name + " " + that.lineup.TE['TeamAbbrev'] + " " + that.lineup.TE['Salary'],
            'FLEX': that.lineup.FLEX.Name + " " + that.lineup.FLEX['TeamAbbrev'] + " " + that.lineup.FLEX[
              'Salary'],
            'DST': that.lineup.DST.Name + " " + that.lineup.DST['TeamAbbrev'] + " " + that.lineup.DST['Salary'],
            'Total Salary': totalSalary
          }

          that.lineups.unshift(lineup);
          setTimeout(() => {
            that.progress.totalLineups++;
            if (that.progress.totalLineups >= that.progress.numberToGenerate) {
              that.progress.totalLineups = 0;
              console.log(that.lineups);
              return that.showSpinner.on = false;
            } else {
              setTimeout(() => {
                that.generate();
              }, 0);
            }
          }, 0);



          lineup = {
            'QB': that.lineup.QB.ID,
            'RB1': that.lineup.RB1.ID,
            'RB2': that.lineup.RB2.ID,
            'WR1': that.lineup.WR1.ID,
            'WR2': that.lineup.WR2.ID,
            'WR3': that.lineup.WR3.ID,
            'TE': that.lineup.TE.ID,
            'FLEX': that.lineup.FLEX.ID,
            'DST': that.lineup.DST.ID,
          };
          that.fullLineups.unshift(lineup);
        }
      }
      getQB();

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