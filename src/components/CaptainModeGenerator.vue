<template>
  <div class="parse">
    <common-header
      site="DraftKings"
      contest="Showdown"
    />
    <section v-if="!playersList">
      <b-form-file       
        v-model="file"
        :state="Boolean(file)"
        placeholder="Choose a file..."
        drop-placeholder="Drop file here..."
        accept=".csv"
        @input="upload"
      />
    </section>

    <div class="body" />
    <b-tabs v-if="playersList">
      <b-tab
        title="All Players"
        active
      >
        <b-button
          size="sm"
          class="float-right"
          variant="outline-dark"
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
      <b-tab
        v-if="team.length"
        title="Players By Team"
      >
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
          striped
          hover
          :items="team"
          :fields="playersListFields"
        />
      </b-tab>
      <b-tab
        v-if="position.length"
        title="Players By Position"
      >
        <div class="alert alert-light">
          <b-btn
            v-for="position in Object.keys(positions)"
            :key="position.Position"
            size="sm"
            variant="link"
            @click="setPosition(position)"
          >
            {{ position }}
          </b-btn>
        </div>
        <b-table
          striped
          hover
          :items="position"
          :fields="playersListFields"
        />
      </b-tab>
      <b-tab title="Lineups">
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
            Clear Lineups
          </b-button>
        </b-input-group>

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
import Papa from "papaparse";
import Blob from "blob";
import FileSaver from "file-saver";
Vue.use(VueLocalStorage);
export default {
  name: "Captainmode",
  data () {
    return {
      selectedFLEX: "RB",
      playersList: null,
      theme: Vue.localStorage.get("theme"),
      playersListFields: [],
      team: {},
      teams: {},
      position: {},
      positions: {},
      lineups: [],
      fullLineups: [],
      progress: {
        numberToGenerate: 1,
        totalLineups: 0
      },
      showSpinner: {
        on: false
      },
      file: {},
      lineup: {
        CPT: null,
        FLEX1: null,
        FLEX2: null,
        FLEX3: null,
        FLEX4: null,
        FLEX5: null,
        "Total Salary": null
      }
    };
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
      delete this.positions["undefined"];
    },
    removePlayer (player) {
      var id = player.ID;

      this.playersList = this.playersList.filter(function (player) {
        return player.ID !== id;
      });
      this.drawTeams();
      this.drawPositions();
    },
    upload () {
      var that = this;
      const fileToLoad = this.file;
      const reader = new FileReader();
      reader.onload = fileLoadedEvent => {
        Papa.parse(fileLoadedEvent.target.result, {
          header: true,
          complete (results) {
            that.playersList = results.data;
            delete that.playersList[Object.keys(that.playersList).length - 1];
            that.playersListFields = Object.keys(that.playersList[0]).map(
              str => {
                return {
                  key: str,
                  sortable: true
                };
              }
            );
            that.playersListFields.push("delete_btn");
            that.drawTeams();
            that.drawPositions();
          },
          error (errors) {
            console.log("error", errors);
          }
        });
      };
      reader.readAsText(fileToLoad);
    },
    save () {
      const blob = new Blob([this.parseJSONtoCSV(this.fullLineups)], {
        type: "text/csv"
      });
      FileSaver.saveAs(blob, "DK" + new Date() + ".csv");
      alert(
        "In the downloaded .csv, change the headers to 'CPT, FLEX, FLEX, FLEX, FLEX, FLEX, FLEX' or you won't be able to upload it to DraftKings."
      );
    },
    savePlayersList () {
      const blob = new Blob([this.parseJSONtoCSV(this.playersList)], {
        type: "text/csv"
      });
      FileSaver.saveAs(blob, "DK" + new Date() + ".csv");
    },
    parseJSONtoCSV (table) {
      return Papa.unparse(table);
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
    clearLineups () {
      this.lineups = [];
      this.fulllineups = [];
    },
    generate () {
      this.showSpinner.on = true;
      var that = this;
      var playerIds = [];
      var playerNames = [];

      function getCaptain () {        
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["CPT"].length - 1)
        );       
        that.lineup.CPT = that.positions["CPT"][index];
        playerIds.push(that.lineup.CPT.ID);
        playerNames.push(that.lineup.CPT.Name);
        getFLEX1();
      }

      function getFLEX1 () {        
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["FLEX"].length - 1)
        );
        that.lineup.FLEX1 = that.positions["FLEX"][index];
        playerIds.push(that.lineup.FLEX1.ID);
        playerNames.push(that.lineup.FLEX1.Name);      
        getFLEX2();
      }
      function getFLEX2 () {       
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["FLEX"].length - 1)
        );
        that.lineup.FLEX2 = that.positions["FLEX"][index];
        playerIds.push(that.lineup.FLEX2.ID);
        playerNames.push(that.lineup.FLEX2.Name);       
        getFLEX3();
      }
      function getFLEX3 () {       
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["FLEX"].length - 1)
        );
        that.lineup.FLEX3 = that.positions["FLEX"][index];
        playerIds.push(that.lineup.FLEX3.ID);
        playerNames.push(that.lineup.FLEX3.Name);    
        getFLEX4();
      }
      function getFLEX4 () {        
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["FLEX"].length - 1)
        );
        that.lineup.FLEX4 = that.positions["FLEX"][index];
        playerIds.push(that.lineup.FLEX4.ID);
        playerNames.push(that.lineup.FLEX4.Name);        
        getFLEX5();
      }
      function getFLEX5 () {        
        let index = Math.floor(
          Math.random() * Math.floor(that.positions["FLEX"].length - 1)
        );
        that.lineup.FLEX5 = that.positions["FLEX"][index];
        playerIds.push(that.lineup.FLEX5.ID);
        playerNames.push(that.lineup.FLEX5.Name);        
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
        var checkDupes = removeDuplicate(playerNames);
        var totalSalary =
          parseInt(that.lineup.CPT.Salary) +
          parseInt(that.lineup.FLEX1.Salary) +
          parseInt(that.lineup.FLEX2.Salary) +
          parseInt(that.lineup.FLEX3.Salary) +
          parseInt(that.lineup.FLEX4.Salary) +
          parseInt(that.lineup.FLEX5.Salary);      
        if (checkDupes.length < 6) {         
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary < 49000) {        
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else if (totalSalary > 50000) {          
          return setTimeout(() => {
            that.generate();
          }, 0);
        } else {
          that.lineup["Total Salary"] = totalSalary;
          let lineup = {
            CPT:
              that.lineup.CPT.Name +
              " " +
              that.lineup.CPT["TeamAbbrev"] +
              " " +
              that.lineup.CPT["Salary"],
            FLEX1:
              that.lineup.FLEX1.Name +
              " " +
              that.lineup.FLEX1["TeamAbbrev"] +
              " " +
              that.lineup.FLEX1["Salary"],
            FLEX2:
              that.lineup.FLEX2.Name +
              " " +
              that.lineup.FLEX2["TeamAbbrev"] +
              " " +
              that.lineup.FLEX2["Salary"],
            FLEX3:
              that.lineup.FLEX3.Name +
              " " +
              that.lineup.FLEX3["TeamAbbrev"] +
              " " +
              that.lineup.FLEX3["Salary"],
            FLEX4:
              that.lineup.FLEX4.Name +
              " " +
              that.lineup.FLEX4["TeamAbbrev"] +
              " " +
              that.lineup.FLEX4["Salary"],
            FLEX5:
              that.lineup.FLEX5.Name +
              " " +
              that.lineup.FLEX5["TeamAbbrev"] +
              " " +
              that.lineup.FLEX5["Salary"],
            "Total Salary": totalSalary
          };
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
            CPT: that.lineup.CPT.ID,
            FLEX1: that.lineup.FLEX1.ID,
            FLEX2: that.lineup.FLEX2.ID,
            FLEX3: that.lineup.FLEX3.ID,
            FLEX4: that.lineup.FLEX4.ID,
            FLEX5: that.lineup.FLEX5.ID
          };
          that.fullLineups.unshift(lineup);
        }
      }
      getCaptain();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.body {
  display: FLEX;
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