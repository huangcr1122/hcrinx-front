<template>
  <div class="page-shell dashboard-page" v-loading="loading" element-loading-text="正在加载应用列表...">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">应用工作台</div>
      </div>
      <div class="page-header__actions">
        <span class="page-header__hint">{{ heroHint }}</span>
        <el-button size="small" icon="el-icon-refresh-right" @click="getAllowApps">刷新应用列表</el-button>
      </div>
    </div>
    <el-card shadow="never" class="panel-card">


      <div v-for="section in roleSections" :key="section.key" :ref="section.key" class="section-block">
        <div class="panel-header dashboard-page__section-header">
          <div class="panel-header__main">
            <div class="panel-title">{{ section.title }}</div>
            <div class="panel-subtitle">{{ section.desc }}</div>
          </div>
          <span class="status-pill">{{ section.list.length }} 个应用</span>
        </div>

        <el-row v-if="section.list.length" :gutter="12" class="app-grid">

          <el-col v-for="item in section.list" :key="item.id" :xs="24" :sm="12" :md="8" :lg="6" :xl="4">
            <el-button :type="item.apptype" plain class="app-entry" @click="openApp(item)">
              <div class="app-entry__name">{{ item.app }}</div>
              <div class="app-entry__desc">{{ item.name }}</div>
              <div class="app-entry__footer">
                <span class="app-entry__meta">最近更新 {{ item.displayTime }}</span>
              </div>
            </el-button>
          </el-col>
        </el-row>

        <div v-else class="page-empty page-empty--soft dashboard-page__empty">
          <div class="page-empty__title">{{ section.emptyTitle }}</div>
          <div class="page-empty__desc">{{ section.emptyDesc }}</div>
          <div class="page-empty__actions">
            <el-button size="small" plain @click="getAllowApps">重新刷新</el-button>
          </div>
        </div>
      </div>
    </el-card>
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
      lastUpdatedAt: '',
      appList1: [],
      appList2: [],
      appList3: [],
    };
  },
  computed: {
    totalApps() {
      return this.appList1.length + this.appList2.length + this.appList3.length;
    },
    heroHint() {
      return this.lastUpdatedAt ? `最近同步 ${this.lastUpdatedAt}` : '支持按角色分组快速进入应用';
    },
    roleSections() {
      return [

        {
          key: 'admin',
          title: '管理员',
          desc: '拥有应用管理权限，可进行配置、发布、告警等关键操作。',
          list: this.appList1,
          emptyTitle: '暂无管理员应用',
          emptyDesc: '当前账号没有可管理的应用入口，可刷新列表或联系管理员开通权限。'
        },
        {
          key: 'developer',
          title: '开发者',
          desc: '拥有协作权限，可查看调用、日志、作业与告警等核心信息。',
          list: this.appList2,
          emptyTitle: '暂无开发者应用',
          emptyDesc: '当前没有可协作的应用，待分配角色后可在此直接进入对应工作台。'
        },
        {
          key: 'guest',
          title: '访客',
          desc: '仅可浏览基础信息与监控数据，适合面向只读访问的角色。',
          list: this.appList3,
          emptyTitle: '暂无访客应用',
          emptyDesc: '当前账号暂无访客视角的应用入口，可稍后刷新检查最新授权结果。'
        },
      ];
    },
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
    scrollToSection(sectionKey) {


      const elements = this.$refs[sectionKey];
      if (elements && elements.length > 0) {
        const element = elements[0];
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // 添加高亮效果
        element.classList.add('section-block--highlight');
        setTimeout(() => {
          element.classList.remove('section-block--highlight');
        }, 2000);
      }
    },
    formatDate(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return value || '--';
      if (typeof date.format === 'function') {
        return date.format('yyyy-MM-dd hh:mm:ss');
      }
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    getAllowApps() {
      this.loading = true;
      this.appList1 = [];
      this.appList2 = [];
      this.appList3 = [];
      const appType = ["primary", "success", "info", "warning", "danger"];
      request("/admin/home/getAllowApps").then((res) => {
        (res.data || []).forEach((item, index) => {
          const updateTime = new Date(item.updatetime).getTime();
          item.displayTime = this.formatDate(item.updatetime);
          item.apptype = appType[Math.abs((item.app.length * 23 + ((Number.isNaN(updateTime) ? index : updateTime) % 23)) % 5)];
          if (item.role === 1) this.appList1.push(item);
          else if (item.role === 2) this.appList2.push(item);
          else if (item.role === 3) this.appList3.push(item);
        });
        this.lastUpdatedAt = this.formatDate(new Date());
      }).catch(() => {
        this.$message.error('应用列表加载失败');
      }).finally(() => {
        this.loading = false;
      });
    }
  },
};
</script>

<style lang="scss" scoped>
.dashboard-page__section-header {
  margin-bottom: 0;
}

.dashboard-page__empty {
  margin-top: 12px;
}

.app-grid {
  margin-top: 12px;
}

.app-entry {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  min-height: 122px;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: 16px;
  text-align: left;
}

.app-entry:hover {
  transform: translateY(-2px);
}

.app-entry__name {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}

.app-entry__desc {
  margin-top: 8px;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.app-entry__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  min-width: 0;
}

.app-entry__meta {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  opacity: 0.78;
}

.app-entry__action {
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 700;
}

@media (max-width: 768px) {
  .app-entry__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .app-entry__meta {
    white-space: normal;
  }
}

// 摘要卡片点击样式
.summary-item--clickable {
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

    .summary-item__arrow {
      transform: translateX(4px);
    }
  }
}

.summary-item__arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #909399;
  transition: transform 0.2s ease;
}

// 区块高亮效果
.section-block {
  position: relative;
  transition: all 0.3s ease;

  &--highlight {
    animation: highlight-pulse 2s ease;

    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border: 2px solid #409eff;
      border-radius: 8px;
      animation: highlight-border 2s ease;
    }
  }
}

@keyframes highlight-pulse {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(64, 158, 255, 0.05);
  }
}

@keyframes highlight-border {
  0%, 100% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>

