<template>
  <div class="page-shell session-page">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">缓存管理</div>
        <div class="page-header__desc">按前缀检索缓存 Key，查看 JSON 内容并在管理员权限下进行修改或删除。</div>
      </div>
    </div>


    <div class="split-panel">
      <el-card shadow="never" class="panel-card">
        <div class="page-toolbar">
          <div>
            <div class="panel-title">缓存列表</div>
            <div class="panel-subtitle">按前缀搜索缓存 Key，共 {{ sessionList.length }} 条</div>
          </div>
          <div class="page-toolbar__group">
            <el-button size="small" type="primary" icon="el-icon-refresh-right" @click="getSessionList0">刷新列表</el-button>
          </div>
        </div>

        <el-input v-model="prefix" clearable placeholder="前缀搜索" size="small" @clear="reset">
          <el-button slot="append" icon="el-icon-search" @click="getSessionList0"></el-button>
        </el-input>
        <el-collapse v-infinite-scroll="getSessionList" class="list-scroll list-scroll--compact" :infinite-scroll-disabled="disabled" v-loading="loading" v-model="chooseSessionId" accordion @change="showSession">

          <el-collapse-item v-for="session in sessionList" :key="session.key" :name="session.key">
            <template slot="title">
              <span class="session-title">{{ session.key }}</span>
            </template>
          </el-collapse-item>
        </el-collapse>
      </el-card>

      <el-card shadow="never" class="panel-card detail-card">
        <div class="page-toolbar">
          <div>
            <div class="panel-title">缓存详情</div>
            <div class="panel-subtitle detail-card__subtitle">{{ chooseSessionId || '请选择左侧缓存记录' }}</div>
          </div>
          <div v-if="chooseSessionId!==''&&appInfo.role===1" class="page-toolbar__group page-toolbar__group--compact">
            <el-popover width="160" v-model="visible">
              <p>确定删除当前缓存吗？</p>
              <div class="compact-popover__actions">
                <el-button size="mini" type="text" @click="visible = false">取消</el-button>
                <el-button type="danger" size="mini" @click="delSession">确定</el-button>
              </div>

              <el-button slot="reference" size="small" type="warning">删除</el-button>
            </el-popover>
            <el-button size="small" type="success" @click="updateSession" :disabled="isChange">保存</el-button>
          </div>
        </div>
        <div v-if="chooseSession!=='' && chooseSession.ttl" class="detail-card__ttl">
          <el-statistic :value="new Date(chooseSession.ttl)" format="HH:mm:ss" time-indices>
            <template slot="prefix">缓存有效期：</template>
          </el-statistic>
        </div>

        <div v-if="chooseSessionId!==''" class="json-wrapper">
          <vue-json-editor v-model="jsonData" class="json-shell json-shell--compact" :showBtns="false" mode="code" lang="zh" :expanded-on-start="true" @json-change="onJsonChange" @has-error="onError"/>

        </div>
        <el-empty v-else description="请选择左侧缓存后查看详情"></el-empty>
      </el-card>
    </div>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import vueJsonEditor from 'vue-json-editor';

