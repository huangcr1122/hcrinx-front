<template>
  <div style="margin-top: 10px">

  </div>
</template>

<script>

import Cookies from "js-cookie";
import 'vue-json-viewer/style.css'

export default {
  name: "Alter",
  data() {
    return {
      app: Cookies.get('app'),
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
  },
  methods: {},
};
</script>
<style lang="scss" scoped>
.error-row {
  color: #ff0000;
}

.warning-row {
  color: #c3da04;
}

.success-row {
  color: #000000;
}

.cell {
  white-space: pre-line !important;
}

.httptext {
  display: -webkit-box;
  overflow: hidden;
  white-space: normal !important;
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
