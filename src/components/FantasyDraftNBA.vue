<template>
  <div class="parse">
    <common-header
      site="Fantasy Draft"
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
  Name: 'fantasydraftnba',
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
        'G1': null,
        'G2': null,
        'G3': null,
        'FC1': null,
        'FC2': null,
        'FC3': null,
        'UTIL1': null,
        'UTIL2': null,       
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
      this.positions = this.groupBy(this.playersList, "Roster Position");
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
      this.drawPositions();      
    },
    addPlayer (player) {
      this.playersList.push(player);
      this.teams = this.groupBy(this.playersList, "Team");
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
            that.playersList = results.data;
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
      function getG1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['G'].length - 1));
        that.lineup.G1 = that.positions['G'][index];
        playerIds.push(that.lineup.G1.ID);
        getG2();
      }

      function getG2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['G'].length));
        that.lineup.G2 = that.positions['G'][index];
        playerIds.push(that.lineup.G2.ID);
        getG3();
      }

      function getG3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['G'].length));
        that.lineup.G3 = that.positions['G'][index];
        playerIds.push(that.lineup.G3.ID);
        getFC1();
      }

      function getFC1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['FC'].length));
        that.lineup.FC1 = that.positions['FC'][index];
        playerIds.push(that.lineup.FC1.ID);
        getFC2();
      }

      function getFC2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['FC'].length));
        that.lineup.FC2 = that.positions['FC'][index];
        playerIds.push(that.lineup.FC2.ID);
        getFC3();
      }

      function getFC3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['FC'].length));
        that.lineup.FC3 = that.positions['FC'][index];
        playerIds.push(that.lineup.FC3.ID);
        getUTIL1();
      }

      function getUTIL1 () {        
        let curPositions = that.groupBy(that.playersList, "Roster Position");
        let index = Math.floor(Math.random() * Math.floor(curPositions['FC'].length));
        that.lineup.UTIL1 = curPositions['FC'][index];
        playerIds.push(that.lineup.UTIL1.ID);
        getUTIL2();
      }

      function getUTIL2 () {        
        let curPositions = that.groupBy(that.playersList, "Roster Position");
        let index = Math.floor(Math.random() * Math.floor(curPositions['G'].length));
        that.lineup.UTIL2 = curPositions['G'][index];
        playerIds.push(that.lineup.UTIL2.ID);
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
        const parseSal = (currency) => {
          return Number(currency.replace(/[^0-9.-]+/g,""));
        }
        
        let totalSalary =
          parseSal(that.lineup.G1.Salary) +
          parseSal(that.lineup.G2.Salary) +
          parseSal(that.lineup.G3.Salary) +
          parseSal(that.lineup.FC1.Salary) +
          parseSal(that.lineup.FC2.Salary) +
          parseSal(that.lineup.FC3.Salary) +
          parseSal(that.lineup.UTIL1.Salary) +
          parseSal(that.lineup.UTIL2.Salary) 

        console.log(totalSalary)
        let games = Object.keys(that.lineup).map((key) => {
          if (key !== "Total Salary") {
            return that.lineup[key]['Game']
          }
        });

        let gameStacks = new Map([...new Set(games)].map(
          x => [x, games.filter(y => y === x).length]
        ));

        gameStacks = Object.fromEntries(gameStacks);
        delete gameStacks[undefined]


        console.log(gameStacks)
        that.lineup.gameStacks = Object.keys(gameStacks).map((i) => {
          if (gameStacks[i] && gameStacks[i] > 1) {           
              return i + ' : ' + gameStacks[i]
          } 
        }).filter((e) => {
          if (e) return e;
        });

        let percentNaked = (that.lineups.filter((obj) => obj['isNaked']).length) / that.lineups.length;
        if (percentNaked > .45 && that.lineup.G1['Roster Position'] === "Naked") {
          return setTimeout(() => {
            that.generate();
          }, 0);
        }
        if (that.lineup.gameStacks.length < 1) {
          console.log('gamestacks')
          console.log(that.lineup.gameStacks)
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        if (checkDupes.length < 8) {
          console.log('dupes')
          return setTimeout(() => {
            that.generate();
          }, 0);

        } else if (totalSalary < 74000) {
          console.log('totalSalMin')
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 100000) {
          console.log('totalSAlMax')
          return setTimeout(() => {
            that.generate();
          }, 0);
        }

        else {
          that.lineup['Total Salary'] = totalSalary;
          let lineup = {
            'G1': that.lineup.G1.Name + " " + that.lineup.G1['Team'] + " " + that.lineup.G1['Salary'],
            'G2': that.lineup.G2.Name + " " + that.lineup.G2['Team'] + " " + that.lineup.G2['Salary'],
            'G3': that.lineup.G3.Name + " " + that.lineup.G3['Team'] + " " + that.lineup.G3['Salary'],
            'FC1': that.lineup.FC1.Name + " " + that.lineup.FC1['Team'] + " " + that.lineup.FC1['Salary'],
            'FC2': that.lineup.FC2.Name + " " + that.lineup.FC2['Team'] + " " + that.lineup.FC2['Salary'],
            'FC3': that.lineup.FC3.Name + " " + that.lineup.FC3['Team'] + " " + that.lineup.FC3['Salary'],
            'UTIL1': that.lineup.UTIL1.Name + " " + that.lineup.UTIL1['Team'] + " " + that.lineup.UTIL1['Salary'],
            'UTIL2': that.lineup.UTIL2.Name + " " + that.lineup.UTIL2['Team'] + " " + that.lineup.UTIL2['Salary'],
            'Game Stack': that.lineup.gameStacks[0] + ' players',
            'Total Salary': totalSalary,
            'isNaked': that.lineup.G1['Roster Position'] === 'Naked' ? true : false
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
            'G1': that.lineup.G1.ID,
            'G2': that.lineup.G2.ID,
            'G3': that.lineup.G3.ID,
            'FC1': that.lineup.FC1.ID,
            'FC2': that.lineup.FC2.ID,
            'FC3': that.lineup.FC3.ID,
            'UTIL1': that.lineup.UTIL1.ID,
            'UTIL2': that.lineup.UTIL2.ID
          };
          that.fullLineups.unshift(lineup);
        }
      }
      getG1();

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