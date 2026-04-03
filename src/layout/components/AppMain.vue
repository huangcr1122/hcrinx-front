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
  padding: 5px;
  top: 56px;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  background: transparent;
}

.fixed-header + .app-main {
  padding-top: 72px;
}
</style>

<style lang="scss">
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
