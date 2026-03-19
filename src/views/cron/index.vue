<template>
  <div style="margin-top: 3px">
    <el-table
      v-loading="loading"
      :data="taskData.filter(data =>  (!search || data.func.toLowerCase().includes(search.toLowerCase())))" border
      size="mini" style="margin: 3px;" :header-cell-style="{'background-color': '#d3f9fa','color': '#000'}">
      <el-table-column label="函数名" prop="func" width="300"></el-table-column>
      <el-table-column label="任务名称" prop="name" width="300"></el-table-column>
      <el-table-column :formatter="peroidFormat" label="执行周期" prop="period" width="120"></el-table-column>
      <el-table-column label="开始时间" width="150">
        <template slot-scope="scope"> {{new Date(scope.row.start).format("yyyy-MM-dd hh:mm:ss")}}</template>
      </el-table-column>
      <el-table-column label="结束时间" width="150">
        <template slot-scope="scope"> {{new Date(scope.row.end).format("yyyy-MM-dd hh:mm:ss")}}</template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createtime" width="150"></el-table-column>
      <el-table-column label="更新时间" prop="updatetime" width="150"></el-table-column>
      <el-table-column :formatter="runFormat" label="下次执行" prop="rid" width="100">
        <template slot-scope="scope">
          <el-statistic v-if="scope.row.status===1&&scope.row.rid===null" :value="new Date(scope.row.next).getTime()"
                        :value-style="{'color':'green','font-size':'15px','margin-left':'-22px'}"
                        format="HH:mm:ss" size="mini" time-indices @finish="scope.row.rid=''">
          </el-statistic>
          <span v-if="scope.row.rid!==null" style="color:green;font-size:15px"><i
            class="el-icon-loading"></i>执行中</span>
          <span v-if="scope.row.status===0&&scope.row.rid===null" style="color:#9e9e9e;font-size:15px"><i
            class="el-icon-document"></i>待生效</span>
          <span v-if="scope.row.status===2&&scope.row.rid===null" style="color:skyblue;font-size:15px"><i
            class="el-icon-coffee-cup"></i>跳过</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot="header" slot-scope="scope">
          <el-input v-model="search" placeholder="输入关键字搜索" size="mini" style="width: 320px"/>
          <el-button v-if="appInfo.role===1" type="warning" size="mini" style="margin-left: 11px" @click="cronAddTab">
            新增
          </el-button>
        </template>
        <template slot-scope="scope">
          <el-button type="text" @click="showTaskLog(scope.row)">执行历史</el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1||appInfo.role===2"
                     :disabled="(scope.row.status!==1&&scope.row.status!==3)||scope.row.rid!==null" type="text"
                     @click="manual(scope.row)">手动执行
          </el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1" type="text"
                     @click="showTaskRule(scope.row)"><span style="color: green">编辑<i
            class="el-icon-edit el-icon--right"></i></span></el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1&&scope.row.status===0" type="text"
                     @click="cronSwitch(scope.row)"><span style="color: green">启动<i
            class="el-icon-video-play el-icon--right"></i></span></el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1&&scope.row.status!==0" type="text"
                     @click="cronSwitch(scope.row)"><span style="color: red">停止<i
            class="el-icon-switch-button el-icon--right"></i></span></el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1&&scope.row.status===0" type="text"
                     @click="cronRemove(scope.row)"><span style="color: red">删除<i
            class="el-icon-delete el-icon--right"></i></span></el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :before-close="handlerClose" :close-on-click-modal="true" :close-on-press-escape="true"
               :visible.sync="taskLogShow"
               title="任务执行历史" width="44%">
      <el-timeline v-infinite-scroll="load" class="infinite-list" style="overflow:auto;">
        <el-timeline-item v-for="(tasklog, index) in taskLogData" :key="index"
                          :color="tasklog.code===-1?'#ff0000':'#009688'"
                          :timestamp="tasklog.ts+' 耗时：'+tasklog.costtime+'毫秒'" placement="top" size="large"
                          style="width: 99%;">
          <el-card :body-style="{ 'padding': '0' }">
            <div slot="header">
              <span :style="{'color':tasklog.code===-1?'#ff0000':'#009688'}">{{
                  tasklog.useragent === '' ? '自动触发' : ('手动触发(' + tasklog.useragent + ')')
                }}</span>
              <el-button v-if="tasklog.code===0" style="float: right; padding: 3px 0" type="text"
                         @click="taskLogDetail(tasklog.rid)">查看详情
              </el-button>
            </div>
            <p :style="{'padding-left':'10px','color':tasklog.code===-1?'#ff0000':'#009688'}">
              执行结果：{{ tasklog.msg === '' ? 'SUCCESS' : tasklog.msg }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
    <el-dialog :close-on-click-modal="false" :close-on-press-escape="false" :visible.sync="taskLogDetailShow" :fullscreen="true" title="任务执行详情">
      <el-descriptions :column="3" border class="margin-top">
        <el-descriptions-item label="rid"> {{ taskLogDeailt.rid }}</el-descriptions-item>
        <el-descriptions-item label="应用标识"> {{ taskLogDeailt.tapp }}</el-descriptions-item>
        <el-descriptions-item label="函数标识">{{ taskLogDeailt.func }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ taskLogDeailt.ts }}</el-descriptions-item>
        <el-descriptions-item label="任务耗时">
          {{
            taskLogDeailt.costtime / 1000 < 10 ? (taskLogDeailt.costtime + '毫秒') : peroidFormat(0, 0, Math.floor(taskLogDeailt.costtime))
          }}
        </el-descriptions-item>
        <el-descriptions-item label="执行节点">
          <el-tag size="medium">{{ taskLogDeailt.tappip }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="执行日志">
          <ul v-infinite-scroll="load" class="infinite-list" style="overflow-y:auto;height: 73vh">
            <li v-for='(item,index) in rpcLog' :key='index+""+item.ts' class='infinite-list-item'
                style="line-height: 18px;white-space: pre-wrap;font-size: 14px;">
              <span style="color: #00bcd4;">{{ item.ts }}</span>
              <span :style='{color:levelColor[item.level]}'>【{{ logLevel[item.level] }}】</span>
              <span style="color:#00bcd4">{{ item.clazz + '【' + item.method + ':' + item.line + '】 ' }}</span>
              <span>{{ item.content }}</span>
              <br>
            </li>
          </ul>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    <el-dialog :visible.sync="showCronDialog" :title="taskRuleAdd?'新增作业':'编辑作业'" width="88%">
      <div v-if="taskRule" style="padding: 11px">作业函数：<span style="padding: 11px">{{ cronFunc }}</span></div>
      <div v-if="taskRuleAdd" style="padding: 11px">作业函数：
        <el-select v-model="cronChoose" placeholder="请选择" size="small">
          <el-option v-for="item in cronChooseOption" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </div>
      <div style="padding: 11px"> 作业说明：
        <el-input style="width: 600px" v-model="cronName" size="small"></el-input>
      </div>
      <div style="padding: 11px">执行周期：
        <el-input style="width: 600px" v-model="cronPeriod" @input="cronPeriod = cronPeriod.replace(/[^\d]/g, '')"
                  size="small">
          <template slot="append">{{ peroidFormat(null, null, cronPeriod * 1000) }}</template>
        </el-input>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod+=3600">+1小时</el-link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod+=86400">+1天</el-link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod+=604800">+1周</el-link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod=Math.max(0,cronPeriod-3600)">-1小时</el-link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod=Math.max(0,cronPeriod-86400)">-1天</el-link>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <el-link type="info" :underline="false" @click="cronPeriod=Math.max(0,cronPeriod-604800)">-1周</el-link>
      </div>
      <div style="padding: 11px">起止时间：
        <el-date-picker v-model="cronBetween" align="right" size="small" range-separator="至"
                        start-placeholder="开始时间" end-placeholder="结束时间" type="datetimerange"></el-date-picker>
      </div>
      <div style="padding: 11px">执行规则：
        <el-button size="mini" type="info" @click="cronFuture">执行计划</el-button>
        <h4>每日：</h4>
        <div v-if="taskRuleHour.length>0"><span style="color:green">执行：{{ taskRuleHour }}</span></div>
        <div v-if="taskRuleHour2.length>0"><span style="color:red">跳过：{{ taskRuleHour2 }}</span></div>
        <el-select v-model="HH" multiple placeholder="请选择" style="width: 78vw" @change="changeHH">
          <el-option v-for="item in options[1]" :key="item" :label="'每日'+item+'-'+(item+1)+'点'"
                     :value="item"></el-option>
        </el-select>
        <h4>每周：</h4>
        <div v-if="taskRuleWeek.length>0"><span style="color:green">执行：{{ taskRuleWeek }}</span></div>
        <div v-if="taskRuleWeek2.length>0"><span style="color:red">跳过：{{ taskRuleWeek2 }}</span></div>
        <el-select v-model="WW" multiple placeholder="请选择" style="width: 78vw" @change="changeWW">
          <el-option v-for="item in options[0]" :key="item" :label="WEEK[item]" :value="item"></el-option>
        </el-select>
        <h4>每月：</h4>
        <div v-if="taskRuleMonth.length>0"><span style="color:green">执行：{{ taskRuleMonth }}</span></div>
        <div v-if="taskRuleMonth2.length>0"><span style="color:red">跳过：{{ taskRuleMonth2 }}</span></div>
        <el-select v-model="MM" multiple placeholder="请选择" style="width: 78vw" @change="changeMM">
          <el-option v-for="item in options[2]" :key="item" :label="'每月'+item+'号'" :value="item"></el-option>
        </el-select>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="taskRuleAdd = false;taskRule = false">取 消</el-button>
        <el-button type="primary" @click="cronAddOrEdit">保 存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import 'vue-json-viewer/style.css'
import Cookies from "js-cookie";
import {Message} from "element-ui";

export default {
  name: "Task",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
      type: 1,
      loading: false,
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#9E9E9E', '#8BC34A', '#409EFF', '#E6A23C', '#ff0000'],
      taskResult: ['info', 'success', 'warning', 'danger', 'danger'],
      taskResultColor: ['info', '#009688', '#9e9e9e', '#ff9800', '#ff0000', '#ff0000'],
      taskData: [],
      modules: [],
      activeNames: [],
      taskFunc: -1,
      taskLogData: [],
      taskLogPageNo: 1,
      taskLogPageSize: 10,
      taskLogShow: false,
      taskLogDetailShow: false,
      taskLogDeailt: {},
      taskRuleHour: '',
      taskRuleHour2: '',
      taskRuleWeek: '',
      taskRuleWeek2: '',
      taskRuleMonth: '',
      taskRuleMonth2: '',
      WEEK: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      options: [
        [0, 1, 2, 3, 4, 5, 6],
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      ],
      WW: [0, 1, 2, 3, 4, 5, 6],
      HH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      MM: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      taskRule: false,
      taskRuleAdd: false,
      cronChooseOption: [],
      cronChoose: [],
      func: '',
      rpcLog: [],
      timerId: null,
      search: '',
      cronFunc: '',
      cronName: '',
      cronPeriod: 0,
      cronBetween: [],
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
    this.getTaskList();
    this.timerId = setInterval(this.getTaskList, 3000);
  },
  beforeDestroy() {
    // 清除定时器
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  },
  computed: {
    showCronDialog: {
      get() {
        return this.taskRuleAdd || this.taskRule;
      },
      set(newVal) {
        if (!newVal) {
          this.taskRuleAdd = false;
          this.taskRule = false;
        }
      }
    }
  },
  methods: {
    handlerClose() {
      this.taskLogPageNo = 1;
      this.taskLogData = [];
      this.taskLogShow = false;
    },
    manual(row) {
      this.$confirm('确认手动触发任务?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.loading = true;
        request({
          url: "/admin/cron/manual",
          params: {
            id: row.id,
          },
        }).then((res) => {
          row.rid = '';
          this.loading = false;
        });
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    load() {
      this.taskLogPageNo++;
      this.taskLogList();
    },
    showTaskLog(row) {
      this.taskFunc = row.func;
      this.taskLogPageNo = 1;
      this.taskLogData = [];
      this.taskLogList();
      this.taskLogShow = true;
    },
    cronFuture() {

    },
    cronAddTab() {
      this.cronChoose = '';
      this.cronName = '';
      this.cronPeriod = '';
      this.cronBetween = [];
      this.WW = [0, 1, 2, 3, 4, 5, 6];
      this.HH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      this.MM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
      this.changeWW();
      this.changeHH();
      this.changeMM();
      request({
        url: "/admin/cron/cronAddOption",
        params: {},
      }).then((res) => {
        this.taskRuleAdd = true;
        this.cronPeriod = 0;
        this.cronChooseOption = res.data;
      });
    },
    cronAddOrEdit() {
      if (this.cronFunc == null || this.cronName == null || this.cronPeriod == null || this.cronPeriod > 31536000) {
        Message({message: "参数错误", type: "error", duration: 2 * 1000,});
        return;
      }
      if (this.cronPeriod < 5) {
        Message({message: "执行周期不能小于5秒", type: "error", duration: 2 * 1000,});
        return;
      }
      if (this.cronBetween == null || this.cronBetween[0] == null || this.cronBetween[1] == null) {
        Message({message: "起止时间不能为空", type: "error", duration: 2 * 1000,});
        return;
      }
      this.loading = true;
      let params = {
        name: this.cronName,
        period: this.cronPeriod,
        start: this.cronBetween[0].format("yyyy-MM-dd hh:mm:ss"),
        end: this.cronBetween[1].format("yyyy-MM-dd hh:mm:ss"),
        cron: this.options[0].map(x => this.WW.includes(x) ? 1 : 0).join('')
          + this.options[1].map(x => this.HH.includes(x) ? 1 : 0).join('')
          + this.options[2].map(x => this.MM.includes(x) ? 1 : 0).join('')
      }
      if (this.taskRuleAdd) params.func = this.cronChoose;
      else params.id = this.taskData.filter(x => x.func === this.cronFunc)[0].id;
      let url = this.taskRuleAdd ? "/admin/cron/cronAdd" : "/admin/cron/cronEdit";
      request({
        url: url, params: params,
      }).then((res) => {
        this.loading = false;
        this.$message.success('操作成功');
        this.taskRuleAdd = false;
        this.taskRule = false;
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    changeWW() {
      let arr = this.WW.map(x => this.WEEK[x]);
      let arr2 = this.options[0].filter(x => !this.WW.includes(x)).map(x => this.WEEK[x]);
      this.taskRuleWeek = arr.length === 7 ? '全周' : arr.join(' , ');
      this.taskRuleWeek2 = arr2.length === 7 ? '全周' : arr2.join(' , ');
    },
    changeHH() {
      let arr = this.HH.map(x => x + '点');
      let arr2 = this.options[1].filter(x => !this.HH.includes(x)).map(x => x + '点');
      this.taskRuleHour = arr.length === 24 ? '全天' : arr.join(' , ');
      this.taskRuleHour2 = arr2.length === 24 ? '全天' : arr2.join(' , ');
    },
    changeMM() {
      let arr = this.MM.map(x => x + '号');
      let arr2 = this.options[2].filter(x => !this.MM.includes(x)).map(x => x + '号');
      this.taskRuleMonth = arr.length === 31 ? '全月' : arr.join(' , ');
      this.taskRuleMonth2 = arr2.length === 31 ? '全月' : arr2.join(' , ');
    },
    showTaskRule(row) {
      this.cronFunc = row.func;
      this.cronName = row.name;
      this.cronPeriod = row.period / 1000;
      this.cronBetween = [new Date(row.start), new Date(row.end)];
      let week = row.cron.substring(0, 7);
      this.WW = [];
      for (let i = 0; i < week.length; i++) {
        if (week.charAt(i) === '1') this.WW.push(i);
      }
      this.changeWW();
      let hour = row.cron.substring(7, 31);
      this.HH = [];
      for (let i = 0; i < hour.length; i++) {
        if (hour.charAt(i) === '1') this.HH.push(i);
      }
      this.changeHH()
      this.MM = [];
      let month = row.cron.substring(31, 62);
      for (let i = 0; i < month.length; i++) {
        if (month.charAt(i) === '1') this.MM.push(i + 1);
      }
      this.changeMM();
      this.taskRule = true;
    },
    taskLogList() {
      this.loading = true;
      request({
        url: "/admin/cron/taskLogList",
        params: {
          func: this.taskFunc,
          pageNo: this.taskLogPageNo,
          pageSize: this.taskLogPageSize
        },
      }).then((res) => {
        if (res.data.length > 0) {
          res.data.map(item => this.taskLogData.push(item));
        }
        this.loading = false;
      });
    },
    taskLogDetail(rid) {
      this.loading = true;
      request({
        url: "/admin/rpclog/getCache",
        params: {rid: rid,},
      }).then((res) => {
        this.taskLogDeailt = res.data;
        request({
          url: "/admin/rpclog/getRpcLog",
          params: {rid: rid},
        }).then(res2 => {
          this.rpcLog = res2.data;
          this.taskLogDetailShow = true;
          this.loading = false;
        })
      });
    },
    runFormat(row, column, value, index) {
      if (value !== undefined) {
        return '执行中';
      } else if (row.status === 0) {
        return '-';
      } else {
        return '下次执行:' + row.next;
      }
    },
    peroidFormat(row, column, value, index) {
      let p = value / 1000;
      if (p < 60) {
        return p + '秒';
      } else if (p < 3600) {
        let m = p % 60;
        return Math.floor(p / 60) + '分钟' + (m !== 0 ? (m + '秒') : '');
      } else if (p < 86400) {
        let q = p % 3600;
        let m = q % 60;
        return Math.floor(p / 3600) + '时' + (q !== 0 ? (Math.floor(q / 60) + '分' + (m !== 0 ? (m + '秒') : '')) : '');
      } else {
        let d = p % 86400;
        let q = d % 3600;
        let m = q % 60;
        return Math.floor(p / 86400) + '天' + (d !== 0 ? Math.floor(d / 3600) + '时' + (q !== 0 ? (Math.floor(q / 60) + '分' + (m !== 0 ? (m + '秒') : '')) : '') : '');
      }
    },
    getTaskList() {
      request({
        url: "/admin/cron/tasklist",
        params: {},
      }).then((res) => {
        this.taskData = res.data;
        res.data.map(x => {
          let module = x.func.substring(x.app.length + 1, x.func.indexOf("/"));
          if (!this.modules.includes(module)) {
            this.modules.push(module);
          }
        });
      });
    },
    cronRemove(target) {
      this.$confirm('删除作业' + target.func, '确认执行此操作?', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        type: 'danger',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true;
            instance.confirmButtonText = '删除中...';
            this.loading = true;
            request({
              url: "/admin/cron/cronRemove",
              params: {
                id: target.id
              },
            }).then((res) => {
              this.loading = false;
              if (res.code === 0) {
                let checkInterval = setInterval(() => {
                  let check = this.taskData.filter(x => x.id === target.id);
                  if (check.length === 0) {
                    done();
                    instance.confirmButtonLoading = false;
                    clearInterval(checkInterval);
                  }
                }, 500);
              } else {
                done();
              }
            });
          } else {
            done();
          }
        }
      }).then(() => {
        this.$message.success('操作成功');
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    cronSwitch(target) {
      this.$confirm((target.status === 0 ? '启动作业 ' : '停止作业 ') + target.func, '确认执行此操作?', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        type: 'warning',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true;
            instance.confirmButtonText = '执行中...';
            this.loading = true;
            request({
              url: "/admin/cron/cronSwitch",
              params: {
                id: target.id
              },
            }).then((res) => {
              this.loading = false;
              if (res.code === 0) {
                let checkInterval = setInterval(() => {
                  let check = this.taskData.filter(x => x.id === target.id)[0].status;
                  if ((target.status !== 0 && check === 0) || (target.status === 0 && check !== 0)) {
                    done();
                    instance.confirmButtonLoading = false;
                    clearInterval(checkInterval);
                  }
                }, 500);
              } else {
                done();
              }
            });
          } else {
            done();
          }
        }
      }).then(() => {
        this.$message.success('操作成功');
      }).catch(() => {
        this.$message.info('已取消');
      });
    }
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
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.infinite-list {
  height: 600px;
  padding: 10px;
  margin: 0;
  list-style: none;
  border: 1px solid rgb(238, 238, 238);
}

:deep(.el-collapse-item__header) {
  padding-left: 11px;
  font-size: 16px;
}

.flex-prepend-input {
  padding-top: 10px;
}

.flex-prepend-input ::v-deep .el-input-group__prepend {
  align-items: center; /* 垂直居中 */
  min-width: 110px; /* 设置最小宽度 */
  color: black;
}

</style>
