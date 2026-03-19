<template>
  <div style="margin-top: 3px">
    <el-table v-loading="loading" :data="alertData.filter(data =>  (!search || data.func.toLowerCase().includes(search.toLowerCase())))" border
              size="mini" style="margin: 3px;" :header-cell-style="{'background-color': '#d3f9fa','color': '#000'}">
      <el-table-column label="ID" prop="id" width="90"></el-table-column>
      <el-table-column label="触发条件" prop="target" width="250"></el-table-column>
      <el-table-column label="开始" width="120">
        <template slot-scope="scope">
          <i class="el-icon-time"></i> <span>{{ scope.row.alertstart }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结束" width="120">
        <template slot-scope="scope">
          <i class="el-icon-time"></i> <span>{{ scope.row.alertend }}</span>
        </template>
      </el-table-column>
      <el-table-column label="告警对象">
        <template slot-scope="scope">
          <el-tag size="medium" style="margin: 3px" v-for="item in scope.row.userid.split(',')" :key="item" :type="item" effect="dark"> {{ item }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="120">
        <template slot-scope="scope">
          <el-tag :type="showType(scope.row)" effect="dark">{{ showStatus(scope.row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近上报" prop="err" width="100">
        <template slot-scope="scope">
          <span :style="{color:scope.row.err===0?'black':'red'}">{{ scope.row.err }}</span>
        </template>
      </el-table-column>
      <el-table-column label="告警信息" prop="msg" width="150">
        <template slot-scope="scope">
          <span class="httptext"  :style="{color:scope.row.err===0?'black':'red'}">{{ scope.row.msg }}</span>
          <el-link v-if="scope.row.msg!=null&&scope.row.msg.length>32" :underline="false"
                   style="position: absolute;right: 0;bottom: -6px;" @click="showRpcMsg(scope.row.msg)">
            <i class="el-icon-view"></i>
          </el-link>
        </template>
      </el-table-column>
      <el-table-column label="创建人" prop="createby" width="120"></el-table-column>
      <el-table-column label="创建时间" prop="createtime" width="160"></el-table-column>
      <el-table-column label="操作">
        <template slot="header" slot-scope="scope">
          <el-input v-model="search" placeholder="输入关键字搜索" size="mini" style="width: 220px"/>
          <el-button v-if="appInfo.role===1" type="warning" size="mini" style="margin-left: 11px" @click="alertAddTab">
            新增
          </el-button>
        </template>
        <template slot-scope="scope">
          <el-button style="margin-left: 11px" v-if="appInfo.role===1" type="text" @click="showAlertRule(scope.row)">
            <span style="color: green">编辑<i class="el-icon-edit el-icon--right"></i></span>
          </el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1" type="text" @click="alertRemove(scope.row)">
            <span style="color: red">删除<i class="el-icon-delete el-icon--right"></i></span>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :visible.sync="showAlertDialog" :title="alertAdd?'新增':'编辑'" width="60%">
      <div v-if="alertEdit" style="padding: 11px">ID：<span style="padding: 11px">{{ alertId }}</span></div>
      <div style="padding: 11px"> 触发条件：
        <el-input style="width: 600px" v-model="alertTarget" size="small"></el-input>
      </div>
      <div style="padding: 11px"> 生效时间：
        <el-time-picker is-range v-model="alertPeriod" range-separator="至" start-placeholder="开始" end-placeholder="结束" placeholder="选择时间范围"></el-time-picker>
      </div>
      <div style="padding: 11px"> 告警对象：
        <el-tag size="medium" :key="tag" v-for="tag in alertUserId" closable effect="dark" :disable-transitions="false" @close="handleClose(tag)">
          {{ tag }}
        </el-tag>
        <el-input class="input-new-tag" v-if="inputVisible" v-model="inputValue" ref="saveTagInput" size="small"
                  @keyup.enter.native="handleInputConfirm" @blur="handleInputConfirm"></el-input>
        <el-button v-else class="button-new-tag" size="small" @click="showInput">+ 添加</el-button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="alertAdd = false;alertEdit = false">取 消</el-button>
        <el-button type="primary" @click="alertAddOrEdit">保 存</el-button>
      </span>
    </el-dialog>
    <el-dialog :visible.sync="showMsg" title="查看详情" width="98%">
      <span style="line-height: 22px;white-space: pre-wrap;">{{ rpcMsg }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showMsg = false">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import {Message} from "element-ui";

export default {
  name: "Alert",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
      loading: false,
      alertData: [],
      search: '',
      alertAdd: false,
      alertEdit: false,
      alertId: '',
      alertTarget: '',
      alertPeriod: [new Date(2000, 0, 1, 8, 0), new Date(2000, 0, 1, 22, 0)],
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
        }
      }
    }
  },
  methods: {
    showRpcMsg(item) {
      this.showMsg = true;
      this.rpcMsg = item;
    },
    handleClose(tag) {
      this.alertUserId.splice(this.alertUserId.indexOf(tag), 1);
    },
    showInput() {
      this.inputVisible = true;
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus();
      });
    },
    handleInputConfirm() {
      let inputValue = this.inputValue;
      if (this.alertUserId.indexOf(inputValue) !== -1) {
        this.$message.success(inputValue + '已存在');
        this.inputVisible = false;
        this.inputValue = '';
        return;
      }
      if (inputValue) {
        if (inputValue) {
          request({
            url: "/admin/alert/addUserid",
            params: {
              userid: inputValue,
            }
          }).then(res => {
            if (res.code === 0) {
              this.alertUserId.push(inputValue);
            }
          });
        }
      }
      this.inputVisible = false;
      this.inputValue = '';
    },
    showStatus(row) {
      let now = new Date();
      now.setFullYear(2000, 0, 1);
      if (new Date('2000-01-01 ' + row.alertstart).getTime() < now.getTime() && new Date('2000-01-01 ' + row.alertend).getTime() > now.getTime()) {
        return '正常';
      }
      return '免打扰';
    },
    showType(row) {
      let now = new Date();
      now.setFullYear(2000, 0, 1);
      if (new Date('2000-01-01 ' + row.alertstart).getTime() < now.getTime() && new Date('2000-01-01 ' + row.alertend).getTime() > now.getTime()) {
        return 'success';
      }
      return 'info';
    },
    alertAddOrEdit() {
      if (this.alertTarget == null || this.alertTarget === '' || this.alertUserId.length === 0) {
        Message({message: "参数错误", type: "error", duration: 2 * 1000,});
        return;
      }
      this.loading = true;
      let params = {
        target: this.alertTarget,
        alertstart: this.alertPeriod[0].format("hh:mm:ss"),
        alertend: this.alertPeriod[1].format("hh:mm:ss"),
        userid: this.alertUserId.join(",")
      }
      if (this.alertEdit) params.id = this.alertId;
      let url = this.alertAdd ? "/admin/alert/addAlertConf" : "/admin/alert/updateAlertConf";
      request({
        url: url, params: params,
      }).then((res) => {
        this.loading = false;
        this.$message.success('操作成功');
        this.alertAdd = false;
        this.alertEdit = false;
        this.getAlertList();
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    alertAddTab() {
      this.alertId = '';
      this.alertTarget = '';
      this.alertUserId = [];
      this.alertPeriod = [new Date(2000, 0, 1, 8, 0), new Date(2000, 0, 1, 22, 0)];
      this.alertAdd = true;
    },
    showAlertRule(row) {
      this.alertId = row.id;
      this.alertTarget = row.target;
      this.alertUserId = row.userid.split(",");
      this.alertPeriod = [new Date('2000-01-01 ' + row.alertstart), new Date('2000-01-01 ' + row.alertend)];
      this.alertEdit = true;
    },
    getAlertList() {
      request({
        url: "/admin/alert/getAlertConf",
        params: {},
      }).then((res) => {
        this.alertData = res.data;
      });
    },
    alertRemove(target) {
      this.$confirm('删除告警规则', '确认执行此操作?', {
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
              url: "/admin/alert/delAlertConf",
              params: {
                id: target.id,
              },
            }).then((res) => {
              this.loading = false;
              instance.confirmButtonLoading = false;
              this.getAlertList();
              done();
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

.el-tag + .el-tag {
  margin-left: 10px;
}

.button-new-tag {
  margin-left: 10px;
  height: 32px;
  line-height: 30px;
  padding-top: 0;
  padding-bottom: 0;
}

.input-new-tag {
  width: 90px;
  margin-left: 10px;
  vertical-align: bottom;
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
</style>
