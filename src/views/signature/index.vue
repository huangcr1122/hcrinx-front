<template>
  <div style="margin-top: 3px">
    <el-table v-loading="loading" :data="signData.filter(data =>  (!search || data.func.toLowerCase().includes(search.toLowerCase())))" border
              size="mini" style="margin: 3px;" :header-cell-style="{'background-color': '#d3f9fa','color': '#000'}">
      <el-table-column label="ID" prop="id" width="90"></el-table-column>
      <el-table-column label="函数名" prop="func" width="280"></el-table-column>
      <el-table-column label="私钥" width="200">********************************</el-table-column>
      <el-table-column label="算法" :formatter="algorithmFormat" prop="algorithm" width="150">
        <template v-slot:header>
          <el-link :underline="false" @click="algorithmDescription">算法<i class="el-icon-info el-icon--right"></i></el-link>
        </template>
      </el-table-column>
      <el-table-column :formatter="peroidFormat" label="签名有效期" prop="valid" width="100"></el-table-column>
      <el-table-column label="创建人" prop="createby" width="120"></el-table-column>
      <el-table-column label="创建时间" prop="createtime" width="160"></el-table-column>
      <el-table-column label="说明" prop="description"></el-table-column>
      <el-table-column label="操作">
        <template slot="header" slot-scope="scope">
          <el-input v-model="search" placeholder="输入关键字搜索" size="mini" style="width: 220px"/>
          <el-button v-if="appInfo.role===1" type="warning" size="mini" style="margin-left: 11px" @click="signAddTab">
            新增
          </el-button>
        </template>
        <template slot-scope="scope">
          <el-button style="margin-left: 11px" type="text" @click="generateSign(scope.row)">
            <span style="color: green">生成一个<i class="el-icon-thumb el-icon--right"></i></span>
          </el-button>
          <el-popover placement="bottom" title="签名私钥" width="400" trigger="click" :content="scope.row.secretkey">
            <el-button slot="reference" style="margin-left: 11px" v-if="appInfo.role===1" type="text">
              <span style="color: green">查看私钥<i class="el-icon-view el-icon--right"></i></span>
            </el-button>
          </el-popover>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1" type="text" @click="showSignRule(scope.row)">
            <span style="color: green">编辑<i class="el-icon-edit el-icon--right"></i></span>
          </el-button>
          <el-button style="margin-left: 11px" v-if="appInfo.role===1" type="text" @click="signRemove(scope.row)">
            <span style="color: red">删除<i class="el-icon-delete el-icon--right"></i></span>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :visible.sync="showCronDialog" :title="signatureAdd?'新增令牌':'编辑令牌'" width="60%">
      <div v-if="signatureEdit" style="padding: 11px">令牌函数：<span style="padding: 11px">{{ signatureFunc }}</span></div>
      <div v-if="signatureAdd" style="padding: 11px">令牌函数：
        <el-select v-model="signatureChoose" placeholder="请选择" size="small" @change="signSelected">
          <el-option v-for="item in signatureChooseOption" :key="item" :label="item" :value="item"></el-option>
        </el-select>
      </div>
      <div style="padding: 11px"> 签名私钥：
        <el-input style="width: 600px" v-model="signSecretkey" size="small" placeholder="16进制字符串,长度32个字符"></el-input>
      </div>
      <div style="padding: 11px"> 签名算法：
        <el-input style="width: 600px" v-model="signAlgorithm" size="small" disabled></el-input>
      </div>
      <div style="padding: 11px"> 签名时效：
        <el-input style="width: 600px" v-model="signValid" size="small"></el-input>
      </div>
      <div style="padding: 11px"> 其他说明：
        <el-input style="width: 600px" v-model="signDescription" size="small"></el-input>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="signatureAdd = false;signatureEdit = false">取 消</el-button>
        <el-button type="primary" @click="signAddOrEdit">保 存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import {Message} from "element-ui";

