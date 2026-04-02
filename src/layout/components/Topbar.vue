<template>
  <div class="top-nav">
    <div class="top-nav__inner">
      <div class="top-nav__left">
        <router-link class="logo" to="/topology">
          <span class="logo-mark">H</span>
          <span class="logo-text">Hcrinx</span>
        </router-link>
        <el-menu
          class="nav-menu"
          :default-active="activeMenu"
          mode="horizontal"
          text-color="#475569"
          active-text-color="#2563eb"
          @select="handleSelect"
        >
          <div v-for="item in routes" :key="item.path" class="nav-item">
            <app-link v-if="showApp" :to="resolvePath(item)">
              <el-menu-item v-if="!item.hidden&&item.place===1&&checkRole(item.role)" :index="item.path">
                {{ item.meta ? item.meta.title : item.children[0].meta.title }}
              </el-menu-item>
            </app-link>
          </div>
        </el-menu>
      </div>

      <div v-if="showApp" class="appChoose">
        <i class="el-icon-collection-tag"></i>
        <span class="appChoose__text">{{ chooseApp }}</span>
        <span class="appChoose__env">{{ envLabel }}</span>
      </div>

      <div class="right-btn">
        <span v-if="!showApp && envLabel" class="env-badge">{{ envLabel }}</span>

        <router-link class="icon-link" to="/">
          <el-tooltip :open-delay="800" class="item" content="主页" effect="dark" placement="bottom">
            <el-link :underline="false"><i class="el-icon-s-home iconBtn"></i></el-link>
          </el-tooltip>
        </router-link>

        <div v-if="username==='admin'&&!showApp" class="quick-actions">
          <router-link class="icon-link" to="/setting">
            <el-tooltip :open-delay="800" class="item" content="设置" effect="dark" placement="bottom">
              <el-link :underline="false"><i class="el-icon-setting iconBtn"></i></el-link>
            </el-tooltip>
          </router-link>
          <router-link class="icon-link" to="/syslog">
            <el-tooltip :open-delay="800" class="item" content="系统日志" effect="dark" placement="bottom">
              <el-link :underline="false"><i class="el-icon-s-order iconBtn"></i></el-link>
            </el-tooltip>
          </router-link>
        </div>

        <div v-if="showApp" class="quick-actions">
          <div v-for="item in routes" :key="item.path">
            <router-link v-if="!item.hidden&&item.place===2&&checkRole(item.role)" class="icon-link" :to="resolvePath(item)">
              <el-tooltip :open-delay="800" class="item" :content="item.meta ? item.meta.title : item.children[0].meta.title" effect="dark" placement="bottom">
                <el-link :underline="false"><i :class="[item.icon, 'iconBtn']"></i></el-link>
              </el-tooltip>
            </router-link>
          </div>
        </div>

        <el-dropdown class="user-container">
          <el-link :underline="false" class="avatar-link">
            <el-avatar class="user-avatar">{{ avatarText }}</el-avatar>
          </el-link>
          <el-dropdown-menu slot="dropdown" class="user-dropdown">
            <router-link to="/user">
              <el-dropdown-item>个人信息</el-dropdown-item>
            </router-link>
            <router-link to="/help">
              <el-dropdown-item>使用帮助</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click.native="logout">
              <span class="logout-text">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script>
import AppLink from "./Link";
import {constantRoutes} from "@/router";
import {isExternal} from "@/utils/validate";

export default {
  name: "Topbar",
  components: {
    AppLink,
  },
  data() {
    const userInfo = JSON.parse(localStorage.getItem("hcrinx_user") || "{}");
    return {
      routes: constantRoutes,
      select: {},
      username: userInfo.userid || "user",
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
      if (path === "/home") {
        return "/";
      }
      return "/" + path.split("/")[1];
    },
    chooseApp() {
      if (this.showApp) {
        const appInfo = JSON.parse(localStorage.getItem("app") || "null");
        if (appInfo && appInfo.app) {
          return appInfo.app + " - " + appInfo.name;
        }
      }
      return "";
    },
    showApp() {
      return ["/", "/home", "/user", "/topology", "/syslog"].indexOf(this.activeMenu) === -1;
    },
    envLabel() {
      return (this.env || "prod").toUpperCase();
    },
    avatarText() {
      return this.username ? this.username.slice(0, 1).toUpperCase() : "U";
    },
  },
  mounted() {
    this.initCurrentRoutes();
  },
  methods: {
    initCurrentRoutes() {
      const {path} = this.$route;
      let route = this.routes.find((item) => {
        if (this.env !== 'dev' && (item.path === '/ops' || item.path === '/apimkt')) item.hidden = true;
        return item.path === "/" + path.split("/")[1]
      });
      if (!route) {
        route = this.routes.find((item) => item.path === "/");
      }
      this.$store.commit("permission/SET_CURRENT_ROUTES", route);
    },
    checkRole(itemRole) {
      const appInfo = JSON.parse(localStorage.getItem("app") || "null");
      if (!appInfo || appInfo.role == null) {
        return false;
      }
      return appInfo.role <= itemRole;
    },
    resolvePath(item) {
      if (isExternal(item.path)) {
        return item.path;
      }
      if (item.path === "/") {
        return item.redirect;
      }
      return item.path;
    },
    handleSelect(key) {
      this.select = key;
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
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  width: 100%;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(14px);
}

.top-nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 56px;
  padding: 0 18px;
}

.top-nav__left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 18px;
  flex-shrink: 0;
}

.logo-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.26);
}

.logo-text {
  color: #0f172a;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.nav-menu {
  min-width: 0;
  background: transparent;
}

.nav-item {
  display: inline-block;
}

.appChoose {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 34%;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  flex-shrink: 1;
}

.appChoose__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
}

.appChoose__env,
.env-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.right-btn,
.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-btn {
  flex-shrink: 0;
}

.icon-link,
.avatar-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.icon-link:hover,
.avatar-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.15);
}

.iconBtn {
  font-size: 18px;
  color: #1e3a8a;
}

.user-avatar {
  background: linear-gradient(135deg, #2563eb, #0f766e);
  width: 38px;
  height: 38px;
  line-height: 38px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
}

.logout-text {
  display: block;
  color: #ef4444;
}

::v-deep .nav-menu.el-menu--horizontal {
  border-bottom: none;
}

::v-deep .nav-menu .el-menu-item {
  height: 40px;
  line-height: 40px;
  margin: 0 4px;
  padding: 0 16px;
  border-bottom: none !important;
  border-radius: 12px;
  background: transparent;
  font-weight: 600;
}

::v-deep .nav-menu .el-menu-item:hover {
  background: rgba(37, 99, 235, 0.06);
  color: #2563eb !important;
}

::v-deep .nav-menu .el-menu-item.is-active {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb !important;
}

::v-deep .el-link.el-link--default {
  color: inherit;
}
</style>
