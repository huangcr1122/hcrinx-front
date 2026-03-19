<template>
  <div :class="classObj" class="app-wrapper">
    <topbar/>
    <div class="main-container">
      <app-main/>
    </div>
  </div>
</template>

<script>
import AppMain from "./components/AppMain.vue";
import Topbar from "./components/Topbar.vue";

export default {
  name: "Layout",
  components: {
    AppMain,
    Topbar,
  },
  computed: {
    classObj() {
      return {
        mobile: this.device === "mobile",
      };
    },
  },
  methods: {},
};
</script>

<style lang="scss" scoped>
.main-container {
  background: #fff;
}

.app-wrapper {
  position: relative;
  // height: 100%;
  height: calc(100vh - 56px);
  width: 100%;
}

.drawer-bg {
  background: #000;
  opacity: 0.3;
  width: 100%;
  top: 0;
  height: 100%;
  position: absolute;
  z-index: 999;
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - 210px);
  transition: width 0.28s;
}

.mobile .fixed-header {
  width: 100%;
}
</style>
