<template>
  <div class="parse">
    <h5>
      FanDuel NFL Lineup Generator
      <b-btn
        v-b-popover.hover="'Import the .csv for your contest  remove players you dislike, and start generating!'"
        variant="danger"
        title="Instructions"
      >
        ?
      </b-btn>
      <h5
        class="float-right"
        style="padding:10px;"
      >
        <a href="https://neocities.org/site/lineupgenerator">Donate if you win</a>
      </h5>
    </h5>
    <div class="alert alert-info">
      <br> Import the players list .csv for your contest below (download the .csv from DK/FanDuel)
      <br>Remove players that you don't want in your player pool (exposure coming soon, for now, modify the .csv to
      increase exposure to players you like)
      <br>Go to the Lineups tab and start generating lineups
      <br>Export your lineups by clicking 'Download' , modify the headers manually, and import them into DraftKings or
      FanDuel
    </div>
    <div class="alert alert-danger">
      When you download your lineups, in the downloaded .csv, change the headers to 'QB, RB, RB, WR, WR, WR, TE, FLEX,
      DEF' or
      you won't be able to upload it to FanDuel.
    </div>
    <label>
      <strong>
        Import Your Player Pool
      </strong>
      <br> in the same format as the .csv download from FanDuel</label>
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
        <div>
          <label>Select Flex Position:</label>
          <select v-model="selectedFlex">
            <option>RB</option>
            <option>WR</option>
            <option>TE</option>
          </select>
        </div>
        <b-btn @click="generate()">
          Generate
        </b-btn>
        <b-button
          :variant="theme"
          download
          @click="save"
        >
          Download
        </b-button>
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
  name: 'FanDuel',
  data () {
    return {
      selectedFlex: 'RB',
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
        'QB': null,
        'RB1': null,
        'RB2': null,
        'WR1': null,
        'WR2': null,
        'WR3': null,
        'TE': null,
        'FLEX': null,
        'D': null,
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
    },
    drawPositions () {
      this.positions = this.groupBy(this.playersList, "Roster Position");
      delete this.positions["undefined"];
    },
    removePlayer (player) {
      var id = player.Id
      console.log(this.playersList);
      this.playersList = this.playersList.filter(function (player) {
        return player.Id !== id;
      });
      this.drawTeams();
      this.drawPositions();
    },
    upload () {
      var that = this;
      const fileToLoad = event.target.files[0]
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
            console.log(that.teams);
            console.log(that.positions);
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
      FileSaver.saveAs(blob, 'FD' + new Date() + '.csv')
      alert(
        "In the downloaded .csv, change the headers to 'QB, RB, RB, WR, WR, WR, TE, FLEX, DEF' or you won't be able to upload it to FanDuel."
      )
    },
    savePlayersList () {
      const blob = new Blob([this.parseJSONtoCSV(this.playersList)], {
        type: 'text/csv'
      })
      FileSaver.saveAs(blob, 'FD' + new Date() + '.csv')

    },
    parseJSONtoCSV (table) {
      return Papa.unparse(table)
    },
    updateTheme () {
      this.theme = Vue.localStorage.get("theme");
      console.log("updating theme to : " + this.theme);
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
      var that = this;
      var playerIds = [];

      function getQB () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['QB'].length - 1));
        //that.lineup.QB = (({ Name, Salary, Position }) => ({ Name, Salary, Position }))(that.positions['QB'][index])
        that.lineup.QB = that.positions['QB'][index];
        playerIds.push(that.lineup.QB.Id);
        getRB1();
      }

      function getRB1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['RB'].length - 1));
        that.lineup.RB1 = that.positions['RB'][index];
        playerIds.push(that.lineup.RB1.Id);
        getRB2();
      }

      function getRB2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['RB'].length - 1));
        that.lineup.RB2 = that.positions['RB'][index];
        playerIds.push(that.lineup.RB2.Id);
        getWR1();
      }

      function getWR1 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length - 1));
        that.lineup.WR1 = that.positions['WR'][index];
        if (that.lineup.WR1.Team != that.lineup.QB.Team) {
          return that.generate();
        }
        playerIds.push(that.lineup.WR1.Id);
        getWR2();
      }

      function getWR2 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length - 1));
        that.lineup.WR2 = that.positions['WR'][index];
        playerIds.push(that.lineup.WR2.Id);
        getWR3();
      }

      function getWR3 () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['WR'].length - 1));
        that.lineup.WR3 = that.positions['WR'][index];
        playerIds.push(that.lineup.WR3.Id);
        getTE();
      }

      function getTE () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['TE'].length - 1));
        that.lineup.TE = that.positions['TE'][index];
        playerIds.push(that.lineup.TE.Id);
        getFLEX();
      }

      function getFLEX () {
        let index = Math.floor(Math.random() * Math.floor(that.positions[that.selectedFlex].length - 1));
        that.lineup.FLEX = that.positions[that.selectedFlex][index];
        playerIds.push(that.lineup.FLEX.Id);
        getD();
      }

      function getD () {
        let index = Math.floor(Math.random() * Math.floor(that.positions['D'].length - 1));
        that.lineup.D = that.positions['D'][index];
        playerIds.push(that.lineup.D.Id);
        console.log(that.lineup);
        validateLineup();
      }

      function validateLineup () {
        function removeDuplicate (arr) {
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
        var checkDupes = removeDuplicate(playerIds);
        var totalSalary =
          parseInt(that.lineup.QB.Salary) +
          parseInt(that.lineup.RB1.Salary) +
          parseInt(that.lineup.RB2.Salary) +
          parseInt(that.lineup.WR1.Salary) +
          parseInt(that.lineup.WR2.Salary) +
          parseInt(that.lineup.WR3.Salary) +
          parseInt(that.lineup.TE.Salary) +
          parseInt(that.lineup.FLEX.Salary) +
          parseInt(that.lineup.D.Salary);
        console.log('$' + totalSalary)
        if (checkDupes.length < 9) {
          console.log('dupes exist, restarting ', checkDupes.length);
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary < 55000) {
          console.log('salary cap expectations not met ', totalSalary);
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 60000) {
          console.log('salary cap expectations not met ', totalSalary);
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else {
          that.lineup['Total Salary'] = totalSalary;
          let lineup = {
            'QB': that.lineup.QB.Nickname + " " + that.lineup.QB['Team'] + " " + that.lineup.QB['Salary'],
            'RB1': that.lineup.RB1.Nickname + " " + that.lineup.RB1['Team'] + " " + that.lineup.RB1['Salary'],
            'RB2': that.lineup.RB2.Nickname + " " + that.lineup.RB2['Team'] + " " + that.lineup.RB2['Salary'],
            'WR1': that.lineup.WR1.Nickname + " " + that.lineup.WR1['Team'] + " " + that.lineup.WR1['Salary'],
            'WR2': that.lineup.WR2.Nickname + " " + that.lineup.WR2['Team'] + " " + that.lineup.WR2['Salary'],
            'WR3': that.lineup.WR3.Nickname + " " + that.lineup.WR3['Team'] + " " + that.lineup.WR3['Salary'],
            'TE': that.lineup.TE.Nickname + " " + that.lineup.TE['Team'] + " " + that.lineup.TE['Salary'],
            'FLEX': that.lineup.FLEX.Nickname + " " + that.lineup.FLEX['Team'] + " " + that.lineup.FLEX['Salary'],
            'D': that.lineup.D.Nickname + " " + that.lineup.D['Team'] + " " + that.lineup.D['Salary'],
            'Total Salary': totalSalary
          }
          that.lineups.unshift(lineup);
          lineup = {
            'QB': that.lineup.QB.Id,
            'RB1': that.lineup.RB1.Id,
            'RB2': that.lineup.RB2.Id,
            'WR1': that.lineup.WR1.Id,
            'WR2': that.lineup.WR2.Id,
            'WR3': that.lineup.WR3.Id,
            'TE': that.lineup.TE.Id,
            'FLEX': that.lineup.FLEX.Id,
            'D': that.lineup.D.Id,
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