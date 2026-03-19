<template>
  <div style="padding: 0;background-color: #f1f1f1">
    <el-container style="height: 93vh; border: 1px solid #eee">
      <el-aside width="42vw">
        <div class="HisTitle">会话ID</div>
        <el-input v-model="prefix" class="input-with-select" clearable placeholder="前缀搜索" size="small" style="padding: 5px;" @clear="reset">
          <el-button slot="append" icon="el-icon-search" @click="getSessionList0"></el-button>
        </el-input>
        <el-collapse v-infinite-scroll="getSessionList" class="infinite-list" :infinite-scroll-disabled="disabled"
                     style="overflow:auto;height: 84vh;padding-left: 5px" v-loading="loading" v-model="chooseSessionId" accordion @change="showSession">
          <el-collapse-item v-for="(session, index) in sessionList" :key="session.key" :name="session.key"
                            placement="top" size="large" style="width: 99%;padding-bottom: 1px;">
            <template slot="title">
              <span style="color: #3a8515;white-space: nowrap;overflow: hidden;padding-left:5px;text-overflow: ellipsis;width:98%;">{{ session.key }} </span>
            </template>
            <el-statistic class="ttl-statistic" :value="new Date(session.ttl)" format="HH:mm:ss" time-indices>
              <template slot="prefix">有效期：</template>
            </el-statistic>
          </el-collapse-item>
        </el-collapse>
      </el-aside>
      <el-container style="flex: 1; ">
        <el-main style="background:#e0e0e0;padding:5px; position: relative;">
          <vue-json-editor style="height: 91vh" v-if="chooseSessionId!==''" v-model="jsonData" :showBtns="false" mode="code" lang="zh" :expanded-on-start="true"
                           @json-change="onJsonChange" @has-error="onError"/>
          <div v-if="chooseSessionId!==''&&appInfo.role===1" class="custom-toolbar-content">
            <el-tag class="session-id-tag">{{ chooseSessionId }}</el-tag>
            <el-popover width="160" v-model="visible"><p>确定删除吗？</p>
              <div style="text-align: right; margin: 0">
                <el-button size="mini" type="text" @click="visible = false">取消</el-button>
                <el-button type="danger" size="mini" @click="delSession">确定</el-button>
              </div>
              <el-button size="small" type="warning" slot="reference">删除</el-button>
            </el-popover>
            <el-button size="small" type="success" @click="updateSession" :disabled="isChange">保存</el-button>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import vueJsonEditor from 'vue-json-editor'

