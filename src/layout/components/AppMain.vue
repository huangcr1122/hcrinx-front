<template>
  <section class="app-main">
    <transition mode="out-in" name="fade-transform">
      <router-view :key="key"/>
    </transition>
  </section>
</template>

<script>
export default {
  name: 'AppMain',
  computed: {
    key() {
      return this.$route.path
    }
  }
}
</script>

<style lang="scss" scoped>

.app-main {
  min-height: calc(100vh - 56px);
  width: 100%;
  padding: 0px;
  top: 56px;
  position: relative;
  overflow: hidden;
  background-color: #f1f1f1;
}

.fixed-header + .app-main {
  padding-top: 56px;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
