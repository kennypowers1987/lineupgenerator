<template>
  <div class="parse">
    <common-header
      site="DraftKings"
      contest="NBA Classic"
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
  Name: 'dknba',
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
        'PG': null,
        'SG': null,
        'SF': null,
        'PF': null,
        'C': null,
        'G': null,
        'F': null,
        'UTIL': null,
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
      this.teams = this.groupBy(this.playersList, "TeamAbbrev");
      delete this.teams["undefined"];
    },
    clearLineups () {
      this.lineups = [];
      this.fulllineups = [];
    },
    removePlayer (player) {
      let id = player.ID;
      this.playersList = this.playersList.filter(function (player) {
        return player.ID !== id;
      });
      this.drawTeams();
    },
    addPlayer (player) {
      this.playersList.push(player);
      this.teams = this.groupBy(this.playersList, "TeamAbbrev");
      delete this.teams["undefined"];
      this.positions = this.groupBy(this.playersList, "Position");

    },
    upload () {
      let that = this;
      let fileToLoad = that.file;
      const reader = new FileReader();
      reader.onload = fileLoadedEvent => {
        Papa.parse(fileLoadedEvent.target.result, {
          header: true,
          complete (results) {
            that.playersList = results.data.filter((player) => {
              if (player && player.AvgPointsPerGame && player.AvgPointsPerGame > 5) {
                return player;
              }
            })
            that.playersListFields = Object.keys(that.playersList[0]).map(str => {
              return {
                key: str,
                sortable: true
              }
            });
            that.playersListFields.push('delete_btn');
            that.drawTeams();
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
      function getPG () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');
        if (playersPositions.includes("PG") && randomPlayer.Salary > 4000) {
          that.lineup.PG = randomPlayer;
        } else {
          return setTimeout(() => {
            getPG();
          }, 0);
        }

        playerIds.push(that.lineup.PG.ID);
        getSG();
      }

      function getSG () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');
        if (playersPositions.includes("SG") && randomPlayer.Salary > 4000) {
          that.lineup.SG = randomPlayer;
        } else {
          return setTimeout(() => {
            getSG();
          }, 0);
        }
        playerIds.push(that.lineup.SG.ID);
        getSF();
      }

      function getSF () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("SF") && randomPlayer.Salary > 4000) {
          that.lineup.SF = randomPlayer;
        } else {
          return setTimeout(() => {
            getSF();
          }, 0);
        }

        playerIds.push(that.lineup.SF.ID);
        getPF();
      }

      function getPF () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("PF") && randomPlayer.Salary > 4000) {
          that.lineup.PF = randomPlayer;
        } else {
          return setTimeout(() => {
            getPF();
          }, 0);
        }

        playerIds.push(that.lineup.PF.ID);
        getCenter();
      }

      function getCenter () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("C") && randomPlayer.Salary > 4000) {
          that.lineup.C = randomPlayer;
        } else {
          return setTimeout(() => {
            getCenter();
          }, 0);
        }

        playerIds.push(that.lineup.C.ID);
        getGuard();
      }

      function getGuard () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("G") && randomPlayer.Salary > 4000) {
          that.lineup.G = randomPlayer;
        } else {
          return setTimeout(() => {
            getGuard();
          }, 0);
        }

        playerIds.push(that.lineup.G.ID);
        getForward();
      }

      function getForward () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("F") && randomPlayer.Salary > 4000) {
          that.lineup.F = randomPlayer;
        } else {
          return setTimeout(() => {
            getForward();
          }, 0);
        }

        playerIds.push(that.lineup.F.ID);
        getUtil();
      }

      function getUtil () {
        let index = Math.floor(Math.random() * Math.floor(that.playersList.length - 1));
        const randomPlayer = that.playersList[index];
        const playersPositions = randomPlayer['Roster Position'].split('/');

        if (playersPositions.includes("UTIL")) {
          that.lineup.UTIL = randomPlayer;
        } else {
          return setTimeout(() => {
            getUtil();
          }, 0);
        }

        playerIds.push(that.lineup.UTIL.ID);
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
          parseInt(that.lineup.PG.Salary) +
          parseInt(that.lineup.SG.Salary) +
          parseInt(that.lineup.SF.Salary) +
          parseInt(that.lineup.PF.Salary) +
          parseInt(that.lineup.C.Salary) +
          parseInt(that.lineup.G.Salary) +
          parseInt(that.lineup.F.Salary) +
          parseInt(that.lineup.UTIL.Salary)

        let games = Object.keys(that.lineup).map((key) => {
          if (key !== "Total Salary") {
            return that.lineup[key]['Game Info']
          }
        });

        let gameStacks = new Map([...new Set(games)].map(
          x => [x, games.filter(y => y === x).length]
        ));

        gameStacks = Object.fromEntries(gameStacks);
        delete gameStacks[undefined]

        that.lineup.gameStacks = Object.keys(gameStacks).map((i) => {
          if (gameStacks[i] && gameStacks[i] > 2) {
            return i + ' : ' + gameStacks[i]
          }
        }).filter((e) => {
          if (e) return e;
        });

        if (that.lineup.gameStacks.length < 1) {
          console.log('Failing Game Stacks')
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        if (checkDupes.length < 8) {
          console.log('Failing Dupes')
          return setTimeout(() => {
            that.generate();
          }, 0);

        } else if (totalSalary < 45500) {
          console.log('Failing MinSal')
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 50000) {
          console.log('Failing Max Sal')
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        else {
          that.lineup['Total Salary'] = totalSalary;
          let lineup = {
            'PG': that.lineup.PG.Name + " " + that.lineup.PG['TeamAbbrev'] + " " + that.lineup.PG['Salary'],
            'SG': that.lineup.SG.Name + " " + that.lineup.SG['TeamAbbrev'] + " " + that.lineup.SG['Salary'],
            'SF': that.lineup.SF.Name + " " + that.lineup.SF['TeamAbbrev'] + " " + that.lineup.SF['Salary'],
            'PF': that.lineup.PF.Name + " " + that.lineup.PF['TeamAbbrev'] + " " + that.lineup.PF['Salary'],
            'C': that.lineup.C.Name + " " + that.lineup.C['TeamAbbrev'] + " " + that.lineup.C['Salary'],
            'G': that.lineup.G.Name + " " + that.lineup.G['TeamAbbrev'] + " " + that.lineup.G['Salary'],
            'F': that.lineup.F.Name + " " + that.lineup.F['TeamAbbrev'] + " " + that.lineup.F['Salary'],
            'UTIL': that.lineup.UTIL.Name + " " + that.lineup.UTIL['TeamAbbrev'] + " " + that.lineup.UTIL[
              'Salary'],
            'Game Stack': that.lineup.gameStacks[0] + ' players',
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
            'PG': that.lineup.PG.ID,
            'SG': that.lineup.SG.ID,
            'SF': that.lineup.SF.ID,
            'PF': that.lineup.PF.ID,
            'C': that.lineup.C.ID,
            'G': that.lineup.G.ID,
            'F': that.lineup.F.ID,
            'UTIL': that.lineup.UTIL.ID
          };
          that.fullLineups.unshift(lineup);
        }
      }
      getPG();

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