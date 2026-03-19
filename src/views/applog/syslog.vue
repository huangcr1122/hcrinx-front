<template>
  <div style="margin-top: 10px">
    <el-date-picker v-model="period" align="right" size="small" :picker-options="pickerOptions" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间"
                    style="width: 350px;margin-left: 3px" type="datetimerange" :default-time="['08:00:00', '15:00:00']"></el-date-picker>
    <el-input v-model="content" clearable placeholder="日志搜索" size="small" style="width: 330px;margin-left: 3px"></el-input>
    <el-select v-model="level" clearable filterable placeholder="选择日志级别" size="small" style="width: 160px;margin-left: 3px">
      <el-option v-for="item in logLevel" :key="item" :label="item" :value="item"></el-option>
    </el-select>
    <el-button size="mini" style="margin-left: 3px" type="success" icon="el-icon-search" @click="searchLog">查询</el-button>
    <ul class="infinite-list" v-infinite-scroll="load" style="overflow:auto;height: 85vh;">
      <li v-for='(item,index) in logData' :key='index+""+item.ts' :style="{'line-height': '18px','white-space': 'pre-wrap','font-size': '14px',color:levelColor[item.level]}">
        <span style="color: #00bcd4">{{'【'+item.app+ (item.app==='data'?'':'-'+item.appip) + '】' + item.ts }}</span>
        {{ '【' + logLevel[item.level] + '】' + item.clazz + '【' + item.method + ':' + item.line + '】 ' + item.content }}
        <br>
      </li>
    </ul>
  </div>

</template>

<script>
import request from "@/utils/request";
import 'vue-json-viewer/style.css'

export default {
  name: "SysLogs",
  data() {
    return {
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#9E9E9E', '#8BC34A', '#409EFF', '#E6A23C', '#ff0000'],
      page: 1,
      period: [new Date(Date.now() - Date.now() % (24 * 3600 * 1000) - 728 * 3600 * 1000), new Date()],
      ts: null,
      rid: null,
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
    };
  },
  mounted() {
  },
  methods: {
    load() {
      request({
        url: "/admin/rpclog/syslog",
        params: {
          page: this.page,
          start: this.period[0].format("yyyy-MM-dd hh:mm:ss"),
          end: this.period[1].format("yyyy-MM-dd hh:mm:ss"),
          content: this.content,
          appip: this.appip,
          noMemoLog: this.noMemoLog ? 1 : 0,
          noCommonLog: this.noCommonLog ? 1 : 0,
          level: this.logLevel.indexOf(this.level),
        },
      }).then((res) => {
        if (res.data.length === 0) {
          this.$message.warning('到底啦');
        } else {
          this.page++;
          res.data.map(x => this.logData.push(x));
        }
      })
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
