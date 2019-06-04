<template>
  <b-navbar toggleable="md" type="dark" v-bind:variant="theme" class="sticky">
    <b-navbar-toggle target="nav_collapse"></b-navbar-toggle>
    <b-navbar-brand href="#">
      <!-- <img src="src/assets/logo.png"> -->
    </b-navbar-brand>
    <b-collapse is-nav id="nav_collapse">
      <!-- <b-navbar-nav>
        <b-nav-item to="/DraftKings">DK NFL Lineup Generator</b-nav-item>
      </b-navbar-nav> -->
      <b-navbar-nav>
        <b-nav-item to="/CaptainMode">DK Captain Mode Lineup Generator</b-nav-item>
      </b-navbar-nav>
      <!-- <b-navbar-nav>
        <b-nav-item to="/Tiers">DK Tiers NFL Lineup Generator</b-nav-item>
      </b-navbar-nav> -->
      <!-- <b-navbar-nav>
        <b-nav-item to="/FanDuel">FanDuel NFL Lineup Generator</b-nav-item>
      </b-navbar-nav> -->
      <!-- <b-navbar-nav class="ml-auto">
        <b-nav-item-dropdown text="Theme" right>
          <b-dropdown-item href="#" @click="updateTheme('primary')" class="bg-primary">Primary</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('danger')" class="bg-danger">Danger</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('info')" class="bg-info">Info</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('warning')" class="bg-warning">Warning</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('dark')" class="bg-dark" style="color:white">Dark</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('secondary')" class="bg-secondary">Secondary</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('white')" class="bg-white">White</b-dropdown-item>
          <b-dropdown-item href="#" @click="updateTheme('light')" class="bg-light">Light</b-dropdown-item>
        </b-nav-item-dropdown>
      </b-navbar-nav> -->
    </b-collapse>
  </b-navbar>
</template>
<script>
  import Vue from "vue";
  import VueLocalStorage from "vue-localstorage";
  import { EventBus } from "../utils/myEventBus";
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
</style>