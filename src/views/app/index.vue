<template>
  <div class="page-shell app-dashboard" v-loading="loading">
    <div class="app-dashboard__top-row">
      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">应用信息</div>
            <div class="panel-subtitle">基础资料来自当前应用上下文，管理权限操作可在此继续深入维护。</div>
          </div>
          <div v-if="canManage" class="panel-header__actions">
            <el-button size="small" type="primary" icon="el-icon-edit-outline" @click="getAppInfo">编辑信息</el-button>
            <el-button size="small" type="success" icon="el-icon-user-solid" @click="getAppAcc">权限成员</el-button>
            <el-button size="small" type="warning" icon="el-icon-monitor" @click="getAppHost(true)">部署主机</el-button>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <div class="info-item__label">应用名称</div>
            <div class="info-item__value">{{ appInfo.name || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">应用描述</div>
            <div class="info-item__value">{{ appInfo.description || '暂无描述' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">创建时间</div>
            <div class="info-item__value">{{ appInfo.createtime || '-' }}</div>
          </div>
          <div class="info-item">
            <div class="info-item__label">最近更新时间</div>
            <div class="info-item__value">{{ appInfo.updatetime || '-' }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">今日运行态势</div>
            <div class="panel-subtitle">点击请求类指标可查看模块与函数的负载详情。</div>
          </div>
          <div class="panel-header__actions muted-text">数据更新时间：{{ dashboardUpdateTime }}</div>
        </div>
        <div class="metric-grid app-dashboard__runtime-grid">
          <div
            v-for="item in callMetrics"
            :key="item.label"
            :class="['metric-card', item.className, { 'metric-card--interactive': item.type !== null }]"
            @click="item.type !== null && item.value > 0 ? showTree(item.type) : null"
          >
            <div class="metric-card__label">{{ item.label }}</div>
            <div class="metric-card__value">{{ item.value }}</div>
          </div>
          <div v-for="item in latencyMetrics" :key="item.label" :class="['metric-card', item.className]">
            <div class="metric-card__label">{{ item.label }}</div>
            <div class="metric-card__value">{{ item.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="panel-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">应用负载趋势</div>
          <div class="panel-subtitle">对比今天、昨日与一周前同时间段的请求量变化。</div>
        </div>
        <el-select v-model="chartGranularity" size="small" style="width: 120px;" @change="onGranularityChange">
          <el-option label="1分钟" value="1"></el-option>
          <el-option label="5分钟" value="5"></el-option>
          <el-option label="15分钟" value="15"></el-option>
          <el-option label="30分钟" value="30"></el-option>
          <el-option label="1小时" value="60"></el-option>
        </el-select>
      </div>
      <div ref="main0" class="app-dashboard__chart app-dashboard__chart--large"></div>
    </el-card>


    <el-card class="panel-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">历史数据分析</div>
          <div class="panel-subtitle">支持按时间范围与具体模块 / 函数查看调用量和时延变化。</div>
        </div>
      </div>
      <div class="page-toolbar app-dashboard__history-toolbar">
        <div class="page-toolbar__group page-toolbar__grow">
          <el-date-picker
            v-model="period"
            class="app-dashboard__history-range"
            :default-value="new Date(Date.now() - 31 * 24 * 3600 * 1000)"
            :picker-options="pickerOptions"
            align="right"
            end-placeholder="结束日期"
            range-separator="至"
            size="small"
            start-placeholder="开始日期"
            type="daterange"
          />
          <el-cascader
            v-model="funcChoose"
            class="app-dashboard__history-cascader"
            :options="historyFunc"
            :props="{ checkStrictly: true }"
            clearable
            filterable
            placeholder="全部模块 / 函数"
            separator="/"
            size="small"
          />
        </div>
        <div class="page-toolbar__group">
          <el-button size="small" @click="resetHistoryFilter">重置</el-button>
          <el-button size="small" type="primary" icon="el-icon-search" @click="getStatList">查询</el-button>
        </div>
      </div>

      <div class="app-dashboard__chart-grid">
        <div ref="main1" class="app-dashboard__chart"></div>
        <div ref="main2" class="app-dashboard__chart"></div>
      </div>
    </el-card>
    <el-card class="panel-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">流量结构总览</div>
          <div class="panel-subtitle">基于今日实时流量与近 14 天历史聚合，快速看清调用结构和稳定性变化。</div>
        </div>
      </div>
      <div class="app-dashboard__overview-grid">
        <div class="app-dashboard__overview-panel app-dashboard__overview-panel--summary">
          <div class="app-dashboard__overview-metrics">
            <div v-for="item in flowOverviewMetrics" :key="item.label" class="app-dashboard__mini-stat">
              <div class="app-dashboard__mini-stat-label">{{ item.label }}</div>
              <div class="app-dashboard__mini-stat-value">{{ item.value }}</div>
              <div class="app-dashboard__mini-stat-tip">{{ item.tip }}</div>
            </div>
          </div>
          <div ref="overviewMixChart" class="app-dashboard__chart app-dashboard__chart--medium"></div>
        </div>
        <div ref="overviewTrendChart" class="app-dashboard__chart app-dashboard__chart--medium"></div>
      </div>
    </el-card>

    <div class="app-dashboard__insight-grid">
      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">热门模块 / 函数</div>
            <div class="panel-subtitle">汇总 HTTP、RPC、定时任务与异常热点，快速定位业务焦点。</div>
          </div>
        </div>
        <div class="app-dashboard__dual-chart">
          <div>
            <div class="section-caption">调用 Top 8</div>
            <div ref="overviewRankChart" class="app-dashboard__chart app-dashboard__chart--small"></div>
          </div>
          <div>
            <div class="section-caption">风险 Top 8</div>
            <div ref="overviewRiskChart" class="app-dashboard__chart app-dashboard__chart--small"></div>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">主机健康概览</div>
            <div class="panel-subtitle">复用部署主机数据，补充健康状态、环境分布与待处理问题。</div>
          </div>
        </div>
        <div class="app-dashboard__overview-metrics app-dashboard__overview-metrics--compact">
          <div v-for="item in hostOverviewMetrics" :key="item.label" class="app-dashboard__mini-stat">
            <div class="app-dashboard__mini-stat-label">{{ item.label }}</div>
            <div class="app-dashboard__mini-stat-value">{{ item.value }}</div>
            <div class="app-dashboard__mini-stat-tip">{{ item.tip }}</div>
          </div>
        </div>
        <div class="app-dashboard__host-overview">
          <div ref="hostEnvChart" class="app-dashboard__chart app-dashboard__chart--small"></div>
          <div class="app-dashboard__mini-list">
            <div class="section-caption">待关注主机</div>
            <div v-if="invalidHosts.length === 0" class="muted-text">暂无异常主机</div>
            <div v-for="item in invalidHosts" :key="item.id" class="app-dashboard__mini-list-item">
              <div class="app-dashboard__mini-list-main">{{ item.ip }}:{{ item.port }}</div>
              <el-tag size="mini" :type="hostValidType(item.valid)">{{ hostValidText(item.valid) }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">API 资产概览</div>
            <div class="panel-subtitle">统计接口总量、签名覆盖率与模块分布，辅助接口治理和开放评估。</div>
          </div>
        </div>
        <div class="app-dashboard__overview-metrics app-dashboard__overview-metrics--compact">
          <div v-for="item in apiOverviewMetrics" :key="item.label" class="app-dashboard__mini-stat">
            <div class="app-dashboard__mini-stat-label">{{ item.label }}</div>
            <div class="app-dashboard__mini-stat-value">{{ item.value }}</div>
            <div class="app-dashboard__mini-stat-tip">{{ item.tip }}</div>
          </div>
        </div>
        <div class="app-dashboard__api-overview">
          <div ref="apiAssetChart" class="app-dashboard__chart app-dashboard__chart--small"></div>
          <div class="app-dashboard__mini-list">
            <div class="section-caption">模块 Top 6</div>
            <div v-if="apiModuleRank.length === 0" class="muted-text">暂无接口资产数据</div>
            <div v-for="item in apiModuleRank.slice(0, 6)" :key="item.service" class="app-dashboard__mini-list-item">
              <div class="app-dashboard__mini-list-main">{{ item.label }}</div>
              <div class="app-dashboard__mini-list-value">{{ item.value }} 个</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog :visible.sync="dialogTableVisible" title="应用信息" width="720px" custom-class="compact-dialog">

      <div class="panel-stack">
        <el-input v-model="app" :disabled="true" class="flex-prepend-input">
          <template slot="prepend">应用</template>
        </el-input>
        <el-input v-model="appInfo_.token" :disabled="true" class="flex-prepend-input">
          <template slot="prepend">令牌</template>
        </el-input>
        <div class="app-dashboard__dialog-scroll">
          <el-input v-model="appInfo_.name" class="flex-prepend-input">
            <template slot="prepend">别名</template>
          </el-input>
          <el-input v-model="appInfo_.description" class="flex-prepend-input">
            <template slot="prepend">描述</template>
          </el-input>
          <el-input v-model="appInfo_.giturl" class="flex-prepend-input">
            <template slot="prepend">Git 地址</template>
          </el-input>
          <el-input v-model="appInfo_.gituser" class="flex-prepend-input">
            <template slot="prepend">Git 用户</template>
          </el-input>
          <el-input v-model="appInfo_.gitpwd" class="flex-prepend-input" show-password>
            <template slot="prepend">Git 密码</template>
          </el-input>
          <el-input v-model="appInfo_.pomfile" class="flex-prepend-input">
            <template slot="prepend">pom.xml</template>
          </el-input>
          <el-input v-model="appInfo_.branch" class="flex-prepend-input">
            <template slot="prepend">默认分支</template>
          </el-input>
          <el-input v-model="appInfo_.webhook" class="flex-prepend-input">
            <template slot="prepend">Webhook</template>
          </el-input>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogTableVisible = false">取 消</el-button>
        <el-button type="primary" @click="updateAppInfo">更 新</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogTableVisible1" title="应用权限" width="760px">
      <div class="app-dashboard__permission-grid">
        <div class="app-dashboard__permission-card">
          <div class="app-dashboard__permission-title">管理成员</div>
          <div class="app-dashboard__permission-tags">
            <el-tag
              v-for="tag in dynamicTags0"
              :key="tag"
              closable
              disable-transitions
              type="danger"
              @close="handleClose(tag, 0)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible0"
              ref="saveTagInput0"
              v-model="inputValue0"
              class="input-new-tag"
              size="small"
              @blur="handleInputConfirm(0)"
              @keyup.enter.native="handleInputConfirm(0)"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput(0)">+ 新增</el-button>
          </div>
        </div>
        <div class="app-dashboard__permission-card">
          <div class="app-dashboard__permission-title">协作成员</div>
          <div class="app-dashboard__permission-tags">
            <el-tag
              v-for="tag in dynamicTags1"
              :key="tag"
              closable
              disable-transitions
              type="success"
              @close="handleClose(tag, 1)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible1"
              ref="saveTagInput1"
              v-model="inputValue1"
              class="input-new-tag"
              size="small"
              @blur="handleInputConfirm(1)"
              @keyup.enter.native="handleInputConfirm(1)"
            />
            <el-button v-else class="button-new-tag" size="small" @click="showInput(1)">+ 新增</el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogTableVisible3" :title="hostDialogTitle" width="700px" @closed="resetHostForm" custom-class="compact-dialog">
      <div class="filter-grid filter-grid--dense">

        <el-input v-model="hostIp" placeholder="主机地址" />
        <el-input v-model="hostPort" placeholder="主机端口" @input="hostPort = (hostPort + '').replace(/[^\d]/g, '')" />
        <el-input v-model="hostUsername" placeholder="访问用户" />
        <el-input v-model="hostPassword" placeholder="访问密码" show-password />
        <el-input v-model="hostEnv" placeholder="主机环境" />
        <el-input v-model="hostDeploy" placeholder="部署路径" />
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogTableVisible3 = false">取 消</el-button>
        <el-button type="primary" @click="hostAddOrEdit">保 存</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="dialogTableVisible2" title="应用主机" width="72%" custom-class="compact-dialog">

      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">主机列表</div>
          <div class="panel-subtitle">仅展示当前应用关联主机，可直接发起连接测试。</div>
        </div>
        <div class="panel-header__actions">
          <el-button size="small" type="warning" icon="el-icon-plus" @click="openHostDialog()">新增主机</el-button>
        </div>
      </div>
      <el-table :data="app_hosts" class="app-dashboard__host-table" stripe size="mini">

        <el-table-column label="主机地址" prop="ip" min-width="128" show-overflow-tooltip />
        <el-table-column label="端口" prop="port" width="82" />
        <el-table-column label="环境" prop="env" min-width="108" show-overflow-tooltip />
        <el-table-column label="访问用户" prop="username" min-width="108" show-overflow-tooltip />
        <el-table-column label="密码" prop="password" min-width="108" show-overflow-tooltip />
        <el-table-column label="部署路径" prop="deploy" min-width="156" show-overflow-tooltip />
        <el-table-column label="连通性" width="108">
          <template slot-scope="scope">
            <el-tag :type="hostValidType(scope.row.valid)">{{ hostValidText(scope.row.valid) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="canManage" label="操作" width="188" fixed="right">
          <template slot-scope="scope">
            <div class="table-actions app-dashboard__table-actions">
              <el-button type="text" @click="openHostDialog(scope.row)">编辑</el-button>
              <el-button type="text" @click="confirmDeleteHost(scope.row)">删除</el-button>
              <el-button type="text" @click="appHostCheck(scope.row)">连接测试</el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>

    </el-dialog>

    <el-dialog :visible.sync="showLoadTree" :title="loadTreeTitle[chooseNum] + ' 负载详情'" width="560px" custom-class="compact-dialog">

      <div class="tree-shell">
        <el-tree
          :data="loadTree"
          :props="{ children: 'children', label: 'label' }"
          :render-content="renderContent"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import * as echarts from "echarts";
import Cookies from "js-cookie";

export default {
  name: "AppCommon",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")) || {},
      appInfo_: {},
      loading: false,
      dashboard: {
        http: 0,
        rpc: 0,
        task: 0,
        err: 0,
        warn: 0,
        avg: 0,
        p90: '-',
        p95: '-',
        p99: '-'
      },
      timerId: null,
      funcChoose: null,
      historyFunc: [],
      dialogTableVisible: false,
      dialogTableVisible1: false,
      dialogTableVisible2: false,
      dialogTableVisible3: false,
      period: [new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date(Date.now() - 24 * 3600 * 1000)],
      pickerOptions: {},
      dynamicTags0: [],
      dynamicTags1: [],
      inputVisible0: false,
      inputVisible1: false,
      inputValue0: '',
      inputValue1: '',
      dashboardUpdateTime: new Date().format("yyyy-MM-dd hh:mm:ss"),
      yesterdayQpm: [],
      lastweekQpm: [],
      chartGranularity: localStorage.getItem('app_chartGranularity_' + (Cookies.get('app') || '')) || '5',
      currentDayQpm: [],
      loadTreeTitle: ['HTTP调用', 'RPC调用', '定时作业', '执行异常', 'ERR日志'],
      chooseNum: 0,
      loadTree: [],
      showLoadTree: false,
      app_hosts: [],
      hostId: 0,
      hostIp: '',
      hostPort: 22,
      hostUsername: '',
      hostPassword: '',
      hostEnv: '',
      hostDeploy: '',
      overviewStats: [],
      loadInsight: {
        normal: [],
        risk: []
      },
      apiAsset: {
        total: 0,
        open: 0,
        sign: 0,
        md5: 0,
        sha256: 0
      },
      apiModules: [],


    }
  },
  computed: {
    canManage() {
      return this.appInfo.role === 1;
    },
    roleLabel() {
      return this.appInfo.role === 1 ? '管理' : this.appInfo.role === 2 ? '协作' : '访客';
    },
    validHostCount() {
      return this.app_hosts.filter(item => item.valid === 1).length;
    },
    hostDialogTitle() {
      return this.hostId === 0 ? '新增主机' : '编辑主机';
    },
    callMetrics() {
      return [
        { label: this.loadTreeTitle[0], value: this.dashboard.http || 0, type: 0, className: 'metric-card--primary', tip: '查看 HTTP 请求负载分布' },
        { label: this.loadTreeTitle[1], value: this.dashboard.rpc || 0, type: 1, className: 'metric-card--success', tip: '查看 RPC 请求负载分布' },
        { label: this.loadTreeTitle[2], value: this.dashboard.task || 0, type: 2, className: 'metric-card--warning', tip: '查看定时作业负载分布' },
        { label: this.loadTreeTitle[3], value: this.dashboard.err || 0, type: 3, className: 'metric-card--danger', tip: '查看异常函数分布' },
        { label: this.loadTreeTitle[4], value: this.dashboard.warn || 0, type: 4, className: 'metric-card--violet', tip: '查看日志异常分布' }
      ];
    },
    latencyMetrics() {
      return [
        { label: '平均时延', value: this.formatLatency(this.dashboard.avg), className: 'metric-card--primary', tip: '整体平均响应耗时' },
        { label: 'P90 时延', value: this.formatLatency(this.dashboard.p90), className: 'metric-card--success', tip: '90% 请求耗时不超过该值' },
        { label: 'P95 时延', value: this.formatLatency(this.dashboard.p95), className: 'metric-card--warning', tip: '95% 请求耗时不超过该值' },
        { label: 'P99 时延', value: this.formatLatency(this.dashboard.p99), className: 'metric-card--danger', tip: '关注长尾请求耗时' }
      ];
    },
    totalCallCount() {
      return this.toNumber(this.dashboard.http) + this.toNumber(this.dashboard.rpc) + this.toNumber(this.dashboard.task);
    },
    flowOverviewMetrics() {
      const total = this.totalCallCount;
      const err = this.toNumber(this.dashboard.err);
      const warn = this.toNumber(this.dashboard.warn);
      return [
        { label: '今日总调用', value: this.formatCompactNumber(total), tip: 'HTTP + RPC + TASK' },
        { label: '成功率', value: this.formatPercent(total > 0 ? ((total - err) / total) * 100 : 0), tip: '按异常请求折算' },
        { label: '错误率', value: this.formatPercent(total > 0 ? (err / total) * 100 : 0), tip: 'ERRCODE > 80' },
        { label: '告警率', value: this.formatPercent(total > 0 ? (warn / total) * 100 : 0), tip: '日志异常占比' }
      ];
    },
    hostOverviewMetrics() {
      const total = this.app_hosts.length;
      const valid = this.validHostCount;
      const invalid = total - valid;
      const envCount = this.hostEnvDistribution.length;
      return [
        { label: '主机总数', value: total || 0, tip: '当前应用已登记主机' },
        { label: '可用主机', value: valid || 0, tip: '连接测试成功' },
        { label: '异常主机', value: invalid > 0 ? invalid : 0, tip: '连接失败或网络不通' },
        { label: '环境数量', value: envCount || 0, tip: '按 env 聚合' }
      ];
    },
    hostEnvDistribution() {
      const envMap = {};
      this.app_hosts.forEach(item => {
        const key = item.env || '未设置';
        envMap[key] = (envMap[key] || 0) + 1;
      });
      return Object.keys(envMap).map(key => ({ name: key, value: envMap[key] })).sort((a, b) => b.value - a.value);
    },
    invalidHosts() {
      return this.app_hosts.filter(item => item.valid !== 1).slice(0, 5);
    },
    apiOverviewMetrics() {
      const total = this.apiAsset.total;
      const signed = this.apiAsset.sign;
      return [
        { label: '接口总数', value: total || 0, tip: '当前应用全部接口' },
        { label: '开放接口', value: this.apiAsset.open || 0, tip: '无需签名即可访问' },
        { label: '签名接口', value: signed || 0, tip: 'MD5 / SHA256 保护' },
        { label: '签名覆盖率', value: this.formatPercent(total > 0 ? (signed / total) * 100 : 0), tip: '接口安全覆盖水平' }
      ];
    },
    apiModuleRank() {
      return this.apiModules.slice().sort((a, b) => b.value - a.value);
    },


  },
  mounted() {
    if (!this.app) {
      this.$router.push({ path: '/' });
      return;
    }
    window.addEventListener('resize', this.handleResize);
    this.getYesterdayAndLastWeekQpm();
    request({
      url: "/admin/home/getAppNodeAndFuncList",
      params: {}
    }).then((res) => {
      this.historyFunc = res.data.func;
    });
    this.timerId = setInterval(this.getDashBoard, 30000);
    this.getStatList();
    this.getOverviewStats();
    this.getLoadInsight();
    this.getApiAssetSummary();
    this.getAppHost();
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    toNumber(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    },
    formatCompactNumber(value) {
      const num = this.toNumber(value);
      if (num >= 10000) {
        return `${(num / 10000).toFixed(num >= 100000 ? 0 : 1)}w`;
      }
      return `${num}`;
    },
    formatPercent(value) {
      const num = this.toNumber(value);
      return `${num.toFixed(1)}%`;
    },
    flattenApiList(list) {
      const result = [];
      (list || []).forEach(moduleItem => {
        (moduleItem.funcList || []).forEach(funcItem => {
          result.push({
            ...funcItem,
            service: moduleItem.service,
            serviceName: moduleItem.name
          });
        });
      });
      return result;
    },
    setEmptyChart(chart, title) {
      chart.clear();
      chart.setOption({
        title: {
          text: title || '暂无数据',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#94a3b8',
            fontSize: 14,
            fontWeight: 500
          }
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      });
    },
    handleResize() {
      ['main0', 'main1', 'main2', 'overviewMixChart', 'overviewTrendChart', 'overviewRankChart', 'overviewRiskChart', 'hostEnvChart', 'apiAssetChart'].forEach(refName => {
        const el = this.$refs[refName];
        if (el) {
          const chart = echarts.getInstanceByDom(el);
          if (chart) {
            chart.resize();
          }
        }
      });
    },
    formatLatency(value) {
      if (value === undefined || value === null || value === 'NaN') {
        return '-';
      }
      return value + 'ms';
    },
    resetHistoryFilter() {

      this.period = [new Date(Date.now() - 30 * 24 * 3600 * 1000), new Date(Date.now() - 24 * 3600 * 1000)];
      this.funcChoose = null;
      this.getStatList();
    },
    showTree(type) {
      this.loading = true;
      this.chooseNum = type;
      request({
        url: "/admin/home/getModuleFuncLoad",
        params: {
          type: type
        }
      }).then(res => {
        if (res.code === 0) {
          this.loadTree = [...new Set(res.data.map(x => x.module))].map(x => {
            return {
              label: x,
              value: res.data.filter(y => y.module === x).map(y => y.num).reduce((a, b) => a + b, 0),
              children: res.data.filter(y => y.module === x).map(y => {
                return { label: y.func, value: y.num };
              })
            };
          });
          this.showLoadTree = true;
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    renderContent(h, { node, data }) {
      return (
        <span class="custom-tree-node">
          <span>{node.label + '    ：'}</span>
          <span>
            <el-button size="mini" type="text">{data.value}</el-button>
          </span>
        </span>
      );
    },
    getAppInfo() {
      request({
        url: "/admin/home/getAppInfo",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.dialogTableVisible = true;
          this.appInfo_ = res.data;
        }
      });
    },
    updateAppInfo() {
      request({
        url: "/admin/home/updateAppInfo",
        params: {
          name: this.appInfo_.name,
          description: this.appInfo_.description,
          giturl: this.appInfo_.giturl,
          gituser: this.appInfo_.gituser,
          gitpwd: this.appInfo_.gitpwd,
          pomfile: this.appInfo_.pomfile,
          branch: this.appInfo_.branch,
          webhook: this.appInfo_.webhook
        }
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('更新成功');
          this.dialogTableVisible = false;
          this.$router.push({ path: "/" });
        }
      });
    },
    getAppAcc() {
      request({
        url: "/admin/home/getAppAcc",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.dialogTableVisible1 = true;
          this.dynamicTags0 = [];
          this.dynamicTags1 = [];
          res.data.map(x => this['dynamicTags' + (x.role - 1)].push(x.userid));
        }
      });
    },
    getAppHost(showDialog) {
      request({
        url: "/admin/home/getAppHost",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.app_hosts = res.data;
          if (showDialog) {
            this.dialogTableVisible2 = true;
          }
          this.$nextTick(() => {
            this.renderHostEnvChart();
          });
        }
      });
    },

    resetHostForm() {
      this.hostId = 0;
      this.hostIp = '';
      this.hostPort = 22;
      this.hostUsername = '';
      this.hostPassword = '';
      this.hostEnv = '';
      this.hostDeploy = '';
    },
    openHostDialog(row) {
      if (row) {
        this.hostId = row.id;
        this.hostIp = row.ip;
        this.hostPort = row.port;
        this.hostUsername = row.username;
        this.hostPassword = row.password;
        this.hostEnv = row.env;
        this.hostDeploy = row.deploy;
      } else {
        this.resetHostForm();
      }
      this.dialogTableVisible3 = true;
    },
    hostAddOrEdit() {
      const url = this.hostId === 0 ? "/admin/home/addAppHost" : "/admin/home/updateAppHost";
      request({
        url: url,
        params: {
          id: this.hostId,
          ip: this.hostIp,
          port: this.hostPort,
          username: this.hostUsername,
          password: this.hostPassword,
          env: this.hostEnv,
          deploy: this.hostDeploy
        }
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('操作成功');
          this.dialogTableVisible3 = false;
          this.getAppHost();
        }
      });
    },
    confirmDeleteHost(row) {
      this.$confirm(`确认删除主机 ${row.ip}:${row.port} 吗？`, '删除主机', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.appHostDel(row);
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    appHostDel(row) {
      request({
        url: "/admin/home/delAppHost",
        params: { id: row.id }
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('删除成功');
          this.getAppHost();
        }
      });
    },
    appHostCheck(row) {
      this.loading = true;
      request({
        url: "/admin/home/appHostCheck",
        params: { id: row.id }
      }).finally(() => {
        this.getAppHost();
        this.loading = false;
      });
    },
    hostValidType(valid) {
      if (valid === 1) return 'success';
      if (valid === 0) return 'danger';
      return 'info';
    },
    hostValidText(valid) {
      if (valid === 1) return '连接成功';
      if (valid === 0) return '连接失败';
      return '网络不通';
    },
    handleClose(tag, i) {
      request({
        url: "/admin/home/updateAppAcc",
        params: {
          role: i + 1,
          userid: tag,
          type: -1
        }
      }).then(res => {
        if (res.code === 0) {
          this['dynamicTags' + i].splice(this['dynamicTags' + i].indexOf(tag), 1);
          this.$message.success('删除成功');
        }
      });
    },
    showInput(i) {
      this['inputVisible' + i] = true;
      this.$nextTick(() => {
        this.$refs['saveTagInput' + i].$refs.input.focus();
      });
    },
    handleInputConfirm(i) {
      const inputValue = this['inputValue' + i];
      if (inputValue) {
        request({
          url: "/admin/home/updateAppAcc",
          params: {
            role: i + 1,
            userid: inputValue,
            type: 1
          }
        }).then(res => {
          if (res.code === 0) {
            this['dynamicTags' + i].push(inputValue);
            this.$message.success('添加成功');
          }
        });
      }
      this['inputVisible' + i] = false;
      this['inputValue' + i] = '';
    },
    getDashBoard() {
      request({
        url: "/admin/home/getDashboard",
        params: {
          level: 0
        }
      }).then(res => {
        this.dashboardUpdateTime = new Date().format("yyyy-MM-dd hh:mm:ss");
        this.dashboard = res.data && res.data.static && res.data.static.length > 0 ? res.data.static[0] : this.dashboard;
        this.currentDayQpm = res.data.qps || [];
        this.initMain0(this.yesterdayQpm, this.lastweekQpm, res.data.qps || []);
        this.$nextTick(() => {
          this.renderFlowMixChart();
        });
      });
    },

    getYesterdayAndLastWeekQpm() {
      request({
        url: "/admin/home/getQpmByDay",
        params: {
          date: new Date(new Date().getTime() - 24 * 3600 * 1000).format("yyyy-MM-dd")
        }
      }).then(res => {
        this.yesterdayQpm = res.data;
        request({
          url: "/admin/home/getQpmByDay",
          params: {
            date: new Date(new Date().getTime() - 7 * 24 * 3600 * 1000).format("yyyy-MM-dd")
          }
        }).then(res2 => {
          this.lastweekQpm = res2.data;
          this.getDashBoard();
        });
      });
    },
    getOverviewStats() {
      const end = new Date();
      const start = new Date(end.getTime() - 13 * 24 * 3600 * 1000);
      request({
        url: "/admin/home/appStat",
        params: {
          module: null,
          func: null,
          start: start.format("yyyyMMdd"),
          end: end.format("yyyyMMdd")
        }
      }).then(res => {
        this.overviewStats = res.data || [];
        this.$nextTick(() => {
          this.renderOverviewTrendChart();
        });
      });
    },
    getLoadInsight() {
      const config = [
        { type: 0, label: 'HTTP', bucket: 'normal' },
        { type: 1, label: 'RPC', bucket: 'normal' },
        { type: 2, label: 'TASK', bucket: 'normal' },
        { type: 3, label: '异常', bucket: 'risk' },
        { type: 4, label: '日志', bucket: 'risk' }
      ];
      Promise.all(config.map(item => {
        return request({
          url: "/admin/home/getModuleFuncLoad",
          params: { type: item.type }
        }).then(res => {
          return {
            ...item,
            list: (res.data || []).map(record => ({
              ...record,
              scene: item.label,
              num: this.toNumber(record.num),
              fullName: `${record.module || '-'} / ${record.func || '-'}`
            }))
          };
        });
      })).then(result => {
        const normal = [];
        const risk = [];
        result.forEach(item => {
          if (item.bucket === 'normal') {
            normal.push(...item.list);
          } else {
            risk.push(...item.list);
          }
        });
        this.loadInsight.normal = normal.sort((a, b) => b.num - a.num).slice(0, 8);
        this.loadInsight.risk = risk.sort((a, b) => b.num - a.num).slice(0, 8);
        this.$nextTick(() => {
          this.renderTopCharts();
        });
      });
    },
    getApiAssetSummary() {
      request({
        url: "/admin/apimkt/getApiList",
        params: {}
      }).then(res => {
        const list = res.data || [];
        const flatList = this.flattenApiList(list);
        this.apiAsset = {
          total: flatList.length,
          open: flatList.filter(item => item.sign === 0).length,
          sign: flatList.filter(item => item.sign === 1 || item.sign === 2).length,
          md5: flatList.filter(item => item.sign === 1).length,
          sha256: flatList.filter(item => item.sign === 2).length
        };
        this.apiModules = list.map(item => ({
          label: item.name || item.service,
          service: item.service,
          value: (item.funcList || []).length
        })).sort((a, b) => b.value - a.value);
        this.$nextTick(() => {
          this.renderApiAssetChart();
        });
      });
    },
    async getReleaseSummary() {
      this.releaseLoading = true;
      try {
        const gitRes = await request({
          url: "/admin/ops/gitCommitCheck",
          params: {
            commitid: '',
            pageNo: 1,
            pageSize: 6
          }
        });
        let buildList = [];
        if (gitRes.code === 1) {
          this.releaseMode = 'package';
          const buildRes = await request({
            url: "/admin/ops/gitCommitPackageHis",
            params: { commitid: 'default' }
          });
          buildList = (buildRes.data || []).map(item => ({ ...item, commitid: 'default' }));
        } else {
          this.releaseMode = 'git';
          const commitIds = (gitRes.data || []).map(item => item.id).filter(Boolean).slice(0, 4);
          const buildGroup = await Promise.all(commitIds.map(commitid => {
            return request({
              url: "/admin/ops/gitCommitPackageHis",
              params: { commitid }
            }).then(res => (res.data || []).map(item => ({ ...item, commitid })));
          }));
          buildList = buildGroup.reduce((acc, item) => acc.concat(item), []);
        }
        this.releaseBuilds = buildList.sort((a, b) => this.toNumber(b.start) - this.toNumber(a.start)).slice(0, 8);
        if (this.releaseBuilds.length === 0) {
          this.releaseDeploys = [];
          return;
        }
        const deployGroup = await Promise.all(this.releaseBuilds.slice(0, 6).map(item => {
          return request({
            url: "/admin/ops/buildDeployHis",
            params: {
              commitid: item.commitid || 'default',
              buildid: item.id
            }
          }).then(res => (res.data || []).map(record => ({
            ...record,
            buildid: item.id,
            commitid: item.commitid || 'default'
          }))).catch(() => []);
        }));
        this.releaseDeploys = deployGroup.reduce((acc, item) => acc.concat(item), []).sort((a, b) => this.toNumber(b.start) - this.toNumber(a.start)).slice(0, 8);
      } catch (e) {
        this.releaseBuilds = [];
        this.releaseDeploys = [];
      } finally {
        this.releaseLoading = false;
      }
    },
    renderFlowMixChart() {
      if (!this.$refs.overviewMixChart) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.overviewMixChart) || echarts.init(this.$refs.overviewMixChart);
      const source = [
        { name: 'HTTP', value: this.toNumber(this.dashboard.http) },
        { name: 'RPC', value: this.toNumber(this.dashboard.rpc) },
        { name: 'TASK', value: this.toNumber(this.dashboard.task) },
        { name: 'ERR', value: this.toNumber(this.dashboard.err) },
        { name: 'WARN', value: this.toNumber(this.dashboard.warn) }
      ].filter(item => item.value > 0);
      if (source.length === 0) {
        this.setEmptyChart(chart, '暂无流量数据');
        return;
      }
      chart.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          name: '调用结构',
          type: 'pie',
          radius: ['48%', '72%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          label: { formatter: '{b}\n{c}' },
          data: source
        }]
      });
    },
    renderOverviewTrendChart() {
      if (!this.$refs.overviewTrendChart) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.overviewTrendChart) || echarts.init(this.$refs.overviewTrendChart);
      if (!this.overviewStats.length) {
        this.setEmptyChart(chart, '暂无趋势数据');
        return;
      }
      chart.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
        tooltip: { trigger: 'axis' },
        legend: { top: 8 },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category', data: this.overviewStats.map(item => item.dcdate) },
        yAxis: { type: 'value' },
        series: ['http', 'rpc', 'task', 'err'].map((key, index) => ({
          name: ['HTTP', 'RPC', 'TASK', 'ERR'][index],
          type: key === 'err' ? 'line' : 'bar',
          stack: key === 'err' ? null : 'calls',
          smooth: true,
          barMaxWidth: 26,
          data: this.overviewStats.map(item => this.toNumber(item[key]))
        }))
      });
    },
    renderBarChart(refName, list, title, colors) {
      const el = this.$refs[refName];
      if (!el) {
        return;
      }
      const chart = echarts.getInstanceByDom(el) || echarts.init(el);
      if (!list.length) {
        this.setEmptyChart(chart, '暂无排行数据');
        return;
      }
      chart.setOption({
        color: Object.values(colors),
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },

        grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          inverse: true,
          axisLabel: {
            width: 140,
            overflow: 'truncate'
          },
          data: list.map(item => item.fullName)
        },
        series: [{
          name: title,
          type: 'bar',
          barWidth: 16,
          data: list.map(item => ({ value: item.num, itemStyle: { color: colors[item.scene] || '#2563eb' } }))
        }]
      });
    },
    renderTopCharts() {
      this.renderBarChart('overviewRankChart', this.loadInsight.normal, '调用量', { HTTP: '#2563eb', RPC: '#10b981', TASK: '#f59e0b' });
      this.renderBarChart('overviewRiskChart', this.loadInsight.risk, '风险量', { 异常: '#ef4444', 日志: '#8b5cf6' });
    },
    renderHostEnvChart() {
      if (!this.$refs.hostEnvChart) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.hostEnvChart) || echarts.init(this.$refs.hostEnvChart);
      if (!this.hostEnvDistribution.length) {
        this.setEmptyChart(chart, '暂无主机数据');
        return;
      }
      chart.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316'],
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['42%', '68%'],
          label: { formatter: '{b}\n{c}' },
          data: this.hostEnvDistribution
        }]
      });
    },
    renderApiAssetChart() {
      if (!this.$refs.apiAssetChart) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.apiAssetChart) || echarts.init(this.$refs.apiAssetChart);
      if (!this.apiModuleRank.length) {
        this.setEmptyChart(chart, '暂无接口资产');
        return;
      }
      chart.setOption({
        color: ['#2563eb'],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          inverse: true,
          axisLabel: {
            width: 120,
            overflow: 'truncate'
          },
          data: this.apiModuleRank.slice(0, 6).map(item => item.label)
        },
        series: [{
          type: 'bar',
          barWidth: 16,
          data: this.apiModuleRank.slice(0, 6).map(item => item.value)
        }]
      });
    },
    getStatList() {

      if (this.period == null || this.period[0] === undefined || this.period[1] === undefined) {
        this.$message.warning('开始和结束日期不能为空');
        return;
      }
      if (this.period[1].getTime() - this.period[0].getTime() > 90 * 24 * 3600 * 1000) {
        this.$message.warning('最大不超过90天');
        return;
      }
      request({
        url: "/admin/home/appStat",
        params: {
          func: this.funcChoose == null ? null : this.funcChoose[1],
          module: this.funcChoose == null ? null : this.funcChoose[0],
          start: this.period[0].format("yyyyMMdd"),
          end: this.period[1].format("yyyyMMdd")
        }
      }).then(res => {
        if (res.code === 0) {
          this.initEcharts(res.data || []);
        }
      });
    },
    generateTimeArray(start, end) {
      const timeArray = [];
      let flag = false;
      for (let minutes = 0; minutes < 1440; minutes++) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        if (start === timeString) flag = true;
        if (flag) timeArray.push(timeString);
        if (timeString === end) break;
      }
      return timeArray;
    },
    // 按颗粒度生成时间轴
    generateGranularTimeArray(start, end, granularity) {
      const step = parseInt(granularity);
      const timeArray = [];
      let flag = false;
      for (let minutes = 0; minutes < 1440; minutes += step) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        if (start === timeString || (!flag && start <= timeString)) flag = true;
        if (flag) timeArray.push(timeString);
        if (timeString >= end) break;
      }
      return timeArray.length ? timeArray : [start];
    },
    datafilter(xAxis, data) {
      return xAxis.data.map(x => {
        const matched = data.find(y => x === y.dctime.substr(11, 5));
        return matched ? matched.num : 0;
      });
    },
    // 按颗粒度聚合数据
    datafilterByGranularity(xAxis, data, granularity) {
      const step = parseInt(granularity);
      return xAxis.map(bucketLabel => {
        const bucketParts = bucketLabel.split(':');
        const baseHour = parseInt(bucketParts[0]);
        const baseMin = parseInt(bucketParts[1]);
        let sum = 0;
        for (let offset = 0; offset < step; offset++) {
          let m = baseMin + offset;
          let h = baseHour;
          if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
          if (h >= 24) break;
          const ts = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          const matched = data.find(y => y.dctime && y.dctime.substr(11, 5) === ts);
          sum += matched ? (matched.num || 0) : 0;
        }
        return sum;
      });
    },
    onGranularityChange() {
      localStorage.setItem('app_chartGranularity_' + this.app, this.chartGranularity);
      this.initMain0(this.yesterdayQpm, this.lastweekQpm, this.currentDayQpm);
    },
    initMain0(yesterday, lasweek, today) {
      const baseData = today.length ? today : (yesterday.length ? yesterday : lasweek);
      if (!baseData || !baseData.length || !this.$refs.main0) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.main0) || echarts.init(this.$refs.main0);
      const granularity = this.chartGranularity;
      const toolbox = { feature: { dataView: { show: true, readOnly: false }, magicType: { show: true, type: ['line', 'bar'] }, restore: { show: true }, saveAsImage: {} } };
      const tooltip = { trigger: 'axis', axisPointer: { type: 'shadow' } };
      const xData = granularity === '1'
        ? this.generateTimeArray(baseData[0].dctime.substr(11, 5), baseData[baseData.length - 1].dctime.substr(11, 5))
        : this.generateGranularTimeArray(baseData[0].dctime.substr(11, 5), baseData[baseData.length - 1].dctime.substr(11, 5), granularity);
      const xAxis = { type: 'category', data: xData };
      const yAxis = { type: 'value' };
      const grid = { left: '3%', right: '4%', bottom: '3%', containLabel: true };
      const legend = { selectedMode: true };
      const dataZoom = [{ type: 'inside', xAxisIndex: 0, start: 0, end: 100, zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: true }];
      const seriesDataToday = granularity === '1' ? this.datafilter(xAxis, today) : this.datafilterByGranularity(xData, today, granularity);
      const seriesDataYesterday = granularity === '1' ? this.datafilter(xAxis, yesterday) : this.datafilterByGranularity(xData, yesterday, granularity);
      const seriesDataLastWeek = granularity === '1' ? this.datafilter(xAxis, lasweek) : this.datafilterByGranularity(xData, lasweek, granularity);
      chart.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b'],
        title: { text: '应用负载', textStyle: { color: '#0f172a', fontSize: 16 } },
        tooltip,
        legend,
        grid,
        toolbox,
        yAxis,
        xAxis,
        dataZoom,
        series: [
          { name: '今天', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.12 }, data: seriesDataToday, endLabel: { show: true, formatter: () => '今天' } },
          { name: '一天前', type: 'line', smooth: true, symbol: 'none', data: seriesDataYesterday, endLabel: { show: true, formatter: () => '一天前' } },
          { name: '一周前', type: 'line', smooth: true, symbol: 'none', data: seriesDataLastWeek, endLabel: { show: true, formatter: () => '一周前' } }
        ]
      });
      // 让鼠标滚轮事件穿透图表，恢复页面滚动（Ctrl/Cmd+滚轮保留缩放功能）
      chart.getZr().on('mousewheel', (e) => {
        if (e.event.ctrlKey || e.event.metaKey) {
          return; // 放行给 dataZoom 执行缩放
        }
        e.event.preventDefault();
        e.event.stopPropagation();
        const delta = e.event.wheelDelta || -e.event.deltaY;
        const container = document.querySelector('.app-page__main') || document.scrollingElement;
        if (container) {
          container.scrollTop -= delta;
        }
      });
    },
    initEcharts(data) {
      if (!this.$refs.main1 || !this.$refs.main2) {
        return;
      }
      const chart1 = echarts.getInstanceByDom(this.$refs.main1) || echarts.init(this.$refs.main1);
      const chart2 = echarts.getInstanceByDom(this.$refs.main2) || echarts.init(this.$refs.main2);
      const toolbox = { feature: { dataView: { show: true, readOnly: false }, magicType: { show: true, type: ['line', 'bar'] }, restore: { show: true }, saveAsImage: {} } };
      const tooltip = { trigger: 'axis', axisPointer: { type: 'shadow' } };
      const xAxis = { type: 'category', data: data.map(x => x.dcdate) };
      const yAxis = { type: 'value' };
      const grid = { left: '3%', right: '4%', bottom: '3%', containLabel: true };
      const legend = { selectedMode: true };
      const dataZoom = [{ type: 'inside', xAxisIndex: 0, start: 0, end: 100, zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: true }];
      chart1.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
        title: { text: '调用次数', textStyle: { color: '#0f172a', fontSize: 16 } },
        tooltip,
        legend,
        grid,
        toolbox,
        yAxis,
        xAxis,
        dataZoom,
        series: ['HTTP', 'RPC', 'TASK', 'ERR'].map(x => {
          return { name: x, type: 'bar', stack: 'total', barWidth: '62%', data: data.map(y => y[x.toLowerCase()]) };
        })
      });
      chart2.setOption({
        color: ['#1d4ed8', '#ef4444', '#0ea5e9', '#8b5cf6', '#f97316', '#22c55e'],
        title: { text: '时延趋势 / 毫秒', textStyle: { color: '#0f172a', fontSize: 16 } },
        tooltip,
        legend,
        grid,
        toolbox,
        yAxis,
        xAxis,
        dataZoom,
        series: ['MIN', 'MAX', 'AVG', 'P90', 'P95', 'P99'].map(x => {
          return { name: x, type: 'line', smooth: true, symbol: 'none', data: data.map(y => y[x.toLowerCase()]) };
        })
      });
      [chart1, chart2].forEach(chart => {
        chart.getZr().on('mousewheel', (e) => {
          if (e.event.ctrlKey || e.event.metaKey) return;
          e.event.preventDefault();
          e.event.stopPropagation();
          const delta = e.event.wheelDelta || -e.event.deltaY;
          const container = document.querySelector('.app-page__main') || document.scrollingElement;
          if (container) {
            container.scrollTop -= delta;
          }
        });
      });
    }
  }
}
</script>