export default {
  name: "Sign",
  data() {
    return {
      app: Cookies.get('app'),
      appInfo: JSON.parse(localStorage.getItem("app")),
      loading: false,
      signData: [],
      search: '',
      signatureAdd: false,
      signatureEdit: false,
      signatureFunc: '',
      signatureChoose: '',
      signatureChooseOption: [],
      signSecretkey: '',
      signAlgorithm: '',
      signValid: 5,
      signDescription: '',
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
    this.getSignList();
  },
  computed: {
    showCronDialog: {
      get() {
        return this.signatureAdd || this.signatureEdit;
      },
      set(newVal) {
        if (!newVal) {
          this.signatureAdd = false;
          this.signatureEdit = false;
        }
      }
    }
  },
  methods: {
    algorithmFormat(row, column, value, index) {
      return value === 1 ? 'MD5' : value === 2 ? 'SHA-256' : '未知';
    },
    algorithmDescription() {
      this.$alert('<strong>1、MD5签名：有效期内可被重复使用</br></strong>生成方式：sign = MD5(key+unixtimestamp)+unixtimestamp' +
          '</br><strong>2、SHA256签名:ts+nonce唯一</strong></br>生成方式：sign = SHA256(key+unixtimestamp+nonce)+unixtimestamp+nonce', '签名算法说明', {
        dangerouslyUseHTMLString: true, closeOnClickModal: true,
      }).catch(() => {
      });
    },
    signSelected() {
      if (this.signatureChoose !== '') {
        request({
          url: "/admin/sign/checkSign",
          params: {
            func: this.signatureChoose,
          },
        }).then((res) => {
          this.signAlgorithm = res.data;
        });
      }
    },
    generateSign(target) {
      this.loading = true;
      request({
        url: "/admin/sign/generateSign",
        params: {
          id: target.id,
        },
      }).then((res) => {
        this.loading = false;
        this.$alert(res.data, '签名有效期：' + target.valid + '秒', {
          confirmButtonText: '确定',
        });
      });
    },
    peroidFormat(row, column, value, index) {
      let p = value;
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
    signAddOrEdit() {
      if (this.signatureFunc == null || this.signSecretkey == null || this.signSecretkey.length !== 32 || this.signValid == null || this.signDescription > 180) {
        Message({message: "参数错误", type: "error", duration: 2 * 1000,});
        return;
      }
      if (this.signValid < 3 || this.signValid > 180) {
        Message({message: "签名时效再3秒~180秒之间", type: "error", duration: 2 * 1000,});
        return;
      }
      this.loading = true;
      let params = {
        secretkey: this.signSecretkey,
        valid: this.signValid,
        description: this.signDescription
      }
      if (this.signatureAdd) params.func = this.signatureChoose;
      else {
        params.id = this.signData.filter(x => x.func === this.signatureFunc)[0].id;
        params.func = this.signatureFunc;
      }
      let url = this.signatureAdd ? "/admin/sign/addSign" : "/admin/sign/updateSign";
      request({
        url: url, params: params,
      }).then((res) => {
        this.loading = false;
        this.$message.success('操作成功');
        this.signatureAdd = false;
        this.signatureEdit = false;
        this.getSignList();
      }).catch(() => {
        this.$message.info('已取消');
      });
    },
    signAddTab() {
      this.signatureFunc = '';
      this.signatureChoose = '';
      this.signSecretkey = '';
      this.signAlgorithm = '';
      this.signValid = 5;
      this.signDescription = '';
      request({
        url: "/admin/sign/signAddOption",
        params: {},
      }).then((res) => {
        this.signatureAdd = true;
        this.signatureChooseOption = res.data;
      });
    },
    showSignRule(row) {
      this.signatureFunc = row.func;
      this.signSecretkey = row.secretkey;
      this.signAlgorithm = row.algorithm === 1 ? 'MD5' : row.algorithm === 2 ? 'SHA-256' : '未知';
      this.signValid = row.valid;
      this.signDescription = row.description;
      this.signatureEdit = true;
    },
    getSignList() {
      request({
        url: "/admin/sign/getSignList",
        params: {},
      }).then((res) => {
        this.signData = res.data;
      });
    },
    signRemove(target) {
      this.$confirm('删除私钥', '确认执行此操作?', {
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
              url: "/admin/sign/delSign",
              params: {
                id: target.id,
                func: target.func,
              },
            }).then((res) => {
              this.loading = false;
              instance.confirmButtonLoading = false;
              this.getSignList();
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

</style>
