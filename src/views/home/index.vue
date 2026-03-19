<template>
  <div class="dashboard-container">
    <h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;管理员</h3>
    <el-divider></el-divider>
    <el-row>
      <el-button v-for="item in appList1" :key="item.id" :type="item.apptype" class="appIcon" @click="openApp(item)">
        <span class="appIcon-text">
          {{ item.app }}<br><br>{{ item.name }}
        </span>
      </el-button>
    </el-row>
    <span v-if="appList1.length===0" style="margin-left:22px">无</span>
    <h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;开发者</h3>
    <el-divider></el-divider>
    <el-row>
      <el-button v-for="item in appList2" :key="item.id" :type="item.apptype" class="appIcon" @click="openApp(item)">
        <span class="appIcon-text">
          {{ item.app }}<br><br>{{ item.name }}
        </span>
      </el-button>
    </el-row>
    <span v-if="appList2.length===0" style="margin-left:22px">无</span>
    <h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;访客</h3>
    <el-divider></el-divider>
    <el-row>
      <el-button v-for="item in appList3" :key="item.id" :type="item.apptype" class="appIcon" @click="openApp(item)">
        <span class="appIcon-text">
          {{ item.app }}<br><br>{{ item.name }}
        </span>
      </el-button>
    </el-row>
    <span v-if="appList3.length===0" style="margin-left:22px">无</span>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";

export default {
  name: "Dashboard",
  data() {
    return {
      loading: true,
      appList1: [],
      appList2: [],
      appList3: [],
      role: ['', 'admin', 'devloper', 'guest']
    };
  },
  mounted() {
    Cookies.remove("app");
    this.getAllowApps();
  },
  methods: {
    openApp(app) {
      Cookies.set('app', app.app);
      localStorage.setItem("app", JSON.stringify(app));
      this.$router.push({path: '/app'});
    },
    getAllowApps() {
      this.loading = true;
      let appType = ["primary", "success", "info", "warning", "danger"]
      request("/admin/home/getAllowApps").then((res) => {
        res.data.map(item => {
          if (item.role === 1) this.appList1.push(item);
          else if (item.role === 2) this.appList2.push(item);
          else if (item.role === 3) this.appList3.push(item);
        });
        this.appList1.map(item => item.apptype = appType[(item.app.length * 23 + new Date(item.updatetime).getTime()%23) % 5]);
        this.appList2.map(item => item.apptype = appType[(item.app.length * 23 + new Date(item.updatetime).getTime()%23) % 5]);
        this.appList3.map(item => item.apptype = appType[(item.app.length * 23 + new Date(item.updatetime).getTime()%23) % 5]);
        this.loading = false;
      });
    }
  },
};
</script>

<style lang="scss" scoped>
.appIcon {
  width: 120px;
  height: 120px;
  margin: 22px;
  border-radius: 100%;

  &-text {
    font-size: 18px;
    display: flex;
    justify-content: center;
  }
}
</style>
