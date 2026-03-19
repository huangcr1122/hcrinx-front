<template>
  <div class="top-nav">
    <div class="logo">
      <router-link to="/topology">
        Hcrinx
      </router-link>
    </div>
    <el-menu :default-active="activeMenu" active-text-color="#0000000" mode="horizontal" @select="handleSelect">
      <div v-for="item in routes" :key="item.path" class="nav-item">
        <app-link v-if="showApp" :to="resolvePath(item)">
          <el-menu-item v-if="!item.hidden&&item.place===1&&checkRole(item.role)" :index="item.path">
            {{ item.meta ? item.meta.title : item.children[0].meta.title }}
          </el-menu-item>
        </app-link>
      </div>
    </el-menu>
    <div v-if="showApp" class="appChoose"><span>{{ chooseApp }}</span></div>
    <div class="right-btn">
      <router-link to="/">
        <el-tooltip :open-delay=800 class="item" content="主页" effect="dark" placement="bottom">
          <el-link :underline="false"><i class="el-icon-s-home iconBtn"></i></el-link>
        </el-tooltip>
      </router-link>
      <div v-if="username==='admin'&&!showApp">
        <router-link to="/setting">
          <el-tooltip :open-delay=800 class="item" content="设置" effect="dark" placement="bottom">
            <el-link :underline="false"><i class="el-icon-setting iconBtn"></i></el-link>
          </el-tooltip>
        </router-link>
        <router-link to="/syslog">
          <el-tooltip :open-delay=800 class="item" content="系统日志" effect="dark" placement="bottom">
            <el-link :underline="false"><i class="el-icon-s-order iconBtn"></i></el-link>
          </el-tooltip>
        </router-link>
      </div>
      <div v-if="showApp" v-for="item in routes" :key="item.path">
        <router-link v-if="!item.hidden&&item.place===2&&checkRole(item.role)" :to="resolvePath(item)">
          <el-tooltip :open-delay=800 class="item" :content="item.meta ? item.meta.title : item.children[0].meta.title" effect="dark" placement="bottom">
            <el-link :underline="false"><i :class="[item.icon ,'iconBtn']"></i></el-link>
          </el-tooltip>
        </router-link>
      </div>
      <el-dropdown class="user-container">
        <el-link :underline="false">
          <el-avatar style="background:#044477;width: 45px;height: 45px;line-height: 45px;"> {{ username }}</el-avatar>
        </el-link>
        <el-dropdown-menu v-slot="dropdown" class="user-dropdown">
          <router-link to="/user">
            <el-dropdown-item>个人信息</el-dropdown-item>
          </router-link>
          <router-link to="/help">
            <el-dropdown-item>使用帮助</el-dropdown-item>
          </router-link>
          <el-dropdown-item divided @click.native="logout">
            <span style="display: block; color: red">退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

  </div>
</template>

<script>
import AppLink from "./Link";
import {constantRoutes} from "@/router";
import {isExternal} from "@/utils/validate";
import Cookies from "js-cookie";

export default {
  name: "Topbar",
  components: {
    AppLink,
  },
  data() {
    return {
      routes: constantRoutes,
      select: {},
      username: JSON.parse(localStorage.getItem("hcrinx_user")).userid,
      env: localStorage.getItem("env"),
    };
  },
  computed: {
    activeMenu() {
      const route = this.$route;
      const {meta, path} = route;
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      // 如果是首页，首页高亮
      if (path === "/home") {
        return "/";
      }
      // 如果不是首页，高亮一级菜单
      return "/" + path.split("/")[1];
    },
    chooseApp() {
      if (this.showApp) {
        let appInfo = JSON.parse(localStorage.getItem("app"))
        return (
          appInfo.app + "-" + appInfo.name
        );
      }
      return "";
    },
    showApp() {
      return ['/', '/home', '/user', '/topology', '/syslog'].indexOf(this.activeMenu) === -1;
    },
  },
  mounted() {
    this.initCurrentRoutes();
  },
  methods: {
    // 通过当前路径找到二级菜单对应项，存到store，用来渲染左侧菜单
    initCurrentRoutes() {
      const {path} = this.$route;
      let route = this.routes.find((item) => {
        if (this.env !== 'dev' && (item.path === '/ops' || item.path === '/apimkt')) item.hidden = true;
        return item.path === "/" + path.split("/")[1]
      });
      // 如果找不到这个路由，说明是首页
      if (!route) {
        route = this.routes.find((item) => item.path === "/");
      }
      this.$store.commit("permission/SET_CURRENT_ROUTES", route);
    },
    checkRole(itemRole) {
      let appInfo = JSON.parse(localStorage.getItem("app"))
      return appInfo.role <= itemRole;
    },
    resolvePath(item) {
      // 如果是个完成的url直接返回
      if (isExternal(item.path)) {
        return item.path;
      }
      // 如果是首页，就返回重定向路由
      if (item.path === "/") {
        return item.redirect;
      }
      return item.path;
    },
    handleSelect(key, keyPath) {
      this.select = key;
      // 把选中路由的子路由保存store
      const route = this.routes.find((item) => item.path === key);
      this.$store.commit("permission/SET_CURRENT_ROUTES", route);
    },
    async logout() {
      await this.$store.dispatch("user/logout");
      this.$router.push(`/login?redirect=${this.$route.fullPath}`);
    },
  },
};
</script>
<style lang="scss" scoped>
.appcard {
  padding: 22px;
}

.top-nav {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  background: white;

  .logo {
    padding: 0 16px;
    line-height: 56px;
    font-size: 24px;
    font-weight: bold;
    color: #044477;
    float: left;
  }

  .el-menu {
    float: left;
    border: none !important;

    .nav-item {
      display: inline-block;
    }
  }

  .right-menu {
    float: right;
    height: 100%;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;
    }

    .user-container {
      margin-right: 22px;
      margin-left: 11px;

      .user-wrapper {
        margin-top: 20px;
        position: relative;
        font-size: 16px;
      }
    }
  }
}

:deep(.el-dropdown) {
  padding-left: 11px;
}

.el-carousel__item h3 {
  color: #475669;
  font-size: 14px;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
}

.el-carousel__item:nth-child(n) {
  background-color: #d3dce6;
}

.appChoose {
  text-align: center;
  position: absolute;
  width: 100%;
  z-index: -1;
  top: 15px;
  font-size: 20px;
}

.right-btn {
  position: absolute;
  display: flex;
  align-items: center;
  right: 11px;
  top: 6px;
  font-size: 20px;
}

.iconBtn {
  font-size: 22px;
  padding: 6px;
}

.el-link.el-link--default {
  color: #044477;

  &:hover {
    color: #caeeec;
  }
}
</style>