export default {
  name: "Session",
  components: {vueJsonEditor},
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
      sessionList: [],
      prefix: '',
      cursor: '',
      chooseSessionId: '',
      loading: true,
      disabled: false,
      chooseSession: {},
      jsonData: {},
      dynamicStyle: {
        height: 'auto', // 初始值或一个最小高度
        minHeight: '200px' // 设置一个最小高度避免内容过少时太小
      },
      visible: false,
      isChange: true,
      isErr: false,
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
  },
  methods: {
    updateSession() {
      if (this.isErr) {
        this.$message.error("json格式错误")
        return;
      }
      request({
        url: "/admin/session/updateSession",
        params: {
          sessionid: this.chooseSessionId,
          json: JSON.stringify(this.jsonData),
          expire: Math.floor((this.chooseSession.ttl - Date.now()) / 1000)
        },
      }).then((res) => {
        this.chooseSession.value = JSON.stringify(this.jsonData)
        this.$message.success('操作成功');
      });
    },
    delSession() {
      request({
        url: "/admin/session/updateSession",
        params: {
          sessionid: this.chooseSessionId,
          json: '{}',
          expire: -1
        },
      }).then((res) => {
        this.sessionList.splice(this.chooseSession, 1);
        this.chooseSession = {};
        this.chooseSessionId = '';
      });
    },
    onJsonChange(value) {
      this.isErr = false;
      this.isChange = this.chooseSession.value === JSON.stringify(value);
    },
    onError(value) {
      this.isErr = true;
    },
    showJson() {
      console.log(this.jsonData);
    },
    reset() {
      this.sessionList = [];
      this.cursor = null;
      this.getSessionList();
    },
    showSession() {
      this.isChange = true;
      if (this.chooseSessionId === '') {
        this.chooseSession = {};
        this.jsonData = {};
        this.ttl = Date.now() + 24 * 3600 * 1000;
      } else {
        this.chooseSession = this.sessionList.find(x => x.key === this.chooseSessionId);
        this.jsonData = JSON.parse(this.chooseSession.value);
        this.ttl = this.chooseSession.ttl;
      }
    },
    getSessionList0() {
      this.cursor = '';
      this.sessionList = [];
      this.getSessionList();
    },
    getSessionList() {
      this.loading = true;
      request({
        url: "/admin/session/getSessionList",
        params: {
          prefix: this.prefix,
          cursor: this.cursor
        },
      }).then((res) => {
        this.loading = false;
        res.data.map(x => {
          let exist = this.sessionList.find(y=>y.key===x.key);
          if(!exist)this.sessionList.push(x);
        });
        if (res.data.length > 0) {
          this.cursor = res.data[res.data.length - 1].key
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
:deep(.el-timeline-item__timestamp) {
  color: #000;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

:deep(.el-collapse-item__wrap) {
  background-color: #ee000000;
}

.HisTitle {
  display: flex;
  padding-top: 11px;
  font-weight: bolder;
  color: #40b3b3;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  -webkit-box-align: center;
  -ms-flex-align: center;
  align-items: center;
  -ms-flex-direction: column;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  flex-direction: column;
  text-align: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

:deep(.jsoneditor-poweredBy) {
  display: none !important;
}

:deep(.jsoneditor-modes) {
  display: none !important;
}

:deep(.jsoneditor-vue) {
  height: 100% !important;
}

:deep(.jsoneditor-outer) {
  height: 100% !important;
}

/* 关键：使用深度选择器定位编辑器工具栏，并为其设置相对定位，作为自定义内容的定位基准 */
::v-deep .jsoneditor .jsoneditor-menu {
  position: relative !important;
  padding-right: 300px; /* 为右上角的内容预留出足够的空间，避免被默认按钮遮挡 */
  min-height: 40px; /* 确保工具栏有足够的高度 */
  display: flex;
  align-items: center;
}

/* 将自定义内容定位到工具栏内部右上角 */
.custom-toolbar-content {
  position: absolute;
  top: 3%; /* 垂直居中 */
  right: 10px; /* 距离右侧的间距 */
  transform: translateY(-50%); /* 垂直居中修正 */
  z-index: 1000; /* 确保显示在最上层 */
  display: flex;
  align-items: center;
  gap: 10px; /* 元素之间的间距 */
}

/* 自定义标签和统计信息的样式，确保与工具栏风格协调 */
.custom-toolbar-content .session-id-tag {
  margin: 0 0 0 11px;
  font-size: 12px;
}

.custom-toolbar-content .ttl-statistic {
  background: rgba(255, 255, 255, 0.25); /* 半透明白色背景，融入工具栏 */
  padding: 2px 6px;
  margin: 0 0 0 11px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 12px;
  color: #fff; /* 文字颜色设置为白色，通常工具栏是深色 */
}

::v-deep .el-collapse-item__header {
  height: 35px !important; /* 设置标题栏高度 */
  line-height: 35px !important; /* 保持文字垂直居中 */
}

::v-deep .el-collapse-item__content {
  padding: 10px; /* 调整内容区域内边距 */
}

::v-deep .el-collapse-item__wrap {
  border: none; /* 可选：移除内容区域的边框 */
}

:deep(.el-collapse-item__header.is-active) {
  background-color: #d5d5d5; /* 选中时的背景色 */
  color: white; /* 选中时的文字颜色 */
}
</style>