<style lang="scss" scoped>
/* 应用信息 & 今日运行态势：紧凑排版 */
.app-dashboard__top-row .panel-card {
  ::v-deep .panel-header {
    margin-bottom: 8px;
  }
  ::v-deep .panel-subtitle {
    margin-top: 2px;
  }
  ::v-deep .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  ::v-deep .info-item {
    padding: 8px 12px;
  }
  ::v-deep .info-item__value {
    margin-top: 4px;
  }
  ::v-deep .metric-grid {
    gap: 8px;
  }
  ::v-deep .metric-card {
    padding: 10px 14px;
    border-radius: 12px;
  }
  ::v-deep .metric-card__value {
    margin-top: 4px;
    font-size: 22px;
  }
  ::v-deep .metric-card__meta {
    margin-top: 4px;
  }
}

.app-dashboard__runtime-grid {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.app-dashboard__top-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: 12px;
}

.app-dashboard__hero-grid {
  margin-top: 14px;
}

.app-dashboard__summary-time {
  font-size: 17px;
}

.app-dashboard__overview-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(0, 1.08fr);
  gap: 12px;
  margin-top: 12px;
}

.app-dashboard__insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.app-dashboard__overview-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-dashboard__overview-panel--summary {
  justify-content: space-between;
}

.app-dashboard__overview-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.app-dashboard__overview-metrics--compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 4px;
}

