<template>
  <b-navbar
    toggleable="md"
    type="dark"
    :variant="theme"
    class="sticky"
  >
    <b-navbar-toggle target="nav_collapse" />
    <b-navbar-brand 
      href="#" 
      class="logo"
    >
      lineupgenerator.net
    </b-navbar-brand>
    <b-collapse
      id="nav_collapse"
      is-nav
    >
      <b-navbar-nav>
        <b-nav-item to="/DraftKings">
          DK NFL Lineup Generator
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/CaptainMode">
          DK Showdown Lineup Generator
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/Tiers">
          DK Tiers NFL Lineup Generator
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/FanDuel">
          FanDuel NFL Lineup Generator
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/ExposureMachine">
          Set PlayerPools
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/DraftKingsNba">
          DK NBA
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/FantasyDraftNfl">
          FantasyDraft NFL
        </b-nav-item>
      </b-navbar-nav>
      <b-navbar-nav>
        <b-nav-item to="/FantasyDraftNba">
          FantasyDraft NBA
        </b-nav-item>
      </b-navbar-nav>

      <!-- <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown
          text="Theme"
          right
        >
          <b-dropdown-item
            href="#"
            class="bg-primary"
            @click="updateTheme('primary')"
          >
            Primary
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-danger"
            @click="updateTheme('danger')"
          >
            Danger
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-info"
            @click="updateTheme('info')"
          >
            Info
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-warning"
            @click="updateTheme('warning')"
          >
            Warning
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-dark"
            style="color:white"
            @click="updateTheme('dark')"
          >
            Dark
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-secondary"
            @click="updateTheme('secondary')"
          >
            Secondary
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-white"
            @click="updateTheme('white')"
          >
            White
          </b-dropdown-item>
          <b-dropdown-item
            href="#"
            class="bg-light"
            @click="updateTheme('light')"
          >
            Light
          </b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav> -->
    </b-collapse>
  </b-navbar>
</template>
<script>
  import Vue from "vue";
  export default {
    data: function () {
      return {
        theme: Vue.localStorage.get("theme")
      };
    },
    methods: {
      updateTheme(value) {
        Vue.localStorage.set("theme", value);
        this.theme = Vue.localStorage.get("theme");
        this.$bus.$emit("theme-changed", this.theme);
      }
    }
  };
</script>
<style>
  .sticky {
    position: fixed !important;
    width: 100%;
    top: 0;
    z-index: 1000;
  }
  .nav-link {
    text-decoration: underline !important;
  }
  .logo{
    font-size: x-large;
  }
</style>