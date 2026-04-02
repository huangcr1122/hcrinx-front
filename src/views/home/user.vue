<template>
  <div class="page-shell user-page">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">个人信息</div>
        <div class="page-header__desc">当前页面展示登录用户的基础资料，信息来源于本地会话缓存，可用于快速确认账号、环境与联系方式。</div>
      </div>
      <div class="user-page__header-side">
        <el-avatar class="user-avatar">{{ avatarText }}</el-avatar>
        <div class="user-page__header-meta">
          <span class="status-pill">{{ hasProfile ? '会话已加载' : '待补充资料' }}</span>
          <span class="page-header__hint">{{ lastLoadedText }}</span>
        </div>
      </div>
    </div>

    <div class="summary-grid user-summary">
      <div v-for="item in summaryCards" :key="item.label" class="summary-item">
        <div class="summary-item__label">{{ item.label }}</div>
        <div class="summary-item__value">{{ item.value }}</div>
        <div class="summary-item__meta">{{ item.meta }}</div>
      </div>
    </div>

    <el-card shadow="never" class="panel-card user-card">


      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">账号资料</div>
          <div class="panel-subtitle">基础信息来自本地登录态缓存，如需修改请通过统一用户中心或后端配置流程维护。</div>
        </div>
        <div class="panel-header__actions">
          <el-button size="small" icon="el-icon-refresh-right" @click="loadProfile">重新读取资料</el-button>
          <el-button size="small" type="primary" plain :disabled="!form.email" @click="copyField(form.email, '邮箱')">复制邮箱</el-button>
        </div>
      </div>

      <template v-if="hasProfile">
        <div class="profile-grid">
          <div v-for="item in profileCards" :key="item.label" class="profile-card">
            <div class="profile-card__label">{{ item.label }}</div>
            <div class="profile-card__value">{{ item.value }}</div>
            <div class="profile-card__meta">{{ item.meta }}</div>
          </div>
        </div>

        <div class="user-page__tips">
          <div class="user-page__tip-title">资料维护提示</div>
          <div class="user-page__tip-desc">建议优先保持手机号和邮箱可用，便于告警通知、审核沟通与账号找回。若需要更新资料，请走统一用户中心流程。</div>
        </div>
      </template>

      <div v-else class="page-empty page-empty--soft">
        <div class="page-empty__title">当前会话未缓存用户资料</div>
        <div class="page-empty__desc">可尝试重新登录或重新读取资料；若问题持续存在，请检查登录态或后端返回的用户信息。</div>
        <div class="page-empty__actions">
          <el-button size="small" type="primary" plain @click="loadProfile">重新读取资料</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: "User",
  data() {
    return {
      lastLoadedAt: '',
      form: {
        userid: '',
        name: '',
        mobile: '',
        email: '',
      }
    };
  },
  computed: {
    hasProfile() {
      return Object.values(this.form).some(Boolean);
    },
    avatarText() {
      return this.form.name ? this.form.name.slice(0, 1) : (this.form.userid ? this.form.userid.slice(0, 1).toUpperCase() : 'U');
    },
    filledCount() {
      return ['userid', 'name', 'mobile', 'email'].filter(key => !!this.form[key]).length;
    },
    completionRate() {
      return `${Math.round((this.filledCount / 4) * 100)}%`;
    },
    envLabel() {
      return (localStorage.getItem('env') || 'prod').toUpperCase();
    },
    lastLoadedText() {
      return this.lastLoadedAt ? `最近读取 ${this.lastLoadedAt}` : '从本地会话中同步资料';
    },
    summaryCards() {
      return [
        { label: '当前账号', value: this.form.userid || '--', meta: '用于登录识别与权限控制' },
        { label: '资料完整度', value: this.completionRate, meta: `已填写 ${this.filledCount} / 4 项核心资料` },
        { label: '运行环境', value: this.envLabel, meta: '来自当前浏览器中的环境缓存' },
        { label: '会话状态', value: this.hasProfile ? '正常' : '缺失', meta: this.hasProfile ? '基础资料已成功载入' : '建议重新登录或刷新资料' },
      ];
    },
    profileCards() {
      return [
        { label: '用户名', value: this.safeText(this.form.userid), meta: '系统账号主标识，用于登录与审计' },
        { label: '姓名', value: this.safeText(this.form.name), meta: '展示在审批、通知与页面角标中' },
        { label: '手机号', value: this.safeText(this.form.mobile), meta: '建议保持可用，便于接收告警或联系' },
        { label: '邮箱地址', value: this.safeText(this.form.email), meta: '建议用于通知、找回与流程沟通' },
      ];
    },
  },
  mounted() {
    this.loadProfile();
  },
  methods: {
    safeText(value) {
      return value || '未设置';
    },
    formatDateTime(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '--';
      if (typeof date.format === 'function') {
        return date.format('yyyy-MM-dd hh:mm:ss');
      }
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    loadProfile() {
      try {
        this.form = {
          userid: '',
          name: '',
          mobile: '',
          email: '',
          ...JSON.parse(localStorage.getItem("hcrinx_user") || "{}")
        };
        this.lastLoadedAt = this.formatDateTime(new Date());
      } catch (error) {
        this.form = {userid: '', name: '', mobile: '', email: ''};
        this.$message.error('用户资料读取失败');
      }
    },
    copyField(value, label) {
      if (!value) {
        this.$message.warning(`${label} 暂无可复制内容`);
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(() => {
          this.$message.success(`${label} 已复制`);
        }).catch(() => {
          this.fallbackCopyText(value, label);
        });
      } else {
        this.fallbackCopyText(value, label);
      }
    },
    fallbackCopyText(value, label) {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', 'readonly');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success(`${label} 已复制`);
      } catch (error) {
        this.$message.error(`${label} 复制失败`);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  },
};
</script>

<style lang="scss" scoped>
.user-page__header-side {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-page__header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.user-page__header-meta .page-header__hint {
  max-width: 220px;
  text-align: right;
}


.user-avatar {
  width: 52px;
  height: 52px;
  line-height: 52px;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
}

.user-card {
  max-width: 860px;
}

.user-page__tips {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff, #f1f5f9);
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.user-page__tip-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.user-page__tip-desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.65;
  color: #64748b;
}

@media (max-width: 768px) {
  .user-page__header-side {
    align-items: flex-start;
  }

  .user-page__header-meta {
    align-items: flex-start;
  }

  .user-page__header-meta .page-header__hint {
    max-width: none;
    text-align: left;
  }
}

</style>

