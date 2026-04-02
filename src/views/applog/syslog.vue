<template>
  <div class="page-shell log-page">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">系统日志</div>
        <div class="page-header__desc">查看平台级系统日志，支持按时间范围、日志级别和关键字快速过滤。</div>
      </div>
    </div>


    <el-card shadow="never" class="panel-card">
      <div class="page-toolbar log-page__toolbar">
        <div class="page-toolbar__group page-toolbar__grow">
          <el-date-picker v-model="period" class="log-page__range" align="right" size="small" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" type="datetimerange" :default-time="['08:00:00', '15:00:00']"></el-date-picker>
          <el-input v-model="content" class="log-page__input--content" clearable placeholder="日志内容搜索" size="small"></el-input>
          <el-select v-model="level" class="log-page__select--level" clearable filterable placeholder="选择日志级别" size="small">
            <el-option v-for="item in logLevel" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </div>
        <div class="page-toolbar__group">
          <el-button size="small" @click="resetFilters">重置</el-button>
          <el-button size="small" type="primary" icon="el-icon-refresh-right" @click="searchLog">刷新</el-button>
        </div>
      </div>

      <div class="panel-subtitle">当前已加载 {{ logData.length }} 条系统日志，继续下拉可加载更多内容。</div>

      <ul v-infinite-scroll="load" class="log-stream log-page__stream" :infinite-scroll-disabled="loading">
        <li v-for="(item,index) in logData" :key="index + '' + item.ts" class="log-stream__item log-page__item" :style="{color: levelColor[item.level]}">
          <span class="log-stream__meta log-page__meta">{{ '【' + item.app + (item.app === 'data' ? '' : '-' + item.appip) + '】' + item.ts }}</span>
          <span class="log-page__content">{{ '【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content }}</span>
        </li>
      </ul>

    </el-card>
  </div>
</template>

<script>
import request from "@/utils/request";

export default {
  name: "SysLogs",
  data() {
    return {
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#94a3b8', '#84cc16', '#38bdf8', '#f59e0b', '#f87171'],
      page: 1,
      period: [new Date(Date.now() - Date.now() % (24 * 3600 * 1000) - 728 * 3600 * 1000), new Date()],
      loading: false,
      level: 'INFO',
      content: '',
      appip: '',
      logData: [],
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
  mounted() {
    this.searchLog();
  },
  methods: {
    resetFilters() {
      this.content = '';
      this.level = 'INFO';
      this.searchLog();
    },
    load() {
      if (this.loading) {
        return;
      }
      this.loading = true;
      request({
        url: "/admin/rpclog/syslog",
        params: {
          page: this.page,
          start: this.period[0].format("yyyy-MM-dd hh:mm:ss"),
          end: this.period[1].format("yyyy-MM-dd hh:mm:ss"),
          content: this.content,
          appip: this.appip,
          level: this.logLevel.indexOf(this.level),
        },
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
