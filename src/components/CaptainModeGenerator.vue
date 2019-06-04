<template>
  <div class="parse">
    <h5>DraftKings 'Captain Mode' Lineup Generator
      <b-btn size="sm" variant="danger"
        v-b-popover.hover="'Import the .csv for your contest , remove players you dislike, navigate to the lineups tab and start generating!'"
        title="Instructions">
        ?
      </b-btn>
      <!-- <h5 class="float-right" style="padding:10px;">
        <a href="https://neocities.org/site/lineupgenerator">Donate if you win </a>
      </h5> -->
    </h5>
    <section v-if="!playersList">
      <label>
        <strong>
          Import Your Player Pool (download .csv from DraftKings)
        </strong>
      </label>
      <br>
      <input id="fileInput" type="file" @change="upload" v-bind:variant="theme">
    </section>



    <div class="body">
    </div>
    <b-tabs v-if="playersList">
      <b-tab title="All Players" active>
        <b-button size="sm" class="float-right" @click='savePlayersList' variant='outline-dark' download>
          Download Player List
        </b-button>
        <b-table striped hover :items="playersList" :fields="playersListFields">
          <template slot="delete_btn" slot-scope="row">
            <b-button size="sm" @click.stop="removePlayer(playersList[row.index])" class="btn btn-danger">
              Remove
            </b-button>
          </template>
        </b-table>
      </b-tab>
      <b-tab title="Players By Team">
        <div class="alert alert-light">
          <b-btn variant="link" size="sm" v-for="team in Object.keys(teams).sort()" @click="setTeam(team)">
            {{team}}
          </b-btn>
        </div>
        <b-table striped hover :items="team" :fields="playersListFields" v-if="team.length"></b-table>
      </b-tab>
      <b-tab title="Players By Position">
        <div class="alert alert-light">
          <b-btn size="sm" variant="link" v-for="position in Object.keys(positions)" @click="setPosition(position)">
            {{position}}
          </b-btn>
        </div>
        <b-table striped hover :items="position" :fields="playersListFields" v-if="position.length"></b-table>
      </b-tab>
      <b-tab title="Lineups">
        <b-button @click='save' size="sm" variant="outline-dark" download>
          Download {{lineups.length}} Lineups
        </b-button>

        <b-btn variant="outline-success" size="sm" class='float-right' @click="generate()">Generate</b-btn>

        <b-table striped hover :items="lineups" v-if="lineups.length"></b-table>

      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
  import Vue from "vue";
  import VueLocalStorage from "vue-localstorage";
  import {
    EventBus
  } from "../utils/myEventBus";
  import Papa from 'papaparse';
  import Blob from 'blob';
  import FileSaver from 'file-saver';
  Vue.use(VueLocalStorage);
  export default {
    name: 'captainmode',
    data() {
      return {
        selectedUTIL: 'RB',
        playersList: null,
        theme: Vue.localStorage.get("theme"),
        playersListFields: [],
        team: {},
        teams: {},
        position: {},
        positions: {},
        lineups: [],
        fullLineups: [],
        lineup: {
          'CPT': null,
          'UTIL1': null,
          'UTIL2': null,
          'UTIL3': null,
          'UTIL4': null,
          'UTIL5': null,
          'Total Salary': null
        }
      }
    },
    created() {
      this.$bus.$on("theme-changed", $event => {
        this.updateTheme();
      });
    },
    methods: {
      drawTeams() {
        this.teams = this.groupBy(this.playersList, "TeamAbbrev");
      },
      drawPositions() {
        this.positions = this.groupBy(this.playersList, "Roster Position");
      },
      removePlayer(player) {
        var id = player.ID

        this.playersList = this.playersList.filter(function (player) {
          return player.ID !== id;
        });
        this.drawTeams();
        this.drawPositions();
      },
      upload(e) {
        var that = this;
        const fileToLoad = event.target.files[0]
        const reader = new FileReader()
        reader.onload = fileLoadedEvent => {
          Papa.parse(fileLoadedEvent.target.result, {
            header: true,
            complete(results) {
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
            error(errors) {
              console.log('error', errors)
            }
          })
        }
        reader.readAsText(fileToLoad)
      },
      save() {
        const blob = new Blob([this.parseJSONtoCSV(this.fullLineups)], {
          type: 'text/csv'
        })
        FileSaver.saveAs(blob, 'DK' + new Date() + '.csv')
        alert(
          "In the downloaded .csv, change the headers to 'CPT, UTIL, UTIL, UTIL, UTIL, UTIL, UTIL' or you won't be able to upload it to DraftKings."
        )
      },
      savePlayersList() {
        const blob = new Blob([this.parseJSONtoCSV(this.playersList)], {
          type: 'text/csv'
        })
        FileSaver.saveAs(blob, 'DK' + new Date() + '.csv')

      },
      parseJSONtoCSV(table) {
        return Papa.unparse(table)
      },
      updateTheme() {
        this.theme = Vue.localStorage.get("theme");
      },
      groupBy(arr, property) {
        return arr.reduce((arr, x) => {
          if (!arr[x[property]]) {
            arr[x[property]] = [];
          }
          arr[x[property]].push(x);
          return arr;
        }, {});
      },
      setTeam(team) {
        this.team = this.teams[team];
      },
      setPosition(pos) {
        this.position = this.positions[pos];
      },
      generate() {
        var that = this;
        var playerIds = [];
        var playerNames = [];

        function getCaptain() {
          //console.log('getting CPT')
          let index = Math.floor(Math.random() * Math.floor(that.positions['CPT'].length - 1));
          //that.lineup.QB = (({ Name, Salary, Position }) => ({ Name, Salary, Position }))(that.positions['QB'][index])
          that.lineup.CPT = that.positions['CPT'][index];
          playerIds.push(that.lineup.CPT.ID);
          playerNames.push(that.lineup.CPT.Name);
          getUTIL1();
        }

        function getUTIL1() {
          //console.log('getting UTIL1')
          let index = Math.floor(Math.random() * Math.floor(that.positions['UTIL'].length - 1));
          that.lineup.UTIL1 = that.positions['UTIL'][index];
          playerIds.push(that.lineup.UTIL1.ID);
          playerNames.push(that.lineup.UTIL1.Name);
          console.log(that.lineup);
          getUTIL2();
        }
        function getUTIL2() {
          //console.log('getting UTIL2')
          let index = Math.floor(Math.random() * Math.floor(that.positions['UTIL'].length - 1));
          that.lineup.UTIL2 = that.positions['UTIL'][index];
          playerIds.push(that.lineup.UTIL2.ID);
          playerNames.push(that.lineup.UTIL2.Name);
          console.log(that.lineup);
          getUTIL3();
        }
        function getUTIL3() {
          //console.log('getting UTIL3')
          let index = Math.floor(Math.random() * Math.floor(that.positions['UTIL'].length - 1));
          that.lineup.UTIL3 = that.positions['UTIL'][index];
          playerIds.push(that.lineup.UTIL3.ID);
          playerNames.push(that.lineup.UTIL3.Name);
          console.log(that.lineup);
          getUTIL4();
        }
        function getUTIL4() {
          //console.log('getting UTIL4')
          let index = Math.floor(Math.random() * Math.floor(that.positions['UTIL'].length - 1));
          that.lineup.UTIL4 = that.positions['UTIL'][index];
          playerIds.push(that.lineup.UTIL4.ID);
          playerNames.push(that.lineup.UTIL4.Name);
          console.log(that.lineup);
          getUTIL5();
        }
        function getUTIL5() {
          //console.log('getting UTIL5')
          let index = Math.floor(Math.random() * Math.floor(that.positions['UTIL'].length - 1));
          that.lineup.UTIL5 = that.positions['UTIL'][index];
          playerIds.push(that.lineup.UTIL5.ID);
          playerNames.push(that.lineup.UTIL5.Name);
          console.log(that.lineup);
          validateLineup();
        }

        function validateLineup() {
          function removeDuplicate(arr) {
            var c;
            var len = arr.length;
            var result = [];
            var obj = {};
            for (c = 0; c < len; c++) {
              obj[arr[c]] = 0;
            }
            for (c in obj) {
              result.push(c);
            }
            return result;
          }
          var checkDupes = removeDuplicate(playerNames);
          var totalSalary =
            parseInt(that.lineup.CPT.Salary) +
            parseInt(that.lineup.UTIL1.Salary) +
            parseInt(that.lineup.UTIL2.Salary) +
            parseInt(that.lineup.UTIL3.Salary) +
            parseInt(that.lineup.UTIL4.Salary) +
            parseInt(that.lineup.UTIL5.Salary)

          console.log('$' + totalSalary)
          if (checkDupes.length < 6) {
            console.log('dupes exist, restarting ', checkDupes.length);
            return setTimeout(() => {
              that.generate();
            }, 0);

          } else if (totalSalary < 49000) {
            console.log('salary cap expectations not met ', totalSalary);
            return setTimeout(() => {
              that.generate();
            }, 0);
          } else if (totalSalary > 50000) {
            console.log('salary cap expectations not met ', totalSalary);
            return setTimeout(() => {
              that.generate();
            }, 0);
          } else {
            that.lineup['Total Salary'] = totalSalary;
            let lineup = {
              'CPT': that.lineup.CPT.Name + " " + that.lineup.CPT['TeamAbbrev'] + " " + that.lineup.CPT['Salary'],
              'UTIL1': that.lineup.UTIL1.Name + " " + that.lineup.UTIL1['TeamAbbrev'] + " " + that.lineup.UTIL1['Salary'],
              'UTIL2': that.lineup.UTIL2.Name + " " + that.lineup.UTIL2['TeamAbbrev'] + " " + that.lineup.UTIL2['Salary'],
              'UTIL3': that.lineup.UTIL3.Name + " " + that.lineup.UTIL3['TeamAbbrev'] + " " + that.lineup.UTIL3['Salary'],
              'UTIL4': that.lineup.UTIL4.Name + " " + that.lineup.UTIL4['TeamAbbrev'] + " " + that.lineup.UTIL4['Salary'],
              'UTIL5': that.lineup.UTIL5.Name + " " + that.lineup.UTIL5['TeamAbbrev'] + " " + that.lineup.UTIL5['Salary'],
              'Total Salary': totalSalary
            }
            that.lineups.unshift(lineup);
            lineup = {
              'CPT': that.lineup.CPT.ID,
              'UTIL1': that.lineup.UTIL1.ID,
              'UTIL2': that.lineup.UTIL2.ID,
              'UTIL3': that.lineup.UTIL3.ID,
              'UTIL4': that.lineup.UTIL4.ID,
              'UTIL5': that.lineup.UTIL5.ID
            };
            that.fullLineups.unshift(lineup);

          }
        }
        getCaptain();
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .body {
    display: UTIL;
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