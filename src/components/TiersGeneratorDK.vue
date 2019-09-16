<template>
  <div class="parse">
    <h5>
      DraftKings 'Tiers' NFL Lineup Generator
      <b-btn
        v-b-popover.hover="'Import the .csv for your contest , remove players you dislike, and start generating!'"
        variant="danger"
        title="Instructions"
      >
        ?
      </b-btn>
      <h5
        class="float-right"
        style="padding:10px;"
      >
        <a href="https://neocities.org/site/lineupgenerator">Donate if you win </a>
      </h5>
    </h5>
    <div class="alert alert-info">
      <br>Import the player list .csv for your contest below (download the .csv from DK/FanDuel)
      <br>Remove players that you don't want in your player pool (exposure coming soon, for now, modify the .csv to
      increase
      exposure to players you like)
      <br>Go to the Lineups tab and start generating lineups
      <br>Export your lineups by clicking 'Download', modify the headers manually, and import them into DraftKings or
      FanDuel
    </div>
    <label>
      <strong>
        Import Your Player Pool
      </strong>
      <br> in the same format as the .csv download from DraftKings</label>
    <br>
    <input
      id="fileInput"
      type="file"
      :variant="theme"
      @change="upload"
    >

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

        <h5 v-if="lineups.length">
          Lineups
        </h5>
        <b-table
          v-if="lineups.length"
          striped
          hover
          :items="lineups"
        />
        <h5 v-if="lineups.length">
          Exposure
        </h5>
        <pre v-if="lineups.length">{{ exposures }}</pre>
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
    name: 'Tiers',
    data() {
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
      shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var temp = array[i];
          array[i] = array[j];
          array[j] = temp;
        }
      },
      calculateExposure(id) {
        var that = this;
        if (!that.counts[id]) {
          that.counts[id] = 1
        }
        else {
          that.counts[id] = that.counts[id] + 1
        }
        that.exposures[id] = ((that.counts[id] / (that.lineups.length + 1)).toFixed(3)) * 100 + "%"
      },
      generate() {
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
          let index = Math.floor(Math.random() * Math.floor(that.positions['T3'].length));
          if (!that.positions['T3'][index].ID) {
            return that.generate();
          }
          that.lineup.T3 = that.positions['T3'][index];
          playerIds.push(that.lineup.T3.ID);
          playerNames.push(that.lineup.T3.Name);
          getT4();
        }
        var getT4 = function () {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T4'].length));
          if (!that.positions['T4'][index].ID) {
            return that.generate();
          }
          that.lineup.T4 = that.positions['T4'][index];
          playerIds.push(that.lineup.T4.ID);
          playerNames.push(that.lineup.T4.Name);
          getT5();
        }
        var getT5 = function () {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T5'].length));
          if (!that.positions['T5'][index].ID) {
            return that.generate();
          }
          that.lineup.T5 = that.positions['T5'][index];
          playerIds.push(that.lineup.T5.ID);
          playerNames.push(that.lineup.T5.Name);
          getT6();
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
          let index = Math.floor(Math.random() * Math.floor(that.positions['T7'].length));
          if (!that.positions['T7'][index].ID) {
            return that.generate();
          }
          that.lineup.T7 = that.positions['T7'][index];
          playerIds.push(that.lineup.T7.ID);
          playerNames.push(that.lineup.T7.Name);
          getT8();
        }
        var getT8 = function () {
          let index = Math.floor(Math.random() * Math.floor(that.positions['T8'].length));
          if (!that.positions['T8'][index].ID) {
            return that.generate();
          }
          that.lineup.T8 = that.positions['T8'][index];
          playerIds.push(that.lineup.T8.ID);
          playerNames.push(that.lineup.T8.Name);
           let games = [];
          Object.keys(that.lineup).forEach((key)=>{
            games.push(that.lineup[key]['Game Info'])
          })
          games = new Set(games);          
          if(games.size > 5) {
            return that.generate()
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