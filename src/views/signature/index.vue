<template>
  <div class="signature-page page-shell">
    <el-card shadow="never" class="panel-card signature-page__card">
      <div class="page-toolbar">
        <div class="page-toolbar__group page-toolbar__grow">
          <el-input v-model="search" clearable size="small" class="signature-page__search" placeholder="搜索函数名 / 创建人 / 说明">
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
        </div>
        <div class="page-toolbar__group">
          <el-button size="small" icon="el-icon-info" @click="algorithmDescription">算法说明</el-button>
          <el-button size="small" icon="el-icon-refresh-right" @click="getSignList">刷新</el-button>
          <el-button v-if="appInfo.role===1" type="primary" size="small" icon="el-icon-plus" @click="signAddTab">新增令牌</el-button>
        </div>
      </div>


      <div class="page-toolbar signature-page__meta-bar">
        <span class="section-caption signature-page__meta-text">共 {{ signData.length }} 条令牌，当前展示 {{ filteredSignData.length }} 条</span>
        <el-button v-if="search || algorithmFilter !== 'all'" type="text" @click="resetFilters">清空筛选</el-button>
      </div>

      <el-table v-loading="loading" :data="filteredSignData" border stripe size="mini" row-key="id">
        <el-table-column label="ID" prop="id" width="80"></el-table-column>
        <el-table-column label="函数名" prop="func" min-width="280" show-overflow-tooltip></el-table-column>

        <el-table-column label="私钥" width="180">
          <template>
            <span>********************************</span>
          </template>
        </el-table-column>
        <el-table-column label="算法" width="120">
          <template slot-scope="scope">
            <el-tag :type="scope.row.algorithm === 2 ? 'success' : 'warning'">{{ algorithmFormat(scope.row, null, scope.row.algorithm) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签名有效期" width="160">
          <template slot-scope="scope">{{ peroidFormat(scope.row, null, scope.row.valid) }}</template>
        </el-table-column>
        <el-table-column label="创建人" prop="createby" width="120"></el-table-column>
        <el-table-column label="创建时间" prop="createtime" width="160"></el-table-column>
        <el-table-column label="说明" prop="description" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template slot-scope="scope">
            <div class="table-actions signature-page__table-actions">
              <el-button type="text" @click="generateSign(scope.row)">生成签名</el-button>
              <el-popover placement="bottom" title="签名私钥" width="420" trigger="click" :content="scope.row.secretkey">
                <el-button slot="reference" type="text" v-if="appInfo.role===1">查看私钥</el-button>
              </el-popover>
              <el-button v-if="appInfo.role===1" type="text" @click="showSignRule(scope.row)">编辑</el-button>
              <el-button v-if="appInfo.role===1" type="text" class="danger-btn" @click="signRemove(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>

      </el-table>
    </el-card>

    <el-dialog :visible.sync="showSignDialog" :title="signatureAdd ? '新增令牌' : '编辑令牌'" width="720px" :close-on-click-modal="false" destroy-on-close custom-class="compact-dialog">
      <el-form label-width="100px" class="dialog-form--compact">

        <el-form-item v-if="signatureEdit" label="令牌函数">
          <span class="rule-id">{{ signatureFunc }}</span>
        </el-form-item>
        <el-form-item v-if="signatureAdd" label="令牌函数">
          <el-select v-model="signatureChoose" placeholder="请选择" size="small" style="width: 100%" @change="signSelected">
            <el-option v-for="item in signatureChooseOption" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="签名私钥">
          <el-input v-model.trim="signSecretkey" placeholder="16 进制字符串，长度 32 字符"></el-input>
        </el-form-item>
        <el-form-item label="签名算法">
          <el-input v-model="signAlgorithm" disabled></el-input>
        </el-form-item>
        <el-form-item label="签名时效">
          <el-input v-model="signValid" size="small"></el-input>
        </el-form-item>
        <el-form-item label="其他说明">
          <el-input v-model="signDescription" maxlength="180" show-word-limit></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="signAddOrEdit">保存</el-button>
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
      appInfo: JSON.parse(localStorage.getItem("app") || '{}'),
      loading: false,
      submitLoading: false,
      signData: [],
      search: '',
      algorithmFilter: 'all',
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
  computed: {
    showSignDialog: {
      get() {
        return this.signatureAdd || this.signatureEdit;
      },
      set(newVal) {
        if (!newVal) {
          this.signatureAdd = false;
          this.signatureEdit = false;
        }
      }
    },
    filteredSignData() {
      const keyword = this.search.trim().toLowerCase();
      return this.signData.filter((row) => {
        const source = [row.func, row.createby, row.description].join(' ').toLowerCase();
        const matchesKeyword = !keyword || source.indexOf(keyword) !== -1;
        const matchesAlgorithm = this.algorithmFilter === 'all' || String(row.algorithm) === this.algorithmFilter;
        return matchesKeyword && matchesAlgorithm;
      });
    },
    summaryCards() {
      return [
        {key: 'total', label: '令牌总数', value: this.signData.length},
        {key: 'md5', label: 'MD5', value: this.signData.filter((item) => item.algorithm === 1).length},
        {key: 'sha', label: 'SHA-256', value: this.signData.filter((item) => item.algorithm === 2).length},
        {key: 'active', label: '当前展示', value: this.filteredSignData.length},
      ];
    },
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
      return;
    }
    this.getSignList();
  },
  methods: {
    resetFilters() {
      this.search = '';
      this.algorithmFilter = 'all';
    },
    closeDialog() {

      this.signatureAdd = false;
      this.signatureEdit = false;
    },
    resetDialog() {
      this.signatureFunc = '';
      this.signatureChoose = '';
      this.signSecretkey = '';
      this.signAlgorithm = '';
      this.signValid = 5;
      this.signDescription = '';
    },
    algorithmFormat(row, column, value) {
      return value === 1 ? 'MD5' : value === 2 ? 'SHA-256' : '未知';
    },
    algorithmDescription() {
      this.$alert('<strong>1、MD5签名：有效期内可被重复使用</br></strong>生成方式：sign = MD5(key+unixtimestamp)+unixtimestamp' + '</br><strong>2、SHA256签名:ts+nonce唯一</strong></br>生成方式：sign = SHA256(key+unixtimestamp+nonce)+unixtimestamp+nonce', '签名算法说明', {
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
        this.$alert(res.data, '签名有效期：' + target.valid + '秒', {
          confirmButtonText: '确定',
        });
      }).finally(() => {
        this.loading = false;
      });
    },
    peroidFormat(row, column, value) {
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
      const description = this.signDescription || '';
      if (this.signSecretkey == null || this.signSecretkey.length !== 32 || this.signValid == null || description.length > 180) {
        Message({message: "参数错误", type: "error", duration: 2 * 1000});
        return;
      }
      if (this.signValid < 3 || this.signValid > 180) {
        Message({message: "签名时效在 3 秒~180 秒之间", type: "error", duration: 2 * 1000});
        return;
      }
      this.submitLoading = true;
      let params = {
        secretkey: this.signSecretkey,
        valid: this.signValid,
        description: description
      };
      if (this.signatureAdd) {
        params.func = this.signatureChoose;
      } else {
        params.id = this.signData.filter(x => x.func === this.signatureFunc)[0].id;
        params.func = this.signatureFunc;
      }
      let url = this.signatureAdd ? "/admin/sign/addSign" : "/admin/sign/updateSign";
      request({
        url: url, params: params,
      }).then(() => {
        this.$message.success('操作成功');
        this.closeDialog();
        this.getSignList();
      }).finally(() => {
        this.submitLoading = false;
      });
    },
    signAddTab() {
      this.resetDialog();
      request({
        url: "/admin/sign/signAddOption",
        params: {},
      }).then((res) => {
        this.signatureAdd = true;
        this.signatureChooseOption = res.data || [];
      });
    },
    showSignRule(row) {
      this.resetDialog();
      this.signatureFunc = row.func;
      this.signSecretkey = row.secretkey;
      this.signAlgorithm = row.algorithm === 1 ? 'MD5' : row.algorithm === 2 ? 'SHA-256' : '未知';
      this.signValid = row.valid;
      this.signDescription = row.description;
      this.signatureEdit = true;
    },
    getSignList() {
      this.loading = true;
      request({
        url: "/admin/sign/getSignList",
        params: {},
      }).then((res) => {
        this.signData = res.data || [];
      }).finally(() => {
        this.loading = false;
      });
    },
    signRemove(target) {
      this.$confirm('删除后不可恢复，是否继续？', '删除令牌', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        type: 'warning',
      }).then(() => {
        this.loading = true;
        return request({
          url: "/admin/sign/delSign",
          params: {
            id: target.id,
            func: target.func,
          },
        });
      }).then(() => {
        this.$message.success('删除成功');
        this.getSignList();
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
.signature-page__search {
  width: 360px;
  max-width: 100%;
}

.signature-page__meta-bar {
  margin: 8px 0 14px;
}

.signature-page__meta-text {
  margin-bottom: 0;
}

.signature-page__table-actions {
  max-width: 220px;
}

::v-deep .signature-page__table-actions .el-popover__reference-wrapper {
  display: inline-flex;
}

.rule-id {

  display: inline-flex;
  align-items: center;
  padding: 4px 12px