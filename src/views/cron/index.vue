<template>
  <div class="page-shell cron-page">
    <div class="page-toolbar cron-page__toolbar">
      <template v-if="moduleOptions.length > 0">
        <span class="cron-page__module-label">模块</span>
        <el-button size="mini" @click="moduleFilter = moduleOptions.slice()">全选</el-button>
        <el-button size="mini" @click="moduleFilter = []">清空</el-button>
        <el-checkbox-group v-model="moduleFilter" size="mini" class="cron-page__module-group">
          <el-checkbox-button v-for="item in moduleOptions" :key="item" :label="item">{{ item }}</el-checkbox-button>
        </el-checkbox-group>
      </template>
      <div class="page-toolbar__group cron-page__toolbar-group">
        <el-select v-model="statusFilter" clearable placeholder="状态筛选" size="small" class="cron-page__status-filter">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button size="small" @click="clearFilters">清空</el-button>
        <el-button size="small" type="primary" icon="el-icon-refresh" @click="refreshTasks">刷新列表</el-button>
        <el-button v-if="canManage" size="small" type="primary" plain icon="el-icon-plus" @click="cronAddTab">新增作业</el-button>
      </div>
      <el-input v-model="search" clearable placeholder="搜索函数名或任务名称" size="small" class="cron-page__search" />
    </div>

    <el-card class="panel-card cron-page__list-card">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">作业列表</div>
          <div class="panel-subtitle">当前符合筛选条件 {{ filteredTaskData.length }} 个作业。</div>
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredTaskData" border size="mini" class="cron-page__table" height="100%">

        <el-table-column label="函数名" prop="func" min-width="260" show-overflow-tooltip />
        <el-table-column label="任务名称" prop="name" min-width="220" show-overflow-tooltip />
        <el-table-column label="执行周期" prop="period" width="160">
          <template slot-scope="scope">{{ peroidFormat(null, null, scope.row.period) }}</template>
        </el-table-column>
        <el-table-column label="有效时间" min-width="260">
          <template slot-scope="scope">
            <div class="cron-page__time-range">
              <div>{{ new Date(scope.row.start).format("yyyy-MM-dd hh:mm:ss") }}</div>
              <div class="muted-text">至 {{ new Date(scope.row.end).format("yyyy-MM-dd hh:mm:ss") }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" width="120">
          <template slot-scope="scope">
            <el-tag :type="statusTagType(scope.row)">{{ statusLabel(scope.row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下次执行" width="160">
          <template slot-scope="scope">
            <div v-if="scope.row.status === 1 && scope.row.rid === null" class="cron-page__countdown">
              <span :style="{ color: '#16a34a', 'font-size': '14px' }">{{ getCountdown(scope.row) }}</span>
            </div>
            <span v-else-if="scope.row.rid !== null" class="cron-page__running-text"><i class="el-icon-loading"></i> 执行中</span>
            <span v-else class="muted-text">{{ scope.row.next || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createtime" width="170" />
        <el-table-column label="更新时间" prop="updatetime" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="showTaskLog(scope.row)">执行历史</el-button>
            <el-button
              v-if="canExecute"
              :disabled="(scope.row.status !== 1 && scope.row.status !== 3) || scope.row.rid !== null"
              type="text"
              @click="manual(scope.row)"
            >
              手动执行
            </el-button>
            <el-button v-if="canManage" type="text" @click="showTaskRule(scope.row)">编辑</el-button>
            <el-button v-if="canManage && scope.row.status === 0" type="text" @click="cronSwitch(scope.row)">启动</el-button>
            <el-button v-if="canManage && scope.row.status !== 0" type="text" @click="cronSwitch(scope.row)">停止</el-button>
            <el-button v-if="canManage && scope.row.status === 0" type="text" @click="cronRemove(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      :before-close="handlerClose"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :visible.sync="taskLogShow"
      title="任务执行历史"
      width="42%"
      custom-class="compact-dialog"
    >

      <el-timeline v-infinite-scroll="load" class="list-scroll cron-page__timeline">
        <el-timeline-item
          v-for="(tasklog, index) in taskLogData"
          :key="index"
          :color="tasklog.code === -1 ? '#ef4444' : '#10b981'"
          :timestamp="tasklog.ts + ' 耗时：' + tasklog.costtime + '毫秒'"
          placement="top"
          size="large"
        >
          <el-card :body-style="{ padding: '0' }">
            <div slot="header" class="cron-page__timeline-header">
              <span :style="{ color: tasklog.code === -1 ? '#ef4444' : '#10b981' }">
                {{ tasklog.useragent === '' ? '自动触发' : ('手动触发(' + tasklog.useragent + ')') }}
              </span>
              <el-button v-if="tasklog.code === 0" type="text" @click="taskLogDetail(tasklog.rid)">查看详情</el-button>
            </div>
            <p class="cron-page__timeline-result" :style="{ color: tasklog.code === -1 ? '#ef4444' : '#10b981' }">
              执行结果：{{ tasklog.msg === '' ? 'SUCCESS' : tasklog.msg }}
            </p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

    <el-dialog
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :visible.sync="taskLogDetailShow"
      :fullscreen="true"
      title="任务执行详情"
      custom-class="compact-dialog"
    >

      <div class="split-panel cron-page__detail-layout">
        <el-card class="panel-card">
          <div class="panel-header">
            <div class="panel-header__main">
              <div class="panel-title">基础信息</div>
              <div class="panel-subtitle">查看本次任务执行节点、耗时和返回详情。</div>
            </div>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="RID">{{ taskLogDeailt.rid }}</el-descriptions-item>
            <el-descriptions-item label="应用标识">{{ taskLogDeailt.tapp }}</el-descriptions-item>
            <el-descriptions-item label="函数标识">{{ taskLogDeailt.func }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ taskLogDeailt.ts }}</el-descriptions-item>
            <el-descriptions-item label="任务耗时">
              {{ taskLogDeailt.costtime / 1000 < 10 ? (taskLogDeailt.costtime + '毫秒') : peroidFormat(0, 0, Math.floor(taskLogDeailt.costtime)) }}
            </el-descriptions-item>
            <el-descriptions-item label="执行节点">
              <el-tag size="small">{{ taskLogDeailt.tappip }}</el-tag>

            </el-descriptions-item>
          </el-descriptions>
        </el-card>
        <el-card class="panel-card">
          <div class="panel-header">
            <div class="panel-header__main">
              <div class="panel-title">执行日志</div>
              <div class="panel-subtitle">按时间顺序展示任务内部日志。</div>
            </div>
          </div>
          <div class="log-stream cron-page__detail-log">
            <div v-for="(item, index) in rpcLog" :key="index + '' + item.ts" class="log-stream__item">
              <span class="log-stream__meta">{{ item.ts }}</span>
              <span :style="{ color: levelColor[item.level] }">【{{ logLevel[item.level] }}】</span>
              <span style="color:#67e8f9">{{ item.clazz + '【' + item.method + ':' + item.line + '】 ' }}</span>
              <span>{{ item.content }}</span>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="showCronDialog" :title="taskRuleAdd ? '新增作业' : '编辑作业'" width="82%" custom-class="compact-dialog">

      <div class="panel-stack">
        <div class="filter-grid">
          <div v-if="taskRuleAdd">
            <div class="section-caption">作业函数</div>
            <el-select v-model="cronChoose" placeholder="请选择作业函数" size="small" style="width: 100%">
              <el-option v-for="item in cronChooseOption" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
          <div v-else>
            <div class="section-caption">作业函数</div>
            <el-input :value="cronFunc" disabled size="small" />
          </div>
          <div>
            <div class="section-caption">作业说明</div>
            <el-input v-model="cronName" size="small" />
          </div>
          <div>
            <div class="section-caption">执行周期（秒）</div>
            <el-input v-model="cronPeriod" size="small" @input="cronPeriod = cronPeriod.replace(/[^\d]/g, '')">
              <template slot="append">{{ cronPeriod ? peroidFormat(null, null, cronPeriod * 1000) : '未设置' }}</template>
            </el-input>
          </div>
          <div>
            <div class="section-caption">起止时间</div>
            <el-date-picker
              v-model="cronBetween"
              align="right"
              end-placeholder="结束时间"
              range-separator="至"
              size="small"
              start-placeholder="开始时间"
              style="width: 100%"
              type="datetimerange"
            />
          </div>
        </div>

        <div class="page-toolbar__group cron-page__shortcut-links">
          <el-link type="info" :underline="false" @click="cronPeriod = String((Number(cronPeriod) || 0) + 3600)">+1小时</el-link>
          <el-link type="info" :underline="false" @click="cronPeriod = String((Number(cronPeriod) || 0) + 86400)">+1天</el-link>
          <el-link type="info" :underline="false" @click="cronPeriod = String((Number(cronPeriod) || 0) + 604800)">+1周</el-link>
          <el-link type="info" :underline="false" @click="cronPeriod = String(Math.max(0, (Number(cronPeriod) || 0) - 3600))">-1小时</el-link>
          <el-link type="info" :underline="false" @click="cronPeriod = String(Math.max(0, (Number(cronPeriod) || 0) - 86400))">-1天</el-link>
          <el-link type="info" :underline="false" @click="cronPeriod = String(Math.max(0, (Number(cronPeriod) || 0) - 604800))">-1周</el-link>
          <el-button size="mini" type="info" plain @click="cronFuture">查看规则提示</el-button>
        </div>

        <div class="cron-page__rule-grid">
          <div class="cron-page__rule-card">
            <div class="panel-title">每日执行时段</div>
            <div class="panel-subtitle">执行：{{ taskRuleHour }}</div>
            <div class="panel-subtitle">跳过：{{ taskRuleHour2 }}</div>
            <el-select v-model="HH" multiple placeholder="请选择每日时段" style="width: 100%" @change="changeHH">
              <el-option v-for="item in options[1]" :key="item" :label="'每日 ' + item + '-' + (item + 1) + ' 点'" :value="item" />
            </el-select>
          </div>
          <div class="cron-page__rule-card">
            <div class="panel-title">每周执行日</div>
            <div class="panel-subtitle">执行：{{ taskRuleWeek }}</div>
            <div class="panel-subtitle">跳过：{{ taskRuleWeek2 }}</div>
            <el-select v-model="WW" multiple placeholder="请选择每周执行日" style="width: 100%" @change="changeWW">
              <el-option v-for="item in options[0]" :key="item" :label="WEEK[item]" :value="item" />
            </el-select>
          </div>
          <div class="cron-page__rule-card">
            <div class="panel-title">每月执行日</div>
            <div class="panel-subtitle">执行：{{ taskRuleMonth }}</div>
            <div class="panel-subtitle">跳过：{{ taskRuleMonth2 }}</div>
            <el-select v-model="MM" multiple placeholder="请选择每月执行日" style="width: 100%" @change="changeMM">
              <el-option v-for="item in options[2]" :key="item" :label="'每月 ' + item + ' 号'" :value="item" />
            </el-select>
          </div>
        </div>

        <div v-if="futureExecTimes.length > 0" class="cron-page__preview">
          <div class="panel-title">未来执行预览</div>
          <div class="panel-subtitle">根据当前规则和周期，接下来 5 次预计执行时间</div>
          <div class="cron-page__preview-list">
            <div v-for="(t, i) in futureExecTimes" :key="i" class="cron-page__preview-item">
              <el-tag size="small" type="info">{{ i + 1 }}</el-tag>
              <span>{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="taskRuleAdd = false; taskRule = false">取 消</el-button>
        <el-button type="primary" @click="cronAddOrEdit">保 存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import 'vue-json-viewer/style.css';
import Cookies from "js-cookie";
import { Message } from "element-ui";

export default {
  name: "Task",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")) || {},
      loading: false,
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#9E9E9E', '#8BC34A', '#409EFF', '#E6A23C', '#ff0000'],
      taskData: [],
      taskFunc: '',
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
        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]
      ],
      WW: [0, 1, 2, 3, 4, 5, 6],
      HH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      MM: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
      taskRule: false,
      taskRuleAdd: false,
      cronChooseOption: [],
      cronChoose: '',
      rpcLog: [],
      timerId: null,
      countdownTick: 0,
      countdownTimerId: null,
      search: '',
      statusFilter: '',
      moduleFilter: [],
      cronFunc: '',
      cronName: '',
      cronPeriod: '0',
      cronBetween: []
    };
  },
  computed: {
    canManage() {
      return this.appInfo.role === 1;
    },
    canExecute() {
      return this.appInfo.role === 1 || this.appInfo.role === 2;
    },
    roleLabel() {
      return this.appInfo.role === 1 ? '管理' : this.appInfo.role === 2 ? '协作' : '访客';
    },
    runningTaskCount() {
      return this.taskData.filter(item => item.rid !== null || item.status === 1).length;
    },
    pendingTaskCount() {
      return this.taskData.filter(item => item.status === 0).length;
    },
    skippedTaskCount() {
      return this.taskData.filter(item => item.status === 2 || item.status === 3).length;
    },
    statusOptions() {
      return [
        { label: '待生效', value: 0 },
        { label: '运行中', value: 1 },
        { label: '已跳过', value: 2 },
        { label: '已停止', value: 3 }
      ];
    },
    filteredTaskData() {
      const keyword = (this.search || '').trim().toLowerCase();
      return this.taskData.filter(item => {
        const matchKeyword = !keyword || item.func.toLowerCase().includes(keyword) || (item.name || '').toLowerCase().includes(keyword);
        const matchStatus = this.statusFilter === '' || item.status === this.statusFilter;
        const rowModule = (item.func || '').split('/')[1] || '';
        const matchModule = this.moduleFilter.includes(rowModule);
        return matchKeyword && matchStatus && matchModule;
      });
    },
    moduleOptions() {
      const modules = [...new Set(this.taskData.map(row => (row.func || '').split('/')[1]).filter(Boolean))];
      return modules.sort();
    },
    futureExecTimes() {
      const period = Number(this.cronPeriod) * 1000;
      if (!period || period < 5000 || !this.cronBetween || !this.cronBetween[0] || !this.cronBetween[1]) return [];
      const startMs = this.cronBetween[0].getTime();
      const endMs = this.cronBetween[1].getTime();
      const now = Date.now();
      const results = [];
      // 对齐到周期：找到从start开始的下一个周期点
      let cursor = Math.max(startMs, now);
      if (cursor > startMs) {
        const steps = Math.ceil((cursor - startMs) / period);
        cursor = startMs + steps * period;
      }
      const maxTime = now + 400 * 86400000; // 搜索未来约13个月
      let guard = 0;
      while (cursor <= maxTime && results.length < 5 && guard < 500000) {
        guard++;
        if (cursor > now) {
          const d = new Date(cursor);
          const weekIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
          const hour = d.getHours();
          const date = d.getDate();
          const weekMatch = this.WW.includes(weekIdx);
          const hourMatch = this.HH.includes(hour);
          const monthMatch = this.MM.includes(date);
          if (weekMatch && hourMatch && monthMatch) {
            const label = d.format('yyyy-MM-dd hh:mm:ss');
            results.push(cursor > endMs ? label + '（已超出有效期）' : label);
            cursor += period;
          } else if (!hourMatch) {
            // 当前小时不匹配，跳到下一个匹配小时
            const nextH = this.HH.find(h => h > hour);
            const next = new Date(cursor);
            if (nextH !== undefined) {
              next.setHours(nextH, 0, 0, 0);
            } else {
              next.setDate(next.getDate() + 1);
              next.setHours(this.HH[0] || 0, 0, 0, 0);
            }
            cursor = startMs + Math.ceil((next.getTime() - startMs) / period) * period;
          } else {
            // 小时匹配但日/周不匹配，跳到明天首个匹配小时
            const next = new Date(cursor);
            next.setDate(next.getDate() + 1);
            next.setHours(this.HH[0] || 0, 0, 0, 0);
            cursor = startMs + Math.ceil((next.getTime() - startMs) / period) * period;
          }
        } else {
          cursor += period;
        }
      }
      return results;
    },
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
  mounted() {
    if (!this.app) {
      this.$router.push({ path: "/" });
      return;
    }
    this.getTaskList();
    this.timerId = setInterval(this.getTaskList, 3000);
    this.countdownTimerId = setInterval(() => { this.countdownTick++; }, 1000);
  },
  beforeDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
    }
  },
  methods: {
    getCountdown(row) {
      // eslint-disable-next-line no-unused-expressions
      this.countdownTick; // 触发响应式依赖，每秒刷新
      const ts = new Date(row.next).getTime();
      if (isNaN(ts)) return '-';
      let diff = Math.max(ts - Date.now(), 0);
      if (diff === 0) {
        row.rid = '';
        return '00:00:00';
      }
      const days = Math.floor(diff / 86400000);
      diff %= 86400000;
      const hours = Math.floor(diff / 3600000);
      diff %= 3600000;
      const minutes = Math.floor(diff / 60000);
      diff %= 60000;
      const seconds = Math.floor(diff / 1000);
      const pad = n => String(n).padStart(2, '0');
      return (days > 0 ? days + '天 ' : '') + pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
    },
    clearFilters() {
      this.search = '';
      this.statusFilter = '';
      this.moduleFilter = [];
    },
    refreshTasks() {
      this.getTaskList();
    },
    statusLabel(row) {
      if (row.rid !== null) return '执行中';
      if (row.status === 0) return '待生效';
      if (row.status === 1) return '运行中';
      if (row.status === 2) return '已跳过';
      return '已停止';
    },
    statusTagType(row) {
      if (row.rid !== null) return 'warning';
      if (row.status === 1) return 'success';
      if (row.status === 0) return 'info';
      if (row.status === 2) return '';
      return 'danger';
    },
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
            id: row.id
          }
        }).then(() => {
          row.rid = '';
          this.$message.success('任务已触发');
        }).finally(() => {
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
      this.$message.info('可通过“每日 / 每周 / 每月”三组规则组合出执行窗口。');
    },
    cronAddTab() {
      this.cronChoose = '';
      this.cronFunc = '';
      this.cronName = '';
      this.cronPeriod = '0';
      this.cronBetween = [];
      this.WW = [0, 1, 2, 3, 4, 5, 6];
      this.HH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      this.MM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31];
      this.changeWW();
      this.changeHH();
      this.changeMM();
      request({
        url: "/admin/cron/cronAddOption",
        params: {}
      }).then((res) => {
        this.taskRuleAdd = true;
        this.cronChooseOption = res.data;
      });
    },
    cronAddOrEdit() {
      const currentFunc = this.taskRuleAdd ? this.cronChoose : this.cronFunc;
      if (!currentFunc || this.cronName == null || this.cronPeriod == null || Number(this.cronPeriod) > 31536000) {
        Message({ message: "参数错误", type: "error", duration: 2 * 1000 });
        return;
      }
      if (Number(this.cronPeriod) < 5) {
        Message({ message: "执行周期不能小于5秒", type: "error", duration: 2 * 1000 });
        return;
      }
      if (this.cronBetween == null || this.cronBetween[0] == null || this.cronBetween[1] == null) {
        Message({ message: "起止时间不能为空", type: "error", duration: 2 * 1000 });
        return;
      }
      this.loading = true;
      const params = {
        name: this.cronName,
        period: Number(this.cronPeriod),
        start: this.cronBetween[0].format("yyyy-MM-dd hh:mm:ss"),
        end: this.cronBetween[1].format("yyyy-MM-dd hh:mm:ss"),
        cron: this.options[0].map(x => this.WW.includes(x) ? 1 : 0).join('')
          + this.options[1].map(x => this.HH.includes(x) ? 1 : 0).join('')
          + this.options[2].map(x => this.MM.includes(x) ? 1 : 0).join('')
      };
      if (this.taskRuleAdd) params.func = this.cronChoose;
      else params.id = this.taskData.filter(x => x.func === this.cronFunc)[0].id;
      const url = this.taskRuleAdd ? "/admin/cron/cronAdd" : "/admin/cron/cronEdit";
      request({
        url: url,
        params: params
      }).then(() => {
        this.$message.success('操作成功');
        this.taskRuleAdd = false;
        this.taskRule = false;
        this.getTaskList();
      }).finally(() => {
        this.loading = false;
      });
    },
    changeWW() {
      const arr = this.WW.map(x => this.WEEK[x]);
      const arr2 = this.options[0].filter(x => !this.WW.includes(x)).map(x => this.WEEK[x]);
      this.taskRuleWeek = arr.length === 7 ? '全周' : arr.join('，');
      this.taskRuleWeek2 = arr2.length === 0 ? '无' : arr2.join('，');
    },
    changeHH() {
      const arr = this.HH.map(x => x + '点');
      const arr2 = this.options[1].filter(x => !this.HH.includes(x)).map(x => x + '点');
      this.taskRuleHour = arr.length === 24 ? '全天' : arr.join('，');
      this.taskRuleHour2 = arr2.length === 0 ? '无' : arr2.join('，');
    },
    changeMM() {
      const arr = this.MM.map(x => x + '号');
      const arr2 = this.options[2].filter(x => !this.MM.includes(x)).map(x => x + '号');
      this.taskRuleMonth = arr.length === 31 ? '全月' : arr.join('，');
      this.taskRuleMonth2 = arr2.length === 0 ? '无' : arr2.join('，');
    },
    showTaskRule(row) {
      this.cronFunc = row.func;
      this.cronName = row.name;
      this.cronPeriod = String(row.period / 1000);
      this.cronBetween = [new Date(row.start), new Date(row.end)];
      const week = row.cron.substring(0, 7);
      this.WW = [];
      for (let i = 0; i < week.length; i++) {
        if (week.charAt(i) === '1') this.WW.push(i);
      }
      this.changeWW();
      const hour = row.cron.substring(7, 31);
      this.HH = [];
      for (let i = 0; i < hour.length; i++) {
        if (hour.charAt(i) === '1') this.HH.push(i);
      }
      this.changeHH();
      this.MM = [];
      const month = row.cron.substring(31, 62);
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
        }
      }).then((res) => {
        if (res.data.length > 0) {
          res.data.map(item => this.taskLogData.push(item));
        }
      }).finally(() => {
        this.loading = false;
      });
    },
    taskLogDetail(rid) {
      this.loading = true;
      request({
        url: "/admin/rpclog/getCache",
        params: { rid: rid }
      }).then((res) => {
        this.taskLogDeailt = res.data;
        request({
          url: "/admin/rpclog/getRpcLog",
          params: { rid: rid }
        }).then(res2 => {
          this.rpcLog = res2.data;
          this.taskLogDetailShow = true;
        }).finally(() => {
          this.loading = false;
        });
      });
    },
    peroidFormat(row, column, value) {
      const p = value / 1000;
      if (p < 60) {
        return p + '秒';
      } else if (p < 3600) {
        const m = p % 60;
        return Math.floor(p / 60) + '分钟' + (m !== 0 ? (m + '秒') : '');
      } else if (p < 86400) {
        const q = p % 3600;
        const m = q % 60;
        return Math.floor(p / 3600) + '时' + (q !== 0 ? (Math.floor(q / 60) + '分' + (m !== 0 ? (m + '秒') : '')) : '');
      }
      const d = p % 86400;
      const q = d % 3600;
      const m = q % 60;
      return Math.floor(p / 86400) + '天' + (d !== 0 ? Math.floor(d / 3600) + '时' + (q !== 0 ? (Math.floor(q / 60) + '分' + (m !== 0 ? (m + '秒') : '')) : '') : '');
    },
    getTaskList() {
      request({
        url: "/admin/cron/tasklist",
        params: {}
      }).then((res) => {
        this.taskData = res.data;
        if (this.moduleFilter.length === 0) {
          this.moduleFilter = this.moduleOptions;
        }
      });
    },
    cronRemove(target) {
      this.$confirm('删除作业 ' + target.func, '确认执行此操作?', {
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
              }
            }).then((res) => {
              this.loading = false;
              if (res.code === 0) {
                const checkInterval = setInterval(() => {
                  const check = this.taskData.filter(x => x.id === target.id);
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
              }
            }).then((res) => {
              this.loading = false;
              if (res.code === 0) {
                const checkInterval = setInterval(() => {
                  const check = this.taskData.filter(x => x.id === target.id)[0].status;
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
  }
};
</script>

<style lang="scss" scoped>
.cron-page {
  position: relative;
  height: calc(100vh - 66px);
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.cron-page__toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}


.cron-page__toolbar-group {
  flex-wrap: wrap;
}

.cron-page__summary-grid {
  margin-top: 14px;
}

.cron-page__search {
  width: 400px;
  min-width: 400px;
  flex: 0 0 auto;
  margin-left: auto;
}

.cron-page__status-filter {
  width: 140px;
  min-width: 140px;
}

.cron-page__module-label {
  flex: 0 0 auto;
  font-size: 13px;
  color: #64748b;
  margin-left: 4px;
}

.cron-page__module-group {
  flex: 0 0 auto;
}

.cron-page__list-card {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

::v-deep .cron-page__list-card .el-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.cron-page__table {
  flex: 1;
  min-height: 0;
}

.cron-page__table-actions {

  max-width: 250px;
}

.cron-page__time-range {
  font-size: 12px;
  line-height: 1.45;
}


.cron-page__countdown {
  min-width: 90px;
}

.cron-page__preview {
  padding: 12px;
  border-radius: 12px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.cron-page__preview-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.cron-page__preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
}

.cron-page__running-text {
  color: #16a34a;
}

.cron-page__timeline {
  padding: 6px;
}

.cron-page__timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.cron-page__timeline-result {
  padding: 0 8px 10px;
  font-size: 12px;
  line-height: 1.45;
}

.cron-page__detail-layout {
  grid-template-columns: minmax(300px, 30%) minmax(0, 1fr);
}

.cron-page__detail-log {
  min-height: calc(100vh - 180px);
  max-height: calc(100vh - 180px);
}

.cron-page__shortcut-links {
  row-gap: 4px;
}

.cron-page__rule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.cron-page__rule-card {
  padding: 14px;
  border-radius: 16px;
  background: #f8fbff;
  border: 1px solid rgba(226, 232, 240, 0.9);
}


@media (max-width: 1200px) {
  .cron-page__rule-grid,
  .cron-page__detail-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 992px) {
  .cron-page {
    height: auto;
    min-height: auto;
  }

  .cron-page__list-card {
    min-height: calc(100vh - 220px);
  }
}

</style>
