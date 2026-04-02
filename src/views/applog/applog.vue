<template>
  <div class="page-shell log-page">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">应用日志</div>
        <div class="page-header__desc">按时间、日志级别、请求标识与生产者节点筛选日志，支持无限滚动持续查看。</div>
      </div>
    </div>


    <el-card shadow="never" class="panel-card">
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
            <el-link v-if="item.rid !== '00000000-0000-0000-0000-000000000000'" :underline="false" class="log-stream__meta log-page__meta" @click="copyRid(item.rid)">{{ item.ts }}</el-link>
          </el-tooltip>
          <span v-if="item.rid==='00000000-0000-0000-0000-000000000000'" class="log-stream__meta log-page__meta">{{ item.ts }}</span>
          <span class="log-page__content">{{ '【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content }}</span>
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
  methods: {
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
