<template>
  <div class="page-shell rpc-log-page">
    <el-card class="panel-card rpc-log-page__filter-card">
      <div class="filter-grid filter-grid--dense rpc-log-page__filter-grid">
        <el-input v-model="rid" clearable placeholder="RID" size="small" />
        <el-date-picker
          v-model="period"
          class="filter-grid__range rpc-log-page__range"

          :default-time="['08:00:00', '15:00:00']"
          :picker-options="pickerOptions"
          align="right"
          end-placeholder="结束时间"
          range-separator="至"
          size="small"
          start-placeholder="开始时间"
          type="datetimerange"
        />

        <el-input
          v-model="mincosttime"
          clearable
          placeholder="最低时延(ms)"
          prefix-icon="el-icon-timer"
          size="small"
          @input="mincosttime = mincosttime.replace(/[^\d]/g, '')"
        />
        <el-input
          v-model="maxcosttime"
          clearable
          placeholder="最高时延(ms)"
          prefix-icon="el-icon-timer"
          size="small"
          @input="maxcosttime = maxcosttime.replace(/[^\d]/g, '')"
        />
        <el-input v-model="clientip" clearable placeholder="客户端 IP" size="small" />
        <el-input v-model="referer" clearable placeholder="Referer" size="small" />
        <el-input v-model="useragent" clearable placeholder="UserAgent" size="small" />
        <el-select v-model="fapp" clearable collapse-tags multiple placeholder="调用方" size="small">
          <el-option v-for="item in historyCaller" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select v-model="tappip" clearable filterable placeholder="服务方 IP" size="small">
          <el-option v-for="item in historyIp" :key="item" :label="item" :value="item" />
        </el-select>
        <el-cascader
          v-model="funcChoose"
          :options="historyFunc"
          :props="{ checkStrictly: true }"
          clearable
          filterable
          placeholder="模块 / 方法"
          separator="/"
          size="small"
        />
        <el-input
          v-model="sign"
          clearable
          placeholder="签名令牌 ID"
          prefix-icon="el-icon-lock"
          size="small"
          @input="sign = sign.replace(/[^\d]/g, '')"
        />
        <el-input v-model="request" clearable placeholder="请求参数搜索" size="small" />
        <el-input
          v-model="code"
          clearable
          placeholder="返回 code"
          size="small"
          @input="code = code.replace(/[^\d-]/g, '')"
        />
        <el-input v-model="msg" clearable placeholder="返回 msg" size="small" />
        <el-input v-if="hasResponsePermission" v-model="response" clearable placeholder="返回 data 搜索" size="small" />
        <el-input
          v-model="minrpclog"
          clearable
          placeholder="最小日志数"
          prefix-icon="el-icon-document"
          size="small"
          @input="minrpclog = minrpclog.replace(/[^\d]/g, '')"
        />
        <el-input
          v-model="maxrpclog"
          clearable
          placeholder="最大日志数"
          prefix-icon="el-icon-document"
          size="small"
          @input="maxrpclog = maxrpclog.replace(/[^\d]/g, '')"
        />
        <el-checkbox v-model="noCache" border size="small">隐藏缓存</el-checkbox>
        <el-checkbox v-model="queryError" border size="small">只看异常</el-checkbox>
        <el-button size="small" type="primary" icon="el-icon-search" @click="getLogTable">查询</el-button>
        <div class="rpc-log-page__action-group">
          <el-button size="small" type="success" icon="el-icon-data-analysis" @click="getLogTableCount">统计总数</el-button>
          <el-button size="small" type="primary" plain :disabled="page === 1" icon="el-icon-arrow-left" @click="getLogTablePre">上一页</el-button>
          <el-tag type="info">第 {{ page }} 页</el-tag>
          <el-button size="small" type="primary" plain :disabled="tableData.length !== 20" @click="getLogTableNext">下一页<i class="el-icon-arrow-right el-icon--right"></i></el-button>
        </div>


      </div>
    </el-card>

    <el-card class="panel-card rpc-log-page__table-card">
      <div class="rpc-log-page__table-shell">
        <el-table
          :cell-class-name="tableRowClassName"
          :data="tableData"
          v-loading="loading"
          border
          size="mini"
          height="100%"
        >


        <el-table-column label="RID" prop="rid" width="126">
          <template slot-scope="scope">
            <div class="rpc-log-page__rid-cell">
              <span class="mono-text">{{ scope.row.rid.replace(/-/g, '') }}</span>
              <el-button type="text" icon="el-icon-document-copy" @click="copyText(scope.row.rid, 'RID')" />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="时间(毫秒)">
          <el-table-column label="时间戳" prop="ts" width="96" />
          <el-table-column label="时延" prop="costtime" width="58" />
        </el-table-column>
        <el-table-column label="HTTP网关">
          <el-table-column label="IP" prop="clientip" width="96" />
          <el-table-column label="Referer" prop="referer" width="130">
            <template slot-scope="scope">
              <span class="httptext">{{ scope.row.referer }}</span>
              <el-link
                v-if="scope.row.referer && scope.row.referer.length > 32"
                :underline="false"
                class="rpc-log-page__view-link"
                @click="showRpcMsg(scope.row.referer)"
              >
                <i class="el-icon-view"></i>
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="UserAgent" prop="useragent" width="130">
            <template slot-scope="scope">
              <span class="httptext">{{ scope.row.useragent }}</span>
              <el-link
                v-if="scope.row.useragent && scope.row.useragent.length > 32"
                :underline="false"
                class="rpc-log-page__view-link"
                @click="showRpcMsg(scope.row.useragent)"
              >
                <i class="el-icon-view"></i>
              </el-link>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="调用方" width="120">
          <template slot-scope="scope">
            <div class="rpc-log-page__caller-cell">
              <div>{{ formatCaller(scope.row.fapp) }}</div>
              <div class="muted-text mono-text">{{ scope.row.fappip }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务方IP" prop="tappip" width="108" />
        <el-table-column label="方法" prop="func" width="150">
          <template slot-scope="scope">
            <span :style="rowHighlightStyle(scope.row)">{{ scope.row.func }}</span>
          </template>
        </el-table-column>
        <el-table-column label="请求包" prop="request" min-width="200">
          <template slot-scope="scope">
            <div :style="rowHighlightStyle(scope.row)" class="httptext" v-text="scope.row.request"></div>
            <el-link
              v-if="scope.row.request && scope.row.request.length > 128"
              :underline="false"
              class="rpc-log-page__view-link"
              @click="showJsonWin(scope.row.request)"
            >
              <i class="el-icon-view"></i>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="返回包">
          <el-table-column label="code" prop="code" width="68">
            <template slot-scope="scope">
              <span :style="rowHighlightStyle(scope.row)">{{ scope.row.code }}</span>
            </template>
          </el-table-column>
          <el-table-column label="msg" prop="msg" width="140">
            <template slot-scope="scope">
              <span class="httptext" :style="rowHighlightStyle(scope.row)">{{ scope.row.msg }}</span>
              <el-link
                v-if="scope.row.msg && scope.row.msg.length > 32"
                :underline="false"
                class="rpc-log-page__view-link"
                @click="showRpcMsg(scope.row.msg)"
              >
                <i class="el-icon-view"></i>
              </el-link>
            </template>
          </el-table-column>
          <el-table-column label="data" prop="response" width="128">
            <template slot-scope="scope">
              <el-link
                v-if="scope.row.response !== '0'"
                :type="scope.row.errcode > 80 ? 'danger' : scope.row.rpclog < 0 ? 'warning' : 'primary'"
                :underline="false"
                @click="showCache(scope.row)"
              >
                <span v-if="scope.row.errcode !== 17 && scope.row.errcode !== 18 && scope.row.errcode !== 20">
                  {{ formatResSize(scope.row.response) }}
                </span>
                <span v-if="scope.row.errcode === 17" style="color: #0ea5e9">HTTP 重定向</span>
                <span v-if="(scope.row.errcode === 18 || scope.row.errcode === 20) && scope.row.response.length === 32" style="color: #10b981">
                  HTTP 缓存
                </span>
              </el-link>
            </template>
          </el-table-column>
        </el-table-column>
        <el-table-column label="调用链" prop="trace" width="86">
          <template slot-scope="scope">
            <el-link v-if="scope.row.trace && scope.row.trace.length > 0" :underline="false" @click="showTraceTable(scope.row)">
              <i class="el-icon-connection el-icon--right"></i>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="函数日志" prop="rpclog" width="96">
          <template slot-scope="scope">
            <el-link
              v-if="scope.row.rpclog !== 0"
              :type="scope.row.errcode > 80 ? 'danger' : scope.row.rpclog < 0 ? 'warning' : 'primary'"
              :underline="false"
              @click="showCacheLog(scope.row)"
            >
              {{ Math.abs(scope.row.rpclog) }} 条
            </el-link>
          </template>
        </el-table-column>
        </el-table>
      </div>
    </el-card>


    <el-dialog :visible.sync="traceTableVisible" title="调用链" width="99%" custom-class="compact-dialog">

      <div ref="trace0" style="height: 800px; width: 100%;"></div>
    </el-dialog>

    <el-dialog :visible.sync="showJson" width="66%" title="数据预览" custom-class="compact-dialog">

      <json-viewer
        :boxed="true"
        :copyable="true"
        :expand-depth="8"
        :show-array-index="false"
        :value="jsonData"
        show-double-quotes
        sort
      />
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showJson = false">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="showMsg" title="查看详情" width="98%" custom-class="compact-dialog">

      <span class="rpc-log-page__detail-text">{{ rpcMsg }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showMsg = false">确 定</el-button>
      </span>
    </el-dialog>

    <el-drawer :with-header="false" :visible.sync="showLog" direction="ltr" size="74%">

      <div class="log-stream rpc-log-page__drawer-log" v-infinite-scroll="load" :infinite-scroll-disabled="rpcLogLoading || rpcLogFinished || !showLog">
        <div v-if="rpcLog.length === 0 && !rpcLogLoading" class="muted-text">暂无日志，请继续滚动或稍后重试。</div>
        <div v-for="(item, index) in rpcLog" :key="index + '' + item.ts" class="log-stream__item" :style="{ color: levelColor[item.level] }">
          <span class="log-stream__meta">{{ item.ts }}</span>
          {{ '【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content }}
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import request from "@/utils/request";
import 'vue-json-viewer/style.css';
import Cookies from "js-cookie";
import * as echarts from "echarts";

export default {
  name: "Rpclogs",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")) || {},
      period: [new Date(Date.now() - Date.now() % (24 * 3600 * 1000) - 728 * 3600 * 1000), new Date()],
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#9E9E9E', '#8BC34A', '#409EFF', '#E6A23C', '#ff0000'],
      page: 1,
      ts: null,
      rid: null,
      clientip: null,
      useragent: null,
      referer: null,
      sign: null,
      code: null,
      msg: null,
      request: null,
      response: null,
      mincosttime: null,
      maxcosttime: null,
      minrpclog: null,
      maxrpclog: null,
      fapp: [],
      tappip: null,
      error: false,
      tableData: [],
      loading: false,
      funcChoose: null,
      historyIp: [],
      historyFunc: [],
      historyCaller: [],
      traceTableVisible: false,
      showJson: false,
      jsonData: {},
      showLog: false,
      showMsg: false,
      queryError: false,
      noCache: false,
      rpcLog: [],
      rpcMsg: '',
      rpcLogLoading: false,
      rpcLogFinished: false,
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
      rpcLogPage: 1,
      rpcLogRid: null
    };
  },
  computed: {
    hasResponsePermission() {
      return this.appInfo.role === 1;
    },
    activeFilterCount() {
      return [
        this.rid,
        this.clientip,
        this.useragent,
        this.referer,
        this.sign,
        this.code,
        this.msg,
        this.request,
        this.response,
        this.mincosttime,
        this.maxcosttime,
        this.minrpclog,
        this.maxrpclog,
        this.tappip,
        this.funcChoose,
        this.fapp.length ? this.fapp : null,
        this.queryError ? 1 : null,
        this.noCache ? 1 : null
      ].filter(item => item !== null && item !== undefined && item !== '' && !(Array.isArray(item) && item.length === 0)).length;
    },
    periodText() {
      if (!this.period || !this.period[0] || !this.period[1]) {
        return '-';
      }
      return `${this.period[0].format("MM-dd hh:mm")} 至 ${this.period[1].format("MM-dd hh:mm")}`;
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({ path: "/" });
      return;
    }
    this.getAppNodeAndFuncList();
  },
  methods: {
    formatCaller(value) {
      if (value === 'router') return 'HTTP网关';
      if (value === 'cron') return '定时作业';
      return value;
    },
    rowHighlightStyle(row) {
      if (row.errcode > 80) {
        return { color: '#ef4444' };
      }
      if (row.rpclog < 0) {
        return { color: '#f59e0b' };
      }
      return {};
    },
    copyText(text, label) {
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success(`${label} 已复制`);
        }).catch(() => {
          this.fallbackCopyText(text, label);
        });
      } else {
        this.fallbackCopyText(text, label);
      }
    },
    fallbackCopyText(text, label) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success(`${label} 已复制`);
      } catch (e) {
        this.$message.warning('复制失败，请手动复制');
      }
      document.body.removeChild(textarea);
    },
    resetFilters() {
      this.page = 1;
      this.rid = null;
      this.clientip = null;
      this.useragent = null;
      this.referer = null;
      this.sign = null;
      this.code = null;
      this.msg = null;
      this.request = null;
      this.response = null;
      this.mincosttime = null;
      this.maxcosttime = null;
      this.minrpclog = null;
      this.maxrpclog = null;
      this.fapp = [];
      this.tappip = null;
      this.funcChoose = null;
      this.queryError = false;
      this.noCache = false;
      this.period = [new Date(Date.now() - Date.now() % (24 * 3600 * 1000) - 728 * 3600 * 1000), new Date()];
      this.getLogTable();
    },
    load() {
      if (!this.rpcLogRid || this.rpcLogLoading || this.rpcLogFinished) {
        return;
      }
      this.rpcLogLoading = true;
      request({
        url: "/admin/rpclog/getRpcLog",
        params: {
          page: this.rpcLogPage,
          rid: this.rpcLogRid
        }
      }).then((res) => {
        const list = res.data || [];
        if (list.length === 0) {
          this.rpcLogFinished = true;
          return;
        }
        this.rpcLogPage++;
        list.forEach(x => this.rpcLog.push(x));
      }).finally(() => {
        this.rpcLogLoading = false;
      });
    },
    showRpcMsg(item) {
      this.showMsg = true;
      this.rpcMsg = item;
    },
    showCacheLog(item) {
      this.rpcLog = [];
      this.rpcLogPage = 1;
      this.rpcLogRid = item.rid;
      this.rpcLogLoading = false;
      this.rpcLogFinished = false;
      this.showLog = true;
      this.load();
    },
    showJsonWin(item) {
      this.showJson = true;
      let json = item;
      if (item.indexOf('<span style="color:red">') !== -1) {
        json = item.replace('<span style="color:red">', '').replace('</span>', '');
      }
      try {
        this.jsonData = JSON.parse(json);
      } catch (e) {
        this.jsonData = { raw: json };
      }
    },
    showTraceTable(item) {
      this.loading = true;
      request({
        url: "/admin/rpclog/getTraceMemos",
        params: {
          rid: item.rid,
          trace: item.trace
        }
      }).then((res) => {
        this.traceTableVisible = true;
        item.children = res.data;
        item.response0 = res.msg;
        const data = {
          app: item.fapp,
          appip: item.fappip,
          type: 'node',
          costtime: item.costtime,
          code: item.code,
          msg: item.msg,
          response: item.response0,
          children: this.formatTraceData([item])
        };
        this.$nextTick(() => {
          if (item.fapp === 'router') {
            data.app = '网关';
            this.initEchartsTrace0({
              app: 'HTTP客户端',
              appip: item.clientip,
              type: 'node',
              useragent: item.useragent,
              referer: item.referer,
              children: [data]
            });
          } else {
            this.initEchartsTrace0(data);
          }
        });
      }).finally(() => {
        this.loading = false;
      });
    },
    formatTraceData(data) {
      if (data === undefined || data === null) return null;
      return data.map(x => {
        x.type = 'line';
        x.symbolSize = 0.1;
        x.emphasis = { symbolSize: 0.1, itemStyle: { color: 'transparent' }, lineStyle: { width: 3, color: '#bbb', opacity: 1 } };
        x.itemStyle = { color: 'transparent' };
        x.label = { show: true, position: [-66, -7], color: x.errcode > 80 ? '#f80000' : x.rpclog < 0 ? '#E6A23C' : '#5ba900', fontSize: 12 };
        x.children = [{
          type: 'node',
          app: x.tapp,
          appip: x.tappip,
          costtime: x.costtime,
          code: x.code,
          msg: x.msg,
          response: x.response0 || x.response,
          children: this.formatTraceData(x.children)
        }];
        return x;
      });
    },
    showCache(item) {
      this.loading = true;
      request({
        url: "/admin/rpclog/getCache",
        params: {
          rid: (item.errcode === 18 || item.errcode === 20) ? item.response : item.rid
        }
      }).then((res) => {
        this.showJson = true;
        let response = res.data.response;
        if (response != null && response.length > 0) {
          if (response.charAt(0) !== '{' && response.charAt(0) !== '"' && response.charAt(0) !== '[') {
            response = '"' + response + '"';
          }
        }
        try {
          this.jsonData = JSON.parse(response);
        } catch (e) {
          this.jsonData = { raw: response };
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    getAppNodeAndFuncList() {
      request({
        url: "/admin/home/getAppNodeAndFuncList",
        params: {}
      }).then((res) => {
        this.historyCaller = res.data.app.map(x => x.replace('cron', '定时作业').replace('router', 'http网关'));
        this.historyIp = res.data.ipaddr;
        this.historyFunc = res.data.func;
      });
    },
    tableRowClassName(index) {
      if (index.columnIndex === 1 || index.columnIndex === 12) {
        if (index.row.errcode > 80) {
          return 'error-row';
        }
        return 'success-row';
      }
      return '';
    },
    getLogTable() {
      this.page = 1;
      this.getLogTable0();
    },
    getLogTablePre() {
      if (this.page > 1) {
        this.page--;
        this.getLogTable0();
      }
    },
    getLogTableNext() {
      this.page++;
      this.getLogTable0();
    },
    getLogTable0() {
      if (this.period == null || this.period[0] == null || this.period[1] == null) {
        this.$message.error("开始或结束时间不能为空");
        return;
      }
      this.loading = true;
      request({
        method: 'post',
        url: "/admin/rpclog/getMemos",
        data: {
          page: this.page,
          start: this.period[0].format("yyyy-MM-dd hh:mm:ss"),
          end: this.period[1].format("yyyy-MM-dd hh:mm:ss"),
          rid: this.rid,
          clientip: this.clientip,
          useragent: this.useragent,
          referer: this.referer,
          sign: this.sign,
          code: this.code,
          msg: this.msg,
          request: this.request,
          response: this.response,
          mincosttime: this.mincosttime,
          maxcosttime: this.maxcosttime,
          minrpclog: this.minrpclog,
          maxrpclog: this.maxrpclog,
          tappip: this.tappip,
          fapp: this.fapp.map(x => x.replace('定时作业', 'cron').replace('http网关', 'router')),
          func: (this.funcChoose == null || this.funcChoose[0] == null || this.funcChoose[1] == null) ? null : (this.app + '/' + this.funcChoose[0] + '/' + this.funcChoose[1]),
          module: this.funcChoose == null ? null : this.funcChoose[0],
          queryError: this.queryError ? 1 : 0,
          noCache: this.noCache ? 1 : 0
        }
      }).then((res) => {
        if (res.code === 0) this.tableData = res.data;
      }).finally(() => {
        this.loading = false;
      });
    },
    getLogTableCount() {
      this.loading = true;
      request({
        method: 'post',
        url: "/admin/rpclog/getMemosNum",
        data: {
          start: this.period !== null ? this.period[0].format("yyyy-MM-dd hh:mm:ss") : null,
          end: this.period !== null ? this.period[1].format("yyyy-MM-dd hh:mm:ss") : null,
          rid: this.rid,
          clientip: this.clientip,
          useragent: this.useragent,
          referer: this.referer,
          sign: this.sign,
          code: this.code,
          msg: this.msg,
          request: this.request,
          response: this.response,
          mincosttime: this.mincosttime,
          maxcosttime: this.maxcosttime,
          minrpclog: this.minrpclog,
          maxrpclog: this.maxrpclog,
          tappip: this.tappip,
          fapp: this.fapp.map(x => x.replace('定时作业', 'cron').replace('http网关', 'router')),
          func: (this.funcChoose == null || this.funcChoose[0] == null || this.funcChoose[1] == null) ? null : (this.app + '/' + this.funcChoose[0] + '/' + this.funcChoose[1]),
          module: this.funcChoose == null ? null : this.funcChoose[0],
          queryError: this.queryError ? 1 : 0,
          noCache: this.noCache ? 1 : 0
        }
      }).then((res) => {
        if (res.code === 0) {
          this.$alert('总计 ' + res.data + ' 条', '总数', {
            confirmButtonText: '确定'
          });
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    formatResSize(reslen) {
      if (reslen < 1000) {
        return reslen + 'B';
      } else if (reslen < 1000000) {
        return (reslen / 1024).toFixed(2) + 'KB';
      }
      return (reslen / 1024 / 1024).toFixed(2) + 'MB';
    },
    initEchartsTrace0(data) {
      const chart = echarts.getInstanceByDom(this.$refs.trace0) || echarts.init(this.$refs.trace0);
      chart.setOption({
        title: {},
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          enterable: true,
          formatter: function(params) {
            const nodeData = params.data;
            if (nodeData.type === 'line') {
              return `<div style="font-size: 13px;line-height: 16px;width: 800px;">
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">调用时间</span>:&nbsp;&nbsp;${nodeData.ts}</p>
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">调用方法</span>:&nbsp;&nbsp;${nodeData.func}</p>
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">请求rid</span>:&nbsp;&nbsp;${nodeData.rid.replaceAll('-', '')}</p>
                <p style="display: -webkit-box;overflow: hidden;white-space: normal !important;text-overflow: ellipsis;word-wrap: break-word;-webkit-line-clamp: 5;  -webkit-box-orient: vertical;">
                <span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">请求参数</span>:&nbsp;&nbsp;${nodeData.request}</p>
              </div>`;
            }
            return `<div style="font-size: 13px;line-height: 16px;width: 800px;">
                ${nodeData.app === 'HTTP客户端' ? `
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">APP</span>:&nbsp;&nbsp;${nodeData.app}</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">IP地址</span>:&nbsp;&nbsp;${nodeData.appip}</p>
                    <p style="display: -webkit-box;overflow: hidden;white-space: normal !important;text-overflow: ellipsis;word-wrap: break-word;-webkit-line-clamp: 5;  -webkit-box-orient: vertical;">
                    <span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">UA</span>:&nbsp;&nbsp;${nodeData.useragent}</p>
                    <p style="display: -webkit-box;overflow: hidden;white-space: normal !important;text-overflow: ellipsis;word-wrap: break-word;-webkit-line-clamp: 5;  -webkit-box-orient: vertical;">
                    <span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">Referer</span>:&nbsp;&nbsp;${nodeData.referer}</p>
                ` : `
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">APP</span>:&nbsp;&nbsp;${nodeData.app}</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">IP地址</span>:&nbsp;&nbsp;${nodeData.appip}</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">执行耗时</span>:&nbsp;&nbsp;${nodeData.costtime}毫秒</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">返回code</span>:&nbsp;&nbsp;${nodeData.code}</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">返回msg</span>:&nbsp;&nbsp;${nodeData.msg}</p>
                    <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">返回data</span>:&nbsp;&nbsp;${nodeData.response}</p>
                `}
              </div>`;
          }
        },
        series: [{
          type: 'tree',
          name: 'tree1',
          data: [data],
          symbolSize: 77,
          initialTreeDepth: 100,
          lineStyle: { width: 3, color: '#bbb', opacity: 1 },
          label: {
            verticalAlign: 'middle',
            show: true,
            formatter: (params) => {
              const paramData = params.data;
              if (paramData.type === 'line') return paramData.func;
              if (paramData.app === 'HTTP客户端') return paramData.app + "\n" + paramData.appip;
              return paramData.app + "\n" + paramData.appip + "\n" + paramData.costtime + "毫秒";
            }
          },
          leaves: { label: { verticalAlign: 'middle' } },
          expandAndCollapse: false
        }]
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.error-row {
  color: #ef4444;
}

.success-row {
  color: #0f172a;
}

.cell {
  white-space: pre-line !important;
}

.httptext {
  display: -webkit-box;
  overflow: hidden;
  padding-right: 14px;
  white-space: normal !important;
  text-overflow: ellipsis;
  word-wrap: break-word;
  font-size: 12px;
  line-height: 1.45;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.rpc-log-page {
  height: calc(100vh - 66px);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.rpc-log-page__filter-card {
  flex: 0 0 auto;
}

.rpc-log-page__table-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}


.rpc-log-page__filter-grid {
  gap: 4px;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}


.rpc-log-page__range {
  grid-column: span 3;
  min-width: 380px;
}


.rpc-log-page__table-shell {
  height: 100%;
  min-height: 0;
}


.rpc-log-page__summary-grid {
  margin-top: 14px;
}

.rpc-log-page__summary-time {
  font-size: 16px;
}

::v-deep .rpc-log-page__filter-card .el-card__body {
  padding: 8px 10px;
}

::v-deep .rpc-log-page__table-card .el-card__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 12px;
}

::v-deep .rpc-log-page__filter-grid .el-input__inner,
::v-deep .rpc-log-page__filter-grid .el-range-editor.el-input__inner,
::v-deep .rpc-log-page__filter-grid .el-cascader .el-input__inner,
::v-deep .rpc-log-page__filter-grid .el-select .el-input__inner {
  height: 28px;
  font-size: 12px;
  line-height: 28px;
}

::v-deep .rpc-log-page__filter-grid .el-input__icon,
::v-deep .rpc-log-page__filter-grid .el-input__suffix,
::v-deep .rpc-log-page__filter-grid .el-input__prefix,
::v-deep .rpc-log-page__filter-grid .el-range__icon,
::v-deep .rpc-log-page__filter-grid .el-range__close-icon {
  line-height: 28px;
}

::v-deep .rpc-log-page__filter-grid .el-cascader,
::v-deep .rpc-log-page__filter-grid .el-select,
::v-deep .rpc-log-page__filter-grid .el-date-editor {
  width: 100%;
}

::v-deep .rpc-log-page__filter-grid .el-button {
  min-height: 28px;
  padding: 6px 10px;
  font-size: 12px;
}

::v-deep .rpc-log-page__filter-grid .el-button [class*="el-icon-"] {
  font-size: 12px;
}

::v-deep .rpc-log-page__filter-grid .el-checkbox.is-bordered {
  display: inline-flex;
  align-items: center;
  height: 28px;
  margin-left: 0;
  padding: 0 8px 0 6px;
  font-size: 12px;
  line-height: 26px;
}

::v-deep .rpc-log-page__filter-grid .el-checkbox.is-bordered .el-checkbox__label {
  padding-left: 4px;
}

::v-deep .rpc-log-page__filter-grid .el-tag {
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 22px;
}

.rpc-log-page__action-group {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  grid-column: -5 / -1;
  justify-self: end;
  width: max-content;
  max-width: 100%;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}



::v-deep .rpc-log-page__range.el-date-editor {

  width: 100%;
  min-width: 0;
}

::v-deep .rpc-log-page__range.el-date-editor .el-range-input,
::v-deep .rpc-log-page__range.el-date-editor .el-range-separator,
::v-deep .rpc-log-page__range.el-date-editor .el-range__icon,
::v-deep .rpc-log-page__range.el-date-editor .el-range__close-icon {
  line-height: 28px;
}



.rpc-log-page__switches {

  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.rpc-log-page__pager {
  gap: 6px;
}

.rpc-log-page__rid-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.rpc-log-page__caller-cell {
  font-size: 12px;
  line-height: 1.45;
}

.rpc-log-page__view-link {
  position: absolute;
  right: 0;
  bottom: -2px;
}

.rpc-log-page__detail-text {
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.rpc-log-page__drawer-log {
  min-height: calc(100vh - 12px);
  max-height: calc(100vh - 12px);
  border-radius: 0;
}

@media (max-width: 1200px) {
  .rpc-log-page__range {
    grid-column: span 2;
    min-width: 0;
  }
}

@media (max-width: 992px) {
  .rpc-log-page {
    height: auto;
    min-height: auto;
  }

  .rpc-log-page__table-card {
    min-height: calc(100vh - 240px);
  }

  .rpc-log-page__range {
    grid-column: span 1;
  }

  .rpc-log-page__action-group {
    grid-column: span 1;
    flex-wrap: wrap;
    white-space: normal;
  }
}




</style>

