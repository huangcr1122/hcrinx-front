<template>
  <div style="margin-top: 1px;">
    <el-input v-model="rid" clearable placeholder="rid" size="small"
              style="width: 150px;margin-left: 3px"></el-input>
    <el-date-picker v-model="period" align="right" size="small" :picker-options="pickerOptions" range-separator="至"
                    start-placeholder="开始时间" end-placeholder="结束时间"
                    style="width: 350px;margin-left: 3px" type="datetimerange"
                    :default-time="['08:00:00', '15:00:00']"></el-date-picker>
    <el-input v-model="mincosttime" clearable @input="mincosttime = mincosttime.replace(/[^\d]/g, '')"
              placeholder="最低时延" size="small" prefix-icon="el-icon-timer"
              style="width: 115px;margin-left: 3px"></el-input>
    <span>-</span>
    <el-input v-model="maxcosttime" clearable @input="maxcosttime = maxcosttime.replace(/[^\d]/g, '')"
              placeholder="最高时延" size="small" prefix-icon="el-icon-timer"
              style="width: 115px;margin-left: 3px"></el-input>
    <el-input v-model="clientip" clearable placeholder="IP" size="small"
              style="width: 150px;margin-left: 3px"></el-input>
    <el-input v-model="referer" clearable placeholder="Referer" size="small"
              style="width: 150px;margin-left: 3px"></el-input>
    <el-input v-model="useragent" clearable placeholder="UserAgent" size="small"
              style="width: 150px;margin-left: 3px"></el-input>
    <el-select v-model="fapp" clearable placeholder="调用方" size="small" style="width: 150px;margin-left: 3px" multiple collapse-tags>
      <el-option v-for="item in historyCaller" :key="item" :label="item" :value="item"></el-option>
    </el-select>
    <el-select v-model="tappip" clearable filterable placeholder="服务方IP" size="small"
               style="width: 140px;margin-left: 3px">
      <el-option v-for="item in historyIp" :key="item" :label="item" :value="item"></el-option>
    </el-select>
    <el-cascader v-model="funcChoose" :options="historyFunc" :props="{checkStrictly:true }" clearable
                 placeholder="选择请求模块或方法" filterable
                 separator="/" size="small" style="width:250px;margin-left: 3px"></el-cascader>
    <el-input v-model="sign" clearable @input="sign = sign.replace(/[^\d]/g, '')"
              placeholder="签名令牌id" size="small" prefix-icon="el-icon-lock"
              style="width: 115px;margin-left: 3px"></el-input>
    <el-input v-model="request" clearable placeholder="请求参数搜索" size="small"
              style="width: 250px;margin-left: 3px"></el-input>
    <el-input v-model="code" clearable @input="code = code.replace(/[^\d-]/g, '')" placeholder="code" size="small"
              style="width: 106px;margin-left: 3px"></el-input>
    <el-input v-model="msg" clearable placeholder="msg" size="small"
              style="width: 150px;margin-left: 3px"></el-input>
    <el-input v-if="appInfo.role===1" v-model="response" clearable placeholder="data" size="small"
              style="width: 280px;margin-left: 3px"></el-input>
    <el-input v-model="minrpclog" clearable @input="minrpclog = minrpclog.replace(/[^\d]/g, '')"
              placeholder="最小日志数" size="small" prefix-icon="el-icon-document"
              style="width: 128px;margin-left: 3px"></el-input>
    <span>-</span>
    <el-input v-model="maxrpclog" clearable @input="maxrpclog = maxrpclog.replace(/[^\d]/g, '')"
              placeholder="最大日志数" size="small" prefix-icon="el-icon-document"
              style="width: 128px;margin-left: 3px"></el-input>
    <el-checkbox v-model="noCache" border label="隐藏缓存" size="small"
                 style="margin-left: 3px;top:-2px;background-color: white;"></el-checkbox>
    <el-checkbox v-model="queryError" border label="只看异常" size="small"
                 style="margin-left: -28px;top:-2px;background-color: white;"></el-checkbox>
    <el-button size="mini" style="margin-left: 3px" type="success" icon="el-icon-search" @click="getLogTable">搜索
    </el-button>
    <el-button-group style="position: fixed;right:3px;margin-top: 3px;z-index: 999">
      <el-button size="mini" type="primary" icon="el-icon-arrow-left" :disabled="page===1" @click="getLogTablePre" style="padding-left: 7px;padding-right: 7px;">
        上一页
      </el-button>
      <el-button size="mini" type="info" disabled style="height: 29px;background: #409eff;padding-left: 7px;padding-right: 7px;">第{{ page }}页
      </el-button>
      <el-button size="mini" type="primary" :disabled="tableData.length!==20" @click="getLogTableNext" style="padding-left: 7px;padding-right: 7px;">下一页<i
        class="el-icon-arrow-right el-icon--right"></i></el-button>
      <el-button size="mini" type="success" icon="el-icon-s-data" @click="getLogTableCount" style="padding-left: 7px;padding-right: 7px;">总数</el-button>
    </el-button-group>
    <br/>
    <el-table :cell-class-name="tableRowClassName" v-loading="loading" :data="tableData" border size="mini"
              height="84.4vh" style="overflow:auto;width: 100%;margin-top: 1px"
              :header-cell-style="{'background-color': '#d3f9fa','color': '#000','padding':'1px','border':'1px solid #d7d7d7'}">
      <el-table-column :formatter="x=>x.rid.replace(/-/g, '')" label="rid" prop="rid" width="100"></el-table-column>
      <el-table-column label="时间(毫秒)">
        <el-table-column label="时间戳" prop="ts" width="91"></el-table-column>
        <el-table-column label="时延" prop="costtime" width="50"></el-table-column>
      </el-table-column>
      <el-table-column label="HTTP网关">
        <el-table-column label="IP" prop="clientip" width="88"></el-table-column>
        <el-table-column label="Referer" prop="referer" width="90">
          <template slot-scope="scope">
            <span class="httptext">{{ scope.row.referer }}</span>
            <el-link v-if="scope.row.referer.length>32" :underline="false"
                     style="position: absolute;right: 0;bottom: -6px;" @click="showRpcMsg(scope.row.referer)">
              <i class="el-icon-view"></i>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="UserAgent" prop="useragent" width="90">
          <template slot-scope="scope">
            <span class="httptext">{{ scope.row.useragent }}</span>
            <el-link v-if="scope.row.useragent.length>32" :underline="false"
                     style="position: absolute;right: 0;bottom: -6px;" @click="showRpcMsg(scope.row.useragent)">
              <i class="el-icon-view"></i>
            </el-link>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column :formatter="x=>(x.fapp==='router'?'http网关':x.fapp==='cron'?'定时作业':x.fapp)+'\n'+x.fappip"
                       label="调用方" prop="fapp" width="100"></el-table-column>
      <el-table-column label="服务方IP" prop="tappip" width="100"></el-table-column>
      <el-table-column label="方法" prop="func" width="140">
        <template slot-scope="scope">
          <span :style="scope.row.errcode>80?'color:red':scope.row.rpclog<0?'color:#E6A23C':''">{{
              scope.row.func
            }}</span>
        </template>
      </el-table-column>
      <el-table-column label="请求包" prop="request">
        <template slot-scope="scope">
          <div :style="scope.row.errcode>80?'color:red':scope.row.rpclog<0?'color:#E6A23C':''" class="httptext"
               v-text="scope.row.request"></div>
          <el-link v-if="scope.row.request.length>128" :underline="false"
                   style="position: absolute;right: 0;bottom: -6px;" @click="showJsonWin(scope.row.request)">
            <i class="el-icon-view"></i></el-link>
        </template>
      </el-table-column>
      <el-table-column label="返回包">
        <el-table-column label="code" prop="code" width="60">
          <template slot-scope="scope">
          <span :style="scope.row.errcode>80?'color:red':scope.row.rpclog<0?'color:#E6A23C':''">{{
              scope.row.code
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="msg" prop="msg" width="100">
          <template slot-scope="scope">
            <span class="httptext" :style="scope.row.errcode>80?'color:red':scope.row.rpclog<0?'color:#E6A23C':''">{{ scope.row.msg }}</span>
            <el-link v-if="scope.row.msg.length>32" :underline="false" style="position: absolute;right: 0;bottom: -6px;"
                     @click="showRpcMsg(scope.row.msg)">
              <i class="el-icon-view"></i>
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="data" prop="response" width="100">
          <template slot-scope="scope">
            <el-link v-if="scope.row.response!=='0'"
                     :type="scope.row.errcode>80?'danger':scope.row.rpclog<0?'warning':'primary'" :underline="false"
                     @click="showCache(scope.row)">
              <span v-if="scope.row.errcode!==18&&scope.row.errcode!==20&&scope.row.errcode!==17">{{ formatResSize(scope.row.response) }}</span>
              <span v-if="scope.row.errcode===17" style="color: #00bcd4">HTTP重定向</span>
              <span v-if="(scope.row.errcode===18||scope.row.errcode===20)&&scope.row.response.length===32" style="color: #40b3b3">HTTP缓存</span>
            </el-link>
          </template>
        </el-table-column>
      </el-table-column>
      <el-table-column label="调用链" prop="trace" width="80">
        <template v-slot="scope">
          <el-link v-if="scope.row.trace.length>0" :underline="false" @click="showTraceTable(scope.row)"><i
            class="el-icon-connection el-icon--right"></i></el-link>
        </template>
      </el-table-column>
      <el-table-column label="函数日志" prop="rpclog" width="80">
        <template slot-scope="scope">
          <el-link v-if="scope.row.rpclog!==0"
                   :type="scope.row.errcode>80?'danger':scope.row.rpclog<0?'warning':'primary'"
                   :underline="false" @click="showCacheLog(scope.row)">
            {{ Math.abs(scope.row.rpclog) }}条日志
          </el-link>
        </template>
      </el-table-column>
    </el-table>
    <br/>
    <el-dialog :visible.sync="traceTableVisible" width="99%" title="调用链">
      <div ref="trace0" style="height: 800px; width: 100vw;"></div>
    </el-dialog>
    <el-dialog :visible.sync="showJson" title="" width="66%">
      <json-viewer :boxed="true" :copyable="true" :expand-depth="8" show-double-quotes :show-array-index="false"
                   :value="jsonData" sort></json-viewer>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showJson = false">确 定</el-button>
      </span>
    </el-dialog>
    <el-dialog :visible.sync="showMsg" title="查看详情" width="98%">
      <span style="line-height: 22px;white-space: pre-wrap;">{{ rpcMsg }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showMsg = false">确 定</el-button>
      </span>
    </el-dialog>
    <el-drawer :with-header="false" :visible.sync="showLog" direction="ltr" size="77%">
      <ol v-if="rpcLog" class="infinite-list" v-infinite-scroll="load" style="overflow:auto;height: 97vh;margin-top: 11px;">
        <li v-for='(item,index) in rpcLog' :key='index+""+item.ts' :style="{'line-height': '18px','white-space': 'pre-wrap','font-size': '14px',color:levelColor[item.level]}">
          <span style="color: #047685;"> {{ item.ts }}  </span>
          {{ '【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content }}
          <br>
        </li>
      </ol>
    </el-drawer>
  </div>

</template>

<script>
import request from "@/utils/request";
import 'vue-json-viewer/style.css'
import Cookies from "js-cookie";
import * as echarts from "echarts";

export default {
  name: "Rpclogs",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
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
      pickerOptions: {
        shortcuts: [{
          text: '今天',
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            new Date()
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
      rpcLogRid: null,
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
    this.getAppNodeAndFuncList();
  },
  methods: {
    load() {
      request({
        url: "/admin/rpclog/getRpcLog",
        params: {
          page: this.rpcLogPage,
          rid: this.rpcLogRid,
        },
      }).then((res) => {
        if (res.data.length !== 0) {
          this.rpcLogPage++;
          res.data.map(x => this.rpcLog.push(x));
        }
      })
    },
    showRpcMsg(item) {
      this.showMsg = true;
      this.rpcMsg = item;
    },
    showCacheLog(item) {
      this.rpcLog = [];
      this.rpcLogPage = 1;
      this.rpcLogRid = item.rid;
      this.showLog = true;
    },
    showJsonWin(item) {
      this.showJson = true;
      let json = item;
      if (item.indexOf('<span style="color:red">') !== -1) {
        json = item.replace('<span style="color:red">', '').replace('</span>', '');
      }
      this.jsonData = JSON.parse(json);
    },
    showTraceTable(item) {
      this.loading = true;
      request({
        url: "/admin/rpclog/getTraceMemos",
        params: {
          rid: item.rid,
          trace: item.trace,
        },
      }).then((res) => {
        this.loading = false;
        this.traceTableVisible = true;
        item.children = res.data;
        item.response0 = res.msg;
        let data = {
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
            this.initEchartsTrace0({app: 'HTTP客户端', appip: item.clientip, type: 'node', useragent: item.useragent, referer: item.referer, children: [data]});
          } else {
            this.initEchartsTrace0(data);
          }
        });
      });
    },
    formatTraceData(data) {
      if (data === undefined || data === null) return null;
      return data.map(x => {
        x.type = 'line';
        x.symbolSize = 0.1;
        x.emphasis = {symbolSize: 0.1, itemStyle: {color: 'transparent'}, lineStyle: {width: 3, color: '#bbb', opacity: 1}};
        x.itemStyle = {color: 'transparent'};
        x.label = {show: true, position: [-66, -7], color: x.errcode > 80 ? '#f80000' : x.rpclog < 0 ? '#E6A23C' : '#5ba900', fontSize: 12};
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
        },
      }).then((res) => {
        this.loading = false;
        this.showJson = true;
        let response = res.data.response;
        if (response != null && response.length > 0) {
          if (response.charAt(0) !== '{' && response.charAt(0) !== '"' && response.charAt(0) !== '[') {
            response = '"' + response + '"';
          }
        }
        this.jsonData = JSON.parse(response);
      });
    },
    getAppNodeAndFuncList() {
      request({
        url: "/admin/home/getAppNodeAndFuncList",
        params: {},
      }).then((res) => {
        this.historyCaller = res.data.app.map(x => x.replace('cron', '定时作业').replace('router', 'http网关'));
        this.historyIp = res.data.ipaddr;
        this.historyFunc = res.data.func;
      });
    },
    tableRowClassName(index) {
      if (index.columnIndex === 1 || index.columnIndex === 12) {
        if (index.row.errcode > 80) {
          return "error-row";
        } else {
          return "success-row";
        }
      }
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
          noCache: this.noCache ? 1 : 0,
        },
      }).then((res) => {
        this.loading = false;
        if (res.code === 0) this.tableData = res.data;
      }).catch((err) => {
        this.loading = false;
      })
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
          noCache: this.noCache ? 1 : 0,
        },
      }).then((res) => {
        this.loading = false;
        if (res.code === 0) {
          this.$alert('总计' + res.data + '条', '总数', {
            confirmButtonText: '确定'
          });
        }
      }).catch((err) => {
        this.loading = false;
      })
    },
    formatResSize(reslen) {
      if (reslen < 1000) {
        return reslen + 'B';
      } else if (reslen < 1000000) {
        return (reslen / 1024).toFixed(2) + 'KB';
      } else {
        return (reslen / 1024 / 1024).toFixed(2) + 'MB';
      }
    },
    initEchartsTrace0(data) {
      echarts.init(this.$refs.trace0).setOption({
        title: {},
        tooltip: {
          trigger: 'item', triggerOn: 'mousemove', enterable: true, formatter: function (params) { // params 是一个包含当前节点信息的对象
            const nodeData = params.data;
            if (nodeData.type === 'line') {
              return `<div style="font-size: 13px;line-height: 16px;width: 800px;">
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">调用时间</span>:&nbsp;&nbsp;${nodeData.ts}</p>
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">调用方法</span>:&nbsp;&nbsp;${nodeData.func}</p>
                <p><span style="color: #80918e;width: 60px; display: inline-block;line-height: 10px">请求rid</span>:&nbsp;&nbsp;${nodeData.rid.replaceAll("-", "")}</p>
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
                    <p  style="display: -webkit-box;overflow: hidden;white-space: normal !important;text-overflow: ellipsis;word-wrap: break-word;-webkit-line-clamp: 5;  -webkit-box-orient: vertical;">
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
          type: 'tree', name: 'tree1', data: [data], symbolSize: 77, initialTreeDepth: 100, lineStyle: {width: 3, color: '#bbb', opacity: 1},
          label: {
            verticalAlign: 'middle', show: true, formatter: (params) => {
              let paramData = params.data;
              if (paramData.type === 'line') return paramData.func;
              else if (paramData.app === 'HTTP客户端') return paramData.app + "\n" + paramData.appip;
              return paramData.app + "\n" + paramData.appip + "\n" + paramData.costtime + "毫秒";
            }
          },
          leaves: {label: {verticalAlign: 'middle'}}, expandAndCollapse: false
        }]
      })
    },
  },
};
</script>
<style lang="scss" scoped>
.error-row {
  color: #ff0000;
}

.warning-row {
  color: #c3da04;
}

.success-row {
  color: #000000;
}

.cell {
  white-space: pre-line !important;
}

.httptext {
  display: -webkit-box;
  overflow: hidden;
  white-space: normal !important;
  text-overflow: ellipsis;
  word-wrap: break-word;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.flex-prepend-input {
  padding-top: 10px;
}

.flex-prepend-input ::v-deep .el-input-group__prepend {
  align-items: center; /* 垂直居中 */
  min-width: 145px; /* 设置最小宽度 */
  color: #30667c;
  font-size: 14px;
}

.flex-container {
  display: flex; /* 开启Flex布局 */
  align-items: center; /* 垂直方向上居中对齐子元素 */
}

.label {
  margin-right: 10px; /* 给文字和输入框之间添加一些间隔 */
}

</style>