.app-dashboard__mini-stat {
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.app-dashboard__mini-stat-label {
  font-size: 12px;
  color: #64748b;
}

.app-dashboard__mini-stat-value {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.app-dashboard__mini-stat-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.app-dashboard__dual-chart {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.app-dashboard__host-overview,
.app-dashboard__api-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 12px;
  align-items: start;
  margin-top: 12px;
}



.app-dashboard__mini-list {
  padding: 12px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.app-dashboard__mini-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.28);
}

.app-dashboard__mini-list-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.app-dashboard__mini-list-item--stack {
  display: block;
}

.app-dashboard__mini-list-main {
  min-width: 0;
  color: #0f172a;
  font-weight: 600;
  word-break: break-all;
}

.app-dashboard__mini-list-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.app-dashboard__mini-list-value {
  margin-top: 4px;
  font-size: 12px;
  color: #334155;
}

.app-dashboard__chart-grid {

  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.app-dashboard__chart {
  width: 100%;
  height: 400px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
}

.app-dashboard__chart--large {
  height: 460px;
}

.app-dashboard__chart--medium {
  height: 320px;
}

.app-dashboard__chart--small {
  height: 260px;
}


.app-dashboard__dialog-scroll {
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
}

.app-dashboard__permission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.app-dashboard__permission-card {
  padding: 14px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.app-dashboard__permission-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
}

.app-dashboard__permission-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}


.app-dashboard__table-actions {
  max-width: 180px;
}

.flex-prepend-input + .flex-prepend-input {
  margin-top: 10px;
}


.flex-prepend-input ::v-deep .el-input-group__prepend {
  align-items: center;
  min-width: 112px;
  color: #475569;
}

.button-new-tag {
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.input-new-tag {
  width: 120px;
  vertical-align: bottom;
}

@media (max-width: 1200px) {
  .app-dashboard__top-row,
  .app-dashboard__overview-grid,
  .app-dashboard__insight-grid,
  .app-dashboard__dual-chart,
  .app-dashboard__release-grid {
    grid-template-columns: 1fr;
  }

  .app-dashboard__runtime-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .app-dashboard__host-overview,
  .app-dashboard__api-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .app-dashboard__chart-grid,
  .app-dashboard__permission-grid,
  .app-dashboard__overview-metrics,
  .app-dashboard__overview-metrics--compact {
    grid-template-columns: 1fr;
  }
}

</style>
