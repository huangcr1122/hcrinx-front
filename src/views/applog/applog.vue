<template>
  <div class="page-shell log-page">
    <el-card shadow="never" class="panel-card log-page__panel">

      <div class="page-toolbar log-page__toolbar">
        <div class="page-toolbar__group page-toolbar__grow">
          <el-date-picker v-model="period" class="log-page__range" align="right" size="small" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" type="datetimerange" :default-time="['08:00:00', '15:00:00']"></el-date-picker>
          <el-input v-model="logrid" class="log-page__input--rid" clearable placeholder="rid 搜索" size="small"></el-input>
          <el-input v-model="content" class="log-page__input--content" clearable placeholder="日志内容搜索" size="small"></el-input>
          <el-select v-model="appip" class="log-page__select--ip" clearable filterable placeholder="日志生产者 IP" size="small">
            <el-option v-for="item in logIp" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <el-select v-model="level" class="log-page__select--level" clearable filterable placeholder="日志级别" size="small">
            <el-option v-for="item in logLevel" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <el-checkbox v-model="noMemoLog" border size="small">隐藏调用日志</el-checkbox>
          <el-checkbox v-model="noCommonLog" border size="small">隐藏非调用日志</el-checkbox>
        </div>
        <div class="page-toolbar__group">
          <el-button size="small" @click="resetFilters">重置</el-button>
          <el-button size="small" type="primary" icon="el-icon-refresh-right" @click="searchLog">刷新</el-button>
        </div>
      </div>

      <div class="panel-subtitle">当前已加载 {{ logData.length }} 条日志，继续下拉可加载更多内容。</div>

      <ul v-infinite-scroll="load" class="log-stream log-page__stream" :infinite-scroll-disabled="loading">
        <li v-for="(item,index) in logData" :key="index + '' + item.ts" class="log-stream__item log-page__item" :style="{color: levelColor[item.level]}">
          <el-tooltip class="item" effect="dark" :content="'复制：' + item.rid" placement="bottom-start">
            <el-link v-if="item.rid !== '00000000-0000-0000-0000-000000000000'" :underline="false" class="log-stream__meta log-page__meta" @click.stop="copyRid(item.rid)">{{ item.ts }}</el-link>
          </el-tooltip>
          <span v-if="item.rid==='00000000-0000-0000-0000-000000000000'" class="log-stream__meta log-page__meta">{{ item.ts }}</span>
          <span class="log-page__content" v-html="highlightText('【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content)"></span>
        </li>
      </ul>

    </el-card>

  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";