export default {
  name: "Cache",
  components: {vueJsonEditor},
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app") || '{}'),
      sessionList: [],
      prefix: '',
      cursor: '',
      chooseSessionId: '',
      loading: true,
      disabled: false,
      chooseSession: {},
      jsonData: {},
      visible: false,
      isChange: true,
      isErr: false,
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
      return;
    }
    this.getSessionList0();
  },
  methods: {
    updateSession() {
      if (this.isErr) {
        this.$message.error("json格式错误");
        return;
      }
      request({
        url: "/admin/session/updateCache",
        params: {
          key: this.chooseSessionId,
          json: JSON.stringify(this.jsonData),
          expire: Math.floor((this.chooseSession.ttl - Date.now()) / 1000)
        },
      }).then(() => {
        this.chooseSession.value = JSON.stringify(this.jsonData);
        this.$message.success('操作成功');
        this.isChange = true;
      });
    },
    delSession() {
      request({
        url: "/admin/session/updateCache",
        params: {
          key: this.chooseSessionId,
          json: '{}',
          expire: -1
        },
      }).then(() => {
        const index = this.sessionList.findIndex((item) => item.key === this.chooseSessionId);
        if (index !== -1) {
          this.sessionList.splice(index, 1);
        }
        this.chooseSession = {};
        this.chooseSessionId = '';
        this.jsonData = {};
        this.visible = false;
        this.$message.success('删除成功');
      });
    },
    onJsonChange(value) {
      this.isErr = false;
      this.isChange = this.chooseSession.value === JSON.stringify(value);
    },
    onError() {
      this.isErr = true;
    },
    reset() {
      this.sessionList = [];
      this.cursor = '';
      this.disabled = false;
      this.getSessionList();
    },
    showSession() {
      this.isChange = true;
      if (this.chooseSessionId === '') {
        this.chooseSession = {};
        this.jsonData = {};
      } else {
        this.chooseSession = this.sessionList.find(x => x.key === this.chooseSessionId) || {};
        this.jsonData = this.chooseSession.value ? JSON.parse(this.chooseSession.value) : {};
      }
    },
    getSessionList0() {
      this.cursor = '';
      this.sessionList = [];
      this.disabled = false;
      this.getSessionList();
    },
    getSessionList() {
      this.loading = true;
      request({
        url: "/admin/session/getCacheList",
        params: {
          prefix: this.prefix,
          cursor: this.cursor
        },
      }).then((res) => {
        (res.data || []).forEach((x) => {
          const exist = this.sessionList.find(y => y.key === x.key);
          if (!exist) this.sessionList.push(x);
        });
        if ((res.data || []).length > 0) {
          this.cursor = res.data[res.data.length - 1].key;
        } else {
          this.disabled = true;
        }
      }).finally(() => {
        this.loading = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.session-title {
  color: #166534;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  transition: color 0.2s ease, font-weight 0.2s ease;
}

.list-scroll {
  ::v-deep .el-collapse-item {
    border-radius: 8px;
    margin-bottom: 4px;
    overflow: hidden;
    border: none;

    &__header {
      height: auto;
      line-height: normal;
      padding: 10px 12px;
      background: transparent;
      font-size: 13px;
      border-radius: 8px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;

      &:hover {
        background: #f0fdf4;
      }

      &.is-active {
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        box-shadow: 0 2px 8px rgba(16, 185, 129, 0.15);
        
        .session-title {
          color: #047857;
          font-weight: 600;
        }
        
        &::after {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: linear-gradient(180deg, #10b981, #059669);
          border-radius: 0 3px 3px 0;
        }

        .el-collapse-item__arrow {
          color: #059669;
        }
      }

      &:not(.is-active):hover {
        .el-collapse-item__arrow {
          opacity: 0.6;
        }
      }
    }

    &__arrow {
      transition: all 0.25s ease;
      color: #9ca3af;
      font-size: 12px;
      margin-left: 4px;
    }

    &__wrap {
      border: none;
    }

    &__content {
      padding: 8px 16px 14px 20px;
      background: #fafbfc;
      font-size: 12px;
      color: #64748b;
    }
  }
}

.detail-card {
  min-height: 560px;
}

.detail-card__subtitle {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card__ttl {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
  padding: 8px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #e0f2fe;
}

.detail-card__ttl ::v-deep .el-statistic__content {
  font-size: 14px;
}

.json-wrapper {
  margin-top: 12px;
}

::v-deep .jsoneditor-poweredBy,

::v-deep .jsoneditor-modes {
  display: none !important;
}

::v-deep .jsoneditor-vue,
::v-deep .jsoneditor-outer {
  height: calc(100vh - 360px) !important;
}

::v-deep .jsoneditor .jsoneditor-menu {
  border-bottom: 1px solid #dbe4f0;
  background: #eaf2ff;
}

::v-deep .el-empty {
  padding: 24px 0;
}

::v-deep .el-statistic__content {
  font-size: 13px;
}

</style>
