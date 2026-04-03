<template>
  <div class="page-shell app-dashboard" v-loading="loading">
    <el-card class="panel-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">应用信息</div>
          <div class="panel-subtitle">基础资料来自当前应用上下文，管理权限操作可在此继续深入维护。</div>
        </div>
        <div v-if="canManage" class="panel-header__actions">
          <el-button size="small" type="primary" icon="el-icon-edit-outline" @click="getAppInfo">编辑信息</el-button>
          <el-button size="small" type="success" icon="el-icon-user-solid" @click="getAppAcc">权限成员</el-button>
          <el-button size="small" type="warning" icon="el-icon-monitor" @click="getAppHost">部署主机</el-button>
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
      <div class="metric-grid">
        <div
          v-for="item in callMetrics"
          :key="item.label"
          :class="['metric-card', item.className, { 'metric-card--interactive': item.type !== null }]"
          @click="item.type !== null && item.value > 0 ? showTree(item.type) : null"
        >
          <div class="metric-card__label">{{ item.label }}</div>
          <div class="metric-card__value">{{ item.value }}</div>
          <div class="metric-card__meta">{{ item.tip }}</div>
        </div>
      </div>
      <div class="metric-grid app-dashboard__latency-grid">
        <div v-for="item in latencyMetrics" :key="item.label" :class="['metric-card', item.className]">
          <div class="metric-card__label">{{ item.label }}</div>
          <div class="metric-card__value">{{ item.value }}</div>
          <div class="metric-card__meta">{{ item.tip }}</div>
        </div>
      </div>
    </el-card>

    <el-card class="panel-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">应用负载趋势</div>
          <div class="panel-subtitle">对比今天、昨日与一周前同时间段的请求量变化。</div>
        </div>
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
      hostDeploy: ''
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
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({ path: '/' });
      return;
    }
    this.getYesterdayAndLastWeekQpm();
    request({
      url: "/admin/home/getAppNodeAndFuncList",
      params: {}
    }).then((res) => {
      this.historyFunc = res.data.func;
    });
    this.timerId = setInterval(this.getDashBoard, 30000);
    this.getStatList();
    this.getAppHost();
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },
  methods: {
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
    getAppHost() {
      request({
        url: "/admin/home/getAppHost",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.app_hosts = res.data;
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
        this.initMain0(this.yesterdayQpm, this.lastweekQpm, res.data.qps || []);
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
    datafilter(xAxis, data) {
      return xAxis.data.map(x => {
        const matched = data.find(y => x === y.dctime.substr(11, 5));
        return matched ? matched.num : 0;
      });
    },
    initMain0(yesterday, lasweek, today) {
      const baseData = today.length ? today : (yesterday.length ? yesterday : lasweek);
      if (!baseData || !baseData.length || !this.$refs.main0) {
        return;
      }
      const chart = echarts.getInstanceByDom(this.$refs.main0) || echarts.init(this.$refs.main0);
      const toolbox = { feature: { dataView: { show: true, readOnly: false }, magicType: { show: true, type: ['line', 'bar'] }, restore: { show: true }, saveAsImage: {} } };
      const tooltip = { trigger: 'axis', axisPointer: { type: 'shadow' } };
      const xAxis = { type: 'category', data: this.generateTimeArray(baseData[0].dctime.substr(11, 5), baseData[baseData.length - 1].dctime.substr(11, 5)) };
      const yAxis = { type: 'value' };
      const grid = { left: '3%', right: '4%', bottom: '3%', containLabel: true };
      const legend = { selectedMode: true };
      const dataZoom = [{ type: 'inside', xAxisIndex: 0, start: 0, end: 100, zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: false }];
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
          { name: '今天', type: 'line', smooth: true, symbol: 'none', areaStyle: { opacity: 0.12 }, data: this.datafilter(xAxis, today), endLabel: { show: true, formatter: () => '今天' } },
          { name: '一天前', type: 'line', smooth: true, symbol: 'none', data: this.datafilter(xAxis, yesterday), endLabel: { show: true, formatter: () => '一天前' } },
          { name: '一周前', type: 'line', smooth: true, symbol: 'none', data: this.datafilter(xAxis, lasweek), endLabel: { show: true, formatter: () => '一周前' } }
        ]
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
      chart1.setOption({
        color: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
        title: { text: '调用次数', textStyle: { color: '#0f172a', fontSize: 16 } },
        tooltip,
        legend,
        grid,
        toolbox,
        yAxis,
        xAxis,
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
        series: ['MIN', 'MAX', 'AVG', 'P90', 'P95', 'P99'].map(x => {
          return { name: x, type: 'line', smooth: true, symbol: 'none', data: data.map(y => y[x.toLowerCase()]) };
        })
      });
    }
  }
}
</script>

<style lang="scss" scoped>
.app-dashboard__hero-grid {
  margin-top: 14px;
}

.app-dashboard__summary-time {
  font-size: 17px;
}

.app-dashboard__latency-grid {
  margin-top: 10px;
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

@media (max-width: 992px) {
  .app-dashboard__chart-grid,
  .app-dashboard__permission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