export default {
  name: "Rpclogs",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app") || '{}'),
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#94a3b8', '#84cc16', '#38bdf8', '#f59e0b', '#f87171'],
      levelTagType: ['', '', 'info', 'warning', 'danger'],
      page: 1,
      period: [new Date(Date.now() - Date.now() % (24 * 3600 * 1000) - 728 * 3600 * 1000), new Date()],
      loading: false,
      noMemoLog: false,
      noCommonLog: false,
      level: 'INFO',
      content: '',
      logrid: '',
      appip: '',
      logIp: [],
      logData: [],
      autoRefresh: false,
      autoRefreshTimer: null,
      detailVisible: false,
      selectedLog: null,
      highlightKeyword: '',
      highlightColors: ['#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688'],
      currentColorIndex: 0,
      pickerOptions: {
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - start.getTime() % (24 * 3600 * 1000) - 8 * 3600 * 1000);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '昨天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - start.getTime() % (24 * 3600 * 1000) - 32 * 3600 * 1000);
            end.setTime(end.getTime() - end.getTime() % (24 * 3600 * 1000) - 8 * 3600 * 1000);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一周',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
            picker.$emit('pick', [start, end]);
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            picker.$emit('pick', [start, end]);
          }
        }]
      },
    };
  },
  computed: {
    levelStats() {
      const stats = {};
      this.logLevel.forEach(name => {
        stats[name] = 0;
      });
      this.logData.forEach(item => {
        const levelName = this.logLevel[item.level];
        stats[levelName]++;
      });
      return stats;
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
      return;
    }
    request({
      url: "/admin/rpclog/getLogIpList",
      params: {},
    }).then((res) => {
      this.logIp = res.data || [];
      this.searchLog();
    });
  },
  beforeDestroy() {
    this.stopAutoRefresh();
  },
  methods: {
    highlightText(text) {
      if (!this.highlightKeyword || !text) {
        return this.escapeHtml(text);
      }
      const keywords = this.highlightKeyword.trim().split(/\s+/).filter(k => k);
      if (keywords.length === 0) {
        return this.escapeHtml(text);
      }
      let result = this.escapeHtml(text);
      keywords.forEach((keyword, index) => {
        const colorIndex = (this.currentColorIndex + index) % this.highlightColors.length;
        const color = this.highlightColors[colorIndex];
        const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');
        result = result.replace(regex, `<mark class="log-highlight" style="background-color: ${color}; color: #000; padding: 1px 3px; border-radius: 2px; font-weight: 600;">$1</mark>`);
      });
      return result;
    },
    escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    escapeRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    toggleAutoRefresh() {
      this.autoRefresh = !this.autoRefresh;
      if (this.autoRefresh) {
        this.startAutoRefresh();
        this.$message.success('已开启自动刷新（每5秒）');
      } else {
        this.stopAutoRefresh();
        this.$message.info('已暂停自动刷新');
      }
    },
    startAutoRefresh() {
      this.autoRefreshTimer = setInterval(() => {
        this.searchLog();
      }, 5000);
    },
    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
    },
    showLogDetail(log) {
      this.selectedLog = log;
      this.detailVisible = true;
    },
    exportLog() {
      if (this.logData.length === 0) {
        this.$message.warning('没有可导出的日志');
        return;
      }
      const headers = ['时间', '级别', 'RID', '类名', '方法', '行号', '内容'];
      const rows = this.logData.map(item => [
        item.ts,
        this.logLevel[item.level],
        item.rid,
        item.clazz,
        item.method,
        item.line,
        item.content
      ]);
      let csv = '\uFEFF' + headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `log_${this.app}_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.$message.success('导出成功');
    },
    fallbackCopyText(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('复制成功');
      } catch (e) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },
    copyRid(rid) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rid).then(() => {
          this.$message.success('复制成功');
        }).catch(() => {
          this.fallbackCopyText(rid);
        });
      } else {
        this.fallbackCopyText(rid);
      }
    },
    resetFilters() {
      this.logrid = '';
      this.content = '';
      this.appip = '';
      this.noMemoLog = false;
      this.noCommonLog = false;
      this.level = 'INFO';
      this.searchLog();
    },
    load() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      const params = {
        page: this.page,
        start: this.period[0].format("yyyy-MM-dd hh:mm:ss"),
        end: this.period[1].format("yyyy-MM-dd hh:mm:ss"),
        content: this.content,
        rid: this.logrid,
        appip: this.appip,
        noMemoLog: this.noMemoLog ? 1 : 0,
        noCommonLog: this.noCommonLog ? 1 : 0,
        level: this.logLevel.indexOf(this.level),
      };
      request({
        url: "/admin/rpclog/getRpcLogList",
        params
      }).then((res) => {
        if ((res.data || []).length === 0) {
          this.$message.warning('到底啦');
        } else {
          this.page++;
          (res.data || []).forEach((x) => this.logData.push(x));
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    searchLog() {
      this.page = 1;
      this.logData = [];
      this.load();
    },
  },
};
</script>

<style lang="scss" scoped>
.log-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.log-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.log-stats__label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 4px;
}

.log-stats__value {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.log-stats__item--trace {
  background: #f1f5f9;
  .log-stats__value { color: #94a3b8; }
}

.log-stats__item--debug {
  background: #ecfccb;
  .log-stats__value { color: #84cc16; }
}

.log-stats__item--info {
  background: #e0f2fe;
  .log-stats__value { color: #38bdf8; }
}

.log-stats__item--warn {
  background: #fef3c7;
  .log-stats__value { color: #f59e0b; }
}

.log-stats__item--error {
  background: #fee2e2;
  .log-stats__value { color: #f87171; }
}

.log-detail {
  font-size: 14px;
}

.log-detail__row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.log-detail__label {
  flex-shrink: 0;
  font-weight: 600;
  color: #64748b;
  min-width: 60px;
}

.log-detail__value {
  flex: 1;
  color: #0f172a;
  word-break: break-all;
}

.log-detail__content {
  flex: 1;
  margin: 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
}

.log-page {
  height: calc(100vh - 66px);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.log-page__panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

::v-deep .log-page__panel .el-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px 14px;
}

.log-page__toolbar {
  flex: 0 0 auto;
}

.log-page__item {
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}


.log-highlight-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.log-highlight-toolbar__input {
  flex: 1;
}

.log-highlight-toolbar__colors {
  display: flex;
  align-items: center;
  gap: 6px;

  span {
    font-size: 12px;
    color: #64748b;
    font-weight: 600;
  }
}

.color-tag {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent !important;

  &:hover {
    transform: scale(1.15);
  }

  &--active {
    border: 2px solid #0f172a !important;
    transform: scale(1.2);
  }
}

.log-page__range {
  flex: 1 1 440px;
}

::v-deep .log-page__range.el-date-editor {
  width: 100%;
  min-width: 420px;
  max-width: 560px;
}

::v-deep .log-page__range.el-date-editor .el-range-input,
::v-deep .log-page__range.el-date-editor .el-range-separator,
::v-deep .log-page__range.el-date-editor .el-range__icon,
::v-deep .log-page__range.el-date-editor .el-range__close-icon {
  line-height: 32px;
}

.log-page__stream {
  flex: 1;
  min-height: 0;
  max-height: none;
  margin-top: 10px;
}

@media (max-width: 1200px) {
  ::v-deep .log-page__range.el-date-editor {
    min-width: 360px;
  }
}

@media (max-width: 992px) {
  .log-page {
    height: auto;
    min-height: auto;
  }

  .log-page__panel {
    min-height: calc(100vh - 180px);
  }

  ::v-deep .log-page__range.el-date-editor {
    min-width: 0;
    max-width: none;
  }
}

.log-highlight {
  animation: highlight-pulse 1.5s ease-in-out;
}

@keyframes highlight-pulse {

  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
