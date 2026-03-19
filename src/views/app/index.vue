<template>
  <div v-loading="loading">
    <el-row :gutter="24" style="background: white;margin: 11px;">
      <el-descriptions :column="2" border style="padding:22px;margin-right:50px;" title="应用信息">
        <template v-if="appInfo.role===1" slot="extra">
          <el-button size="small" type="primary" @click="getAppInfo">信息</el-button>
          <el-button size="small" type="primary" @click="getAppAcc">权限</el-button>
          <el-button size="small" type="primary" @click="getAppHost">主机</el-button>
        </template>
        <el-descriptions-item label="应用简称">{{ app }}</el-descriptions-item>
        <el-descriptions-item label="应用名称">{{ appInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="我的权限">{{ appInfo.role === 1 ? '管理' : appInfo.role === 2 ? "协作" : "访客" }}</el-descriptions-item>
        <el-descriptions-item label="最近更新">{{ appInfo.updatetime }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ appInfo.createtime }}</el-descriptions-item>
        <el-descriptions-item label="应用描述">{{ appInfo.description }}</el-descriptions-item>
      </el-descriptions>
      <el-dialog :visible.sync="dialogTableVisible" title="应用信息">
        <el-input v-model="app" :disabled="true" class="flex-prepend-input" v-slot:prepend>应用：</el-input>
        <el-input v-model="appInfo_.token" :disabled="true" class="flex-prepend-input" v-slot:prepend>令牌：</el-input>
        <div style="height:500px;overflow-y: auto;">
          <el-input v-model="appInfo_.name" class="flex-prepend-input" v-slot:prepend>别名：</el-input>
          <el-input v-model="appInfo_.description" class="flex-prepend-input" v-slot:prepend>描述：</el-input>
          <el-input v-model="appInfo_.giturl" class="flex-prepend-input" v-slot:prepend>git地址：</el-input>
          <el-input v-model="appInfo_.gituser" class="flex-prepend-input" v-slot:prepend>git用户：</el-input>
          <el-input v-model="appInfo_.gitpwd" class="flex-prepend-input" v-slot:prepend>git密码：</el-input>
          <el-input v-model="appInfo_.pomfile" class="flex-prepend-input" v-slot:prepend>pom.xml：</el-input>
          <el-input v-model="appInfo_.branch" class="flex-prepend-input" v-slot:prepend>git分支：</el-input>
          <el-input v-model="appInfo_.webhook" class="flex-prepend-input" v-slot:prepend>webhook：</el-input>
        </div>
        <span slot="footer" class="dialog-footer">
              <el-button @click="dialogTableVisible = false">取 消</el-button>
              <el-button type="primary" @click="updateAppInfo">更新</el-button>
        </span>
      </el-dialog>
      <el-dialog :visible.sync="dialogTableVisible1" title="应用权限">
        <div style="height:500px;overflow-y: auto;">
          <p style="font-size: 18px;font-weight: bold">管理：
            <el-tag :key="tag" v-for="tag in dynamicTags0" type='danger' :disable-transitions="false" @close="handleClose(tag,i)"> {{ tag }}</el-tag>
            <el-input class="input-new-tag" v-if="inputVisible0" v-model="inputValue0" ref="saveTagInput0" size="small" @blur="handleInputConfirm(0)"></el-input>
            <el-button v-else class="button-new-tag" size="small" @click="showInput(0)">+新增</el-button>
          </p>
          <p style="padding-top: 50px;font-size: 18px;font-weight: bold">协作：
            <el-tag :key="tag" v-for="tag in dynamicTags1" type='success' closable :disable-transitions="false" @close="handleClose(tag,1)"> {{ tag }}</el-tag>
            <el-input class="input-new-tag" v-if="inputVisible1" v-model="inputValue1" ref="saveTagInput1" size="small" @blur="handleInputConfirm(1)"></el-input>
            <el-button v-else class="button-new-tag" size="small" @click="showInput(1)">+新增</el-button>
          </p>
        </div>
      </el-dialog>
      <el-dialog :visible.sync="dialogTableVisible3" :title="hostId===0?'新增主机':'编辑主机'" width="60%">
        <div style="padding: 11px"> 主机地址：
          <el-input style="width: 600px" v-model="hostIp" size="small"></el-input>
        </div>
        <div style="padding: 11px"> 主机端口：
          <el-input style="width: 600px" v-model="hostPort" size="small"></el-input>
        </div>
        <div style="padding: 11px"> 访问用户：
          <el-input style="width: 600px" v-model="hostUsername" size="small"></el-input>
        </div>
        <div style="padding: 11px"> 访问密码：
          <el-input style="width: 600px" v-model="hostPassword" size="small"></el-input>
        </div>
        <div style="padding: 11px"> 主机环境：
          <el-input style="width: 600px" v-model="hostEnv" size="small"></el-input>
        </div>
        <div style="padding: 11px"> 部署路径：
          <el-input style="width: 600px" v-model="hostDeploy" size="small"></el-input>
        </div>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogTableVisible3 = false">取 消</el-button>
          <el-button type="primary" @click="hostAddOrEdit">保 存</el-button>
        </span>
      </el-dialog>
      <el-dialog :visible.sync="dialogTableVisible2" title="应用主机" width="60%">
        <el-table :data="app_hosts" style="width: 100%" stripe v-loading="loading">
          <el-table-column prop="ip" label="ip地址"></el-table-column>
          <el-table-column prop="port" label="端口"></el-table-column>
          <el-table-column prop="env" label="环境"></el-table-column>
          <el-table-column prop="username" label="用户"></el-table-column>
          <el-table-column prop="password" label="密码"></el-table-column>
          <el-table-column prop="valid" label="连通性">
            <template slot-scope="scope">
              <el-tag :style="{background:scope.row.valid===-1?'#737373':scope.row.valid===0?'#f34d4d':'#00ff27'}">
                {{ scope.row.valid === -1 ? '网络不通' : scope.row.valid === 0 ? '连接失败' : '连接成功' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template slot="header" slot-scope="scope">
              <el-button type="warning" size="mini" style="margin-left: 11px" @click="dialogTableVisible3=true;hostId=0;hostIp='';hostPort=22;
                         hostUsername='';hostPassword='';hostEnv='';hostDeploy='';">新增
              </el-button>
            </template>
            <template slot-scope="scope">
              <el-button type="text" size="medium"
                         @click="dialogTableVisible3=true;hostId=scope.row.id;hostIp=scope.row.ip;hostPort=scope.row.port;
                         hostUsername=scope.row.username;hostPassword=scope.row.password;hostEnv=scope.row.env;hostDeploy=scope.row.deploy;">编辑
              </el-button>
              <el-button type="text" size="medium" @click="appHostDel(scope.row)">删除</el-button>
              <el-button type="text" size="medium" @click="appHostCheck(scope.row)">连接测试</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </el-row>

    <el-row :gutter="20" style="background: white;padding: 20px;margin: 11px;">
      <p style="font-size: 16px;font-weight: 700;">今日数据 <span style="color: #00bcd4">{{ dashboardUpdateTime }}</span>更新</p>
      <p style="font-size: 18px;font-weight: bold;margin-left: 17px;color: #464646;">数据统计</p>
      <el-col :span="3">
        <el-statistic :title="loadTreeTitle[0]" v-slot:formatter>
          <el-link :disabled="dashboard.http===0" :underline="false" @click="showTree(0)" style="color: blue;font-size: 20px;"> {{ dashboard.http }}</el-link>
        </el-statistic>
      </el-col>
      <el-col :span="2">
        <el-statistic :title="loadTreeTitle[1]" v-slot:formatter>
          <el-link :disabled="dashboard.rpc===0" :underline="false" @click="showTree(1)" style="color: yellowgreen;font-size: 20px;">{{ dashboard.rpc }}</el-link>
        </el-statistic>
      </el-col>
      <el-col :span="3">
        <el-statistic :title="loadTreeTitle[2]" v-slot:formatter>
          <el-link :disabled="dashboard.task===0" :underline="false" @click="showTree(2)" style="color: brown;font-size: 20px;"> {{ dashboard.task }}</el-link>
        </el-statistic>
      </el-col>
      <el-col :span="2">
        <el-statistic :title="loadTreeTitle[3]" v-slot:formatter>
          <el-link :disabled="dashboard.err===0" :underline="false" @click="showTree(3)" style="color: red;font-size: 20px;"> {{ dashboard.err }}</el-link>
        </el-statistic>
      </el-col>
      <el-col :span="2">
        <el-statistic :title="loadTreeTitle[4]" v-slot:formatter>
          <el-link :disabled="dashboard.warn===0" :underline="false" @click="showTree(4)" style="color: hotpink;font-size: 20px;"> {{ dashboard.warn }}</el-link>
        </el-statistic>
      </el-col>
      <el-col :span="3">
        <el-statistic title="平均时延" v-slot:formatter><span style="color:#40b3b3">{{ dashboard.avg }}ms</span></el-statistic>
      </el-col>
      <el-col :span="3">
        <el-statistic title="P90时延" v-slot:formatter><span style="color:#40b3b3">{{ dashboard.p90 === 'NaN' ? '-' : (dashboard.p90 + 'ms') }}</span></el-statistic>
      </el-col>
      <el-col :span="3">
        <el-statistic title="P95时延" v-slot:formatter><span style="color:#40b3b3">{{ dashboard.p95 === 'NaN' ? '-' : (dashboard.p95 + 'ms') }}</span></el-statistic>
      </el-col>
      <el-col :span="3">
        <el-statistic title="P99时延" v-slot:formatter><span style="color:#40b3b3">{{ dashboard.p99 === 'NaN' ? '-' : (dashboard.p99 + 'ms') }}</span></el-statistic>
      </el-col>
    </el-row>
    <el-row :gutter="20" style="background: white;padding: 20px;margin: 11px;">
      <el-col :span="24">
        <div ref="main0" style="height: 500px; width: 100%;background:white;"></div>
      </el-col>
    </el-row>
    <el-dialog :visible.sync="showLoadTree" :title="loadTreeTitle[chooseNum]+'负载详情'">
      <el-tree :data="loadTree" :props="{children:'children',label:'label'}" @node-click="" :render-content="renderContent"></el-tree>
    </el-dialog>
    <el-row :gutter="20" style="background: white;padding: 20px;margin: 11px;">
      <el-descriptions title="历史数据"/>
      <div>
        <el-date-picker v-model="period" :default-value="new Date(Date.now() - 31 * 24 * 3600 * 1000)" :picker-options="pickerOptions" align="right" end-placeholder="结束"
                        range-separator="至"
                        size="small" start-placeholder="开始" style="margin-left: 20px" type="daterange"></el-date-picker>
        <el-cascader v-model="funcChoose" :options="historyFunc" :props="{ checkStrictly: true }" clearable filterable separator="/" size="small"
                     style="margin-left: 3px"></el-cascader>
        <el-button icon="el-icon-search" size="mini" style="margin-left: 3px" type="primary" @click="getStatList">查询</el-button>
      </div>
      <br/><br/>
      <el-col :span="12">
        <div ref="main1" style="height: 500px; width: 100%;background:white;"></div>
      </el-col>
      <el-col :span="12">
        <div ref="main2" style="height: 500px; width: 100%;background:white;"></div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import request from "@/utils/request";
import * as echarts from "echarts";
import Cookies from "js-cookie";
import alter from "@/views/alert/index.vue";

export default {
  name: "AppCommon",
  computed: {
    alter() {
      return alter
    }
  },
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
      appInfo_: {},
      loading: false,
      dashboard: {},
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
      branchs: [],
      app_hosts: [],
      hostId: 0,
      hostIp: '',
      hostPort: 22,
      hostUsername: '',
      hostPassword: '',
      hostEnv: '',
      hostDeploy: '',
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: '/'});
    }
    this.getYesterdayAndLastWeekQpm();
    request({
      url: "/admin/home/getAppNodeAndFuncList",
      params: {},
    }).then((res) => {
      this.historyFunc = res.data.func;
    });
    this.timerId = setInterval(this.getDashBoard, 30000);
    this.getStatList();
  },
  beforeDestroy() {
    // 清除定时器
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },
  methods: {
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
          this.loading = false;
          this.loadTree = [...new Set(res.data.map(x => x.module))].map(x => {
            return {
              label: x,
              value: res.data.filter(y => y.module === x).map(y => y.num).reduce((a, b) => a + b, 0),
              children: res.data.filter(y => y.module === x).map(y => {
                return {label: y.func, value: y.num};
              })
            }
          })
          this.showLoadTree = true;
        }
      });
    },
    renderContent(h, {node, data, store}) {
      return (
          <span class="custom-tree-node">
            <span>{node.label + '    ：'}</span>
            <span>
              <el-button size="mini" type="text">{data.value}</el-button>
            </span>
          </span>);
    },
    getAppInfo() {
      request({
        url: "/admin/home/getAppInfo",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.dialogTableVisible = true
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
          webhook: this.appInfo_.webhook,
        }
      }).then(res => {
        if (res.code === 0) {
          this.$message.success('更新成功');
          this.dialogTableVisible = false;
          this.$router.push({path: "/"});
        }
      });
    },
    getAppAcc() {
      request({
        url: "/admin/home/getAppAcc",
        params: {}
      }).then(res => {
        if (res.code === 0) {
          this.dialogTableVisible1 = true
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
          this.dialogTableVisible2 = true;
          this.app_hosts = res.data;
        }
      });
    },
    hostAddOrEdit() {
      let url = this.hostId === 0 ? "/admin/home/addAppHost" : "/admin/home/updateAppHost";
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
          this.getAppHost();
        }
      });
    },
    appHostDel(row) {
      request({
        url: "/admin/home/delAppHost",
        params: {id: row.id}
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
        params: {id: row.id}
      }).then(res => {
      }).finally(() => {
        this.getAppHost();
        this.loading = false;
      })
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
      this.$nextTick(_ => {
        this.$refs['saveTagInput' + i].$refs.input.focus();
      });
    },
    handleInputConfirm(i) {
      let inputValue = this['inputValue' + i];
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
        this.dashboardUpdateTime = new Date().format("yyyy-MM-dd hh:mm:ss")
        this.dashboard = res.data.static[0];
        this.initMain0(this.yesterdayQpm, this.lastweekQpm, res.data.qps)
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
        }).then(res => {
          this.lastweekQpm = res.data;
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
          this.initEcharts(res.data);
        }
      });
    },
    generateTimeArray(start, end) {
      const timeArray = [];
      let flag = false;
      for (let minutes = 0; minutes < 1440; minutes++) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        // 使用padStart确保小时和分钟都是两位数
        const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        if (start === timeString) flag = true;
        if (flag) timeArray.push(timeString);
        if (timeString === end) break;
      }
      return timeArray;
    },
    datafilter(xAxis, data) {
      return xAxis.data.map(x => {
        let m = data.find(y => x === y.dctime.substr(11, 5));
        if (m) return m.num;
        return 0;
      });
    },
    initMain0(yesterday, lasweek, today) {
      const toolbox = {feature: {dataView: {show: true, readOnly: false}, magicType: {show: true, type: ['line', 'bar']}, restore: {show: true}, saveAsImage: {}}};
      const tooltip = {trigger: 'axis', axisPointer: {type: 'shadow'}};
      const xAxis = {type: 'category', data: this.generateTimeArray(today[0].dctime.substr(11, 5), today[today.length - 1].dctime.substr(11, 5))};
      const yAxis = {type: 'value'};
      const grid = {left: '3%', right: '4%', bottom: '3%', containLabel: true};
      const legend = {selectedMode: true};
      const dataZoom = [{type: 'inside', xAxisIndex: 0, start: 0, end: 100, zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: false}];
      echarts.init(this.$refs.main0).setOption({
        title: {text: '应用负载'},
        tooltip, legend, grid, toolbox, yAxis, xAxis, dataZoom,
        series: [
          {name: '今天', type: 'line', smooth: true, data: this.datafilter(xAxis, today), endLabel: {show: true, formatter: () => '今天'}},
          {name: '一天前', type: 'line', smooth: true, data: this.datafilter(xAxis, yesterday), endLabel: {show: true, formatter: () => '一天前'}},
          {name: '一周前', type: 'line', smooth: true, data: this.datafilter(xAxis, lasweek), endLabel: {show: true, formatter: () => '一周前'}}
        ]
      })
    },
    initEcharts(data) {
      const toolbox = {feature: {dataView: {show: true, readOnly: false}, magicType: {show: true, type: ['line', 'bar']}, restore: {show: true}, saveAsImage: {}}};
      const tooltip = {trigger: 'axis', axisPointer: {type: 'shadow'}};
      const xAxis = {type: 'category', data: data.map(x => x.dcdate)};
      const yAxis = {type: 'value'};
      const grid = {left: '3%', right: '4%', bottom: '3%', containLabel: true};
      const legend = {selectedMode: true};
      echarts.init(this.$refs.main1).setOption({
        title: {text: '调用/次'},
        tooltip, legend, grid, toolbox, yAxis, xAxis,
        series: ['HTTP', 'RPC', 'TASK', 'ERR'].map(x => {
          return {name: x, type: 'bar', stack: 'total', barWidth: '68%', data: data.map(y => y[x.toLowerCase()])};
        })
      })
      echarts.init(this.$refs.main2).setOption({
        title: {text: '时延/毫秒'},
        tooltip, legend, grid, toolbox, yAxis, xAxis,
        series: ['MIN', 'MAX', 'AVG', 'P90', 'P95', 'P99'].map(x => {
          return {name: x, type: 'line', data: data.map(y => y[x.toLowerCase()])}
        })
      })
    },
  }
}
</script>
<style lang="scss" scoped>
.flex-prepend-input {
  padding-top: 10px;
}

.flex-prepend-input ::v-deep .el-input-group__prepend {
  align-items: center; /* 垂直居中 */
  min-width: 110px; /* 设置最小宽度 */
  color: black;
}

.el-tag + .el-tag {
  margin-left: 10px;
  margin-top: 10px;
}

.button-new-tag {
  margin-left: 10px;
  margin-top: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.input-new-tag {
  width: 90px;
  margin-left: 10px;
  margin-top: 10px;
  vertical-align: bottom;
}

</style>
