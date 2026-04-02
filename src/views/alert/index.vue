<template>
  <div class="page-shell alert-page">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">告警规则中心</div>
        <div class="page-header__desc">按应用维度维护告警规则、通知对象与免打扰时间，快速掌握规则状态与异常上报情况。</div>
      </div>
    </div>

    <div class="summary-grid">
      <div v-for="item in summaryCards" :key="item.key" class="summary-item">
        <div class="summary-item__label">{{ item.label }}</div>
        <div class="summary-item__value">{{ item.value }}</div>
      </div>
    </div>

    <el-card shadow="never" class="alert-card panel-card">
      <div class="page-toolbar toolbar">
        <div class="page-toolbar__group page-toolbar__grow">
          <el-input v-model="search" clearable size="small" class="toolbar__search" placeholder="搜索 ID / 触发条件 / 告警对象 / 创建人 / 告警信息">
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
          <el-radio-group v-model="statusFilter" size="small" class="toolbar__filter">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="active">正常</el-radio-button>
            <el-radio-button label="muted">免打扰</el-radio-button>
          </el-radio-group>
        </div>
        <div class="page-toolbar__group">
          <el-button size="small" icon="el-icon-refresh-right" @click="getAlertList">刷新</el-button>
          <el-button v-if="appInfo.role===1" type="primary" size="small" icon="el-icon-plus" @click="alertAddTab">新增规则</el-button>
        </div>
      </div>

      <div class="page-toolbar toolbar toolbar--meta">

        <span class="result-text">共 {{ alertData.length }} 条规则，当前显示 {{ filteredAlertData.length }} 条</span>
        <el-button v-if="search || statusFilter !== 'all'" type="text" @click="resetFilters">清空筛选</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="filteredAlertData"
        border
        stripe
        size="mini"
        row-key="id"
        empty-text="暂无告警规则"
        class="alert-table"
        :header-cell-style="{ background: '#f8fafc', color: '#334155' }"
      >
        <el-table-column label="ID" prop="id" width="80"></el-table-column>

        <el-table-column label="触发条件" min-width="240">
          <template slot-scope="scope">
            <div class="target-cell">{{ scope.row.target || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="生效时间" width="200">
          <template slot-scope="scope">
            <div class="period-cell">
              <span><i class="el-icon-time"></i> {{ scope.row.alertstart }}</span>
              <span class="period-separator">至</span>
              <span>{{ scope.row.alertend }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="告警对象" min-width="220">
          <template slot-scope="scope">
            <div class="tag-list">
              <el-tag v-for="item in getUserIds(scope.row)" :key="item" size="mini" effect="plain">{{ item }}</el-tag>

              <span v-if="getUserIds(scope.row).length === 0" class="placeholder-text">未配置</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="110">
          <template slot-scope="scope">
            <el-tag :type="showType(scope.row)" effect="dark">{{ showStatus(scope.row) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最近上报" width="110">
          <template slot-scope="scope">
            <span :class="['err-count', scope.row.err > 0 ? 'err-count--danger' : 'err-count--normal']">{{ scope.row.err || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="告警信息" min-width="260">
          <template slot-scope="scope">
            <div class="msg-cell">
              <span class="msg-preview" :class="scope.row.err > 0 ? 'msg-preview--danger' : ''">{{ messagePreview(scope.row.msg) }}</span>
              <el-link v-if="scope.row.msg" :underline="false" type="primary" @click="showRpcMsg(scope.row.msg)">
                查看
              </el-link>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建人" prop="createby" width="110"></el-table-column>
        <el-table-column label="创建时间" prop="createtime" width="160"></el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <div class="table-actions">
              <el-button v-if="appInfo.role===1" type="text" @click="showAlertRule(scope.row)">编辑</el-button>
              <el-button v-if="appInfo.role===1" type="text" class="danger-btn" @click="alertRemove(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>
    </el-card>

    <el-dialog
      :visible.sync="showAlertDialog"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
      destroy-on-close
      custom-class="compact-dialog"
    >
      <el-form label-width="96px" class="rule-form dialog-form--compact">

        <el-form-item v-if="alertEdit" label="规则 ID">
          <span class="rule-id">{{ alertId }}</span>
        </el-form-item>

        <el-form-item label="触发条件">
          <el-input v-model.trim="alertTarget" placeholder="例如：app/module 或 app/module/func"></el-input>
        </el-form-item>

        <el-form-item label="生效时间">
          <el-time-picker
            is-range
            v-model="alertPeriod"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            placeholder="选择时间范围"
            format="HH:mm:ss"
          ></el-time-picker>
        </el-form-item>

        <el-form-item label="告警对象">
          <div class="tag-editor">
            <el-tag
              v-for="tag in alertUserId"
              :key="tag"
              size="small"
              closable
              effect="dark"

              :disable-transitions="false"
              @close="handleClose(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="inputVisible"
              ref="saveTagInput"
              v-model.trim="inputValue"
              class="input-new-tag"
              size="small"
              placeholder="输入用户ID"
              @keyup.enter.native="handleInputConfirm"
              @blur="handleInputConfirm"
            ></el-input>
            <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 添加对象</el-button>
          </div>
          <div class="rule-tip">输入用户 ID 后按回车或失焦即可添加，系统会自动校验用户是否存在。</div>
        </el-form-item>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="alertAddOrEdit">保存</el-button>
      </span>
    </el-dialog>

    <el-dialog :visible.sync="showMsg" title="告警详情" width="70%" custom-class="compact-dialog">

      <div class="msg-dialog__toolbar">
        <el-button size="mini" icon="el-icon-document-copy" @click="copyRpcMsg">复制内容</el-button>
      </div>
      <div class="msg-dialog__content mono-text">{{ rpcMsg || '-' }}</div>

      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showMsg = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import {Message} from "element-ui";

const createDefaultAlertPeriod = () => [
  new Date(2000, 0, 1, 8, 0, 0),
  new Date(2000, 0, 1, 22, 0, 0),
];

export default {
  name: "Alert",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app") || "{}"),
      loading: false,
      submitLoading: false,
      alertData: [],
      search: '',
      statusFilter: 'all',
      alertAdd: false,
      alertEdit: false,
      alertId: '',
      alertTarget: '',
      alertPeriod: createDefaultAlertPeriod(),
      alertUserId: [],
      inputVisible: false,
      inputValue: '',
      showMsg: false,
      rpcMsg: '',
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
      return;
    }
    this.getAlertList();
  },
  computed: {
    showAlertDialog: {
      get() {
        return this.alertAdd || this.alertEdit;
      },
      set(newVal) {
        if (!newVal) {
          this.alertAdd = false;
          this.alertEdit = false;
          this.inputVisible = false;
          this.inputValue = '';
        }
      }
    },
    dialogTitle() {
      return this.alertAdd ? '新增告警规则' : '编辑告警规则';
    },
    filteredAlertData() {
      const keyword = this.search.trim().toLowerCase();
      return this.alertData.filter((row) => {
        const source = [row.id, row.target, row.userid, row.msg, row.createby].join(' ').toLowerCase();
        const matchesSearch = !keyword || source.indexOf(keyword) !== -1;
        const active = this.isInAlertPeriod(row);
        const matchesStatus = this.statusFilter === 'all'
          || (this.statusFilter === 'active' && active)
          || (this.statusFilter === 'muted' && !active);
        return matchesSearch && matchesStatus;
      });
    },
    summaryCards() {
      return [
        {key: 'total', label: '规则总数', value: this.alertData.length},
        {key: 'active', label: '当前正常', value: this.alertData.filter((item) => this.isInAlertPeriod(item)).length},
        {key: 'muted', label: '免打扰', value: this.alertData.filter((item) => !this.isInAlertPeriod(item)).length},
        {key: 'error', label: '异常上报', value: this.alertData.filter((item) => Number(item.err) > 0).length},
      ];
    },
  },
  methods: {
    resetFilters() {
      this.search = '';
      this.statusFilter = 'all';
    },
    getUserIds(row) {
      if (!row || !row.userid) {
        return [];
      }
      return row.userid.split(',').filter(Boolean);
    },
    messagePreview(msg) {
      if (!msg) {
        return '-';
      }
      return msg.length > 48 ? msg.slice(0, 48) + '...' : msg;
    },
    getAlertTimeValue(time) {
      if (!time) {
        return null;
      }
      return new Date('2000-01-01 ' + time).getTime();
    },
    isInAlertPeriod(row) {
      const start = this.getAlertTimeValue(row.alertstart);
      const end = this.getAlertTimeValue(row.alertend);
      if (start == null || end == null) {
        return false;
      }
      const now = new Date();
      now.setFullYear(2000, 0, 1);
      const current = now.getTime();
      if (start === end) {
        return true;
      }
      if (start < end) {
        return current >= start && current <= end;
      }
      return current >= start || current <= end;
    },
    showStatus(row) {
      return this.isInAlertPeriod(row) ? '正常' : '免打扰';
    },
    showType(row) {
      return this.isInAlertPeriod(row) ? 'success' : 'info';
    },
    showRpcMsg(item) {
      this.rpcMsg = item || '';
      this.showMsg = true;
    },
    fallbackCopyText(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('复制成功');
      } catch (e) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },
    copyRpcMsg() {
      if (!this.rpcMsg) {
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(this.rpcMsg).then(() => {
          this.$message.success('复制成功');
        }).catch(() => {
          this.fallbackCopyText(this.rpcMsg);
        });
        return;
      }
      this.fallbackCopyText(this.rpcMsg);
    },
    handleClose(tag) {
      this.alertUserId.splice(this.alertUserId.indexOf(tag), 1);
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick(() => {
        if (this.$refs.saveTagInput && this.$refs.saveTagInput.$refs.input) {
          this.$refs.saveTagInput.$refs.input.focus();
        }
      });
    },
    handleInputConfirm() {
      const inputValue = (this.inputValue || '').trim();
      if (!inputValue) {
        this.inputVisible = false;
        this.inputValue = '';
        return;
      }
      if (this.alertUserId.indexOf(inputValue) !== -1) {
        this.$message.warning(inputValue + ' 已存在');
        this.inputVisible = false;
        this.inputValue = '';
        return;
      }
      request({
        url: "/admin/alert/addUserid",
        params: {
          userid: inputValue,
        }
      }).then((res) => {
        if (res.code === 0) {
          this.alertUserId.push(inputValue);
        }
      }).finally(() => {
        this.inputVisible = false;
        this.inputValue = '';
      });
    },
    closeDialog() {
      this.alertAdd = false;
      this.alertEdit = false;
      this.inputVisible = false;
      this.inputValue = '';
    },
    resetDialog() {
      this.alertId = '';
      this.alertTarget = '';
      this.alertUserId = [];
      this.alertPeriod = createDefaultAlertPeriod();
      this.inputVisible = false;
      this.inputValue = '';
    },
    alertAddOrEdit() {
      if (!this.alertTarget || this.alertUserId.length === 0 || !this.alertPeriod || !this.alertPeriod[0] || !this.alertPeriod[1]) {
        Message({message: "请完整填写规则信息", type: "error", duration: 2 * 1000});
        return;
      }
      this.submitLoading = true;
      const params = {
        target: this.alertTarget,
        alertstart: this.alertPeriod[0].format("hh:mm:ss"),
        alertend: this.alertPeriod[1].format("hh:mm:ss"),
        userid: this.alertUserId.join(",")
      };
      if (this.alertEdit) {
        params.id = this.alertId;
      }
      const url = this.alertAdd ? "/admin/alert/addAlertConf" : "/admin/alert/updateAlertConf";
      request({
        url: url,
        params: params,
      }).then(() => {
        this.$message.success('保存成功');
        this.closeDialog();
        this.getAlertList();
      }).catch(() => {
      }).finally(() => {
        this.submitLoading = false;
      });
    },
    alertAddTab() {
      this.resetDialog();
      this.alertAdd = true;
    },
    showAlertRule(row) {
      this.resetDialog();
      this.alertId = row.id;
      this.alertTarget = row.target;
      this.alertUserId = this.getUserIds(row);
      this.alertPeriod = [new Date('2000-01-01 ' + row.alertstart), new Date('2000-01-01 ' + row.alertend)];
      this.alertEdit = true;
    },
    getAlertList() {
      this.loading = true;
      request({
        url: "/admin/alert/getAlertConf",
        params: {},
      }).then((res) => {
        this.alertData = res.data || [];
      }).catch(() => {
        this.alertData = [];
      }).finally(() => {
        this.loading = false;
      });
    },
    alertRemove(target) {
      this.$confirm('删除后不可恢复，是否继续？', '删除告警规则', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        type: 'warning',
      }).then(() => {
        this.loading = true;
        return request({
          url: "/admin/alert/delAlertConf",
          params: {
            id: target.id,
          },
        });
      }).then(() => {
        this.$message.success('删除成功');
        this.getAlertList();
      }).catch((action) => {
        if (action === 'cancel' || action === 'close') {
          this.$message.info('已取消');
        }
      }).finally(() => {
        this.loading = false;
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.alert-page {
  padding: 0;
}




.alert-card {
  border: none;
  border-radius: 20px;
}

.toolbar {
  margin-bottom: 14px;
}


.toolbar--meta {
  margin-top: -4px;
}

.toolbar__search {
  width: 420px;
  max-width: 100%;
}

.result-text,
.placeholder-text,
.rule-tip {
  color: #64748b;
  font-size: 13px;
}

.alert-table {
  border-radius: 14px;
  overflow: hidden;
}

.target-cell {
  font-weight: 600;
  color: #1e293b;
  word-break: break-word;
}

.period-cell,
.msg-cell,
.tag-list,
.tag-editor {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.period-cell {
  color: #475569;
}

.period-separator {
  color: #94a3b8;
}

.err-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;
}

.err-count--normal {
  color: #0f766e;
  background: rgba(16, 185, 129, 0.12);
}

.err-count--danger {
  color: #dc2626;
  background: rgba(239, 68, 68, 0.12);
}

.msg-preview {
  max-width: 200px;
  color: #475569;
  word-break: break-word;
}

.msg-preview--danger {
  color: #dc2626;
}

.danger-btn {
  color: #ef4444;
}

.rule-form {
  padding-right: 0;
}


.rule-id {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.08);
  color: #1d4ed8;
  font-weight: 700;
}

.button-new-tag {
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.input-new-tag {
  width: 140px;
}

.msg-dialog__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.msg-dialog__content {
  max-height: 50vh;
  overflow: auto;
  padding: 16px;
  border-radius: 14px;
  background: #f8fafc;
  line-height: 1.8;
  white-space: pre-wrap;
  color: #334155;
}

::v-deep .el-card__body {
  padding: 18px 18px 14px;
}

::v-deep .el-table td,
::v-deep .el-table th {
  padding: 8px 0;
}

::v-deep .el-dialog {
  border-radius: 18px;
  overflow: hidden;
}

::v-deep .el-dialog__header {
  padding: 18px 20px 10px;
}

::v-deep .el-dialog__body {
  padding: 12px 20px 16px;
}

::v-deep .el-dialog__footer {
  padding: 0 20px 20px;
}

</style>
