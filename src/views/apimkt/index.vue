<template>
  <div class="page-shell api-market">
    <div class="split-panel api-market__layout">

      <el-card class="panel-card api-market__tree-panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">接口目录</div>
            <div class="panel-subtitle">支持关键字过滤、批量勾选和导出。</div>
          </div>
        </div>
        <div class="page-toolbar api-market__tree-toolbar">
          <div class="page-toolbar__group page-toolbar__grow">
            <el-input v-model="filterText" clearable placeholder="输入接口名称或函数标识进行过滤" size="small" />
          </div>
          <div class="page-toolbar__group">
            <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
            <el-tag type="info">已选 {{ selectedCount }}</el-tag>
            <el-button size="small" type="primary" icon="el-icon-download" :loading="exporting" :disabled="selectedCount === 0" @click="exportMultipleToHTML">导出已选</el-button>
          </div>

        </div>
        <div class="tree-shell api-market__tree-shell">
          <el-tree
            ref="tree"
            :data="data"
            :filter-node-method="filterNode"
            :props="defaultProps"
            class="filter-tree"
            highlight-current
            node-key="func"
            show-checkbox
            @check-change="handleCheckChange"
            @node-click="apiClick"
          >
            <template #default="{ data: nodeData }">
              <div class="api-market__tree-node">
                <el-link v-if="nodeData.sign === 1 || nodeData.sign === 2" :underline="false" icon="el-icon-key">{{ nodeData.name }}</el-link>
                <el-link v-else-if="nodeData.sign === 0" :underline="false" icon="el-icon-document">{{ nodeData.name }}</el-link>
                <el-link v-else :underline="false">{{ nodeData.name }}</el-link>
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>

      <el-card class="panel-card api-market__doc-panel" v-loading="loading">
        <div class="api-market__doc-scroll">
          <template v-if="funcdoc.name">
            <div class="panel-header">
              <div class="panel-header__main">
                <div class="panel-title">{{ funcdoc.name }}</div>
                <div class="panel-subtitle">{{ funcdoc.description || '暂无接口说明。' }}</div>
              </div>
<!--              <div class="panel-header__actions">-->
<!--                <el-button size="small" type="primary" icon="el-icon-position" @click="testDialogVisible = true">在线测试</el-button>-->
<!--              </div>-->
            </div>


            <div class="info-grid api-market__info-grid">
              <div class="info-item">
                <div class="info-item__label">应用标识</div>
                <div class="info-item__value mono-text">{{ funcdoc.app }}</div>
              </div>
              <div class="info-item">
                <div class="info-item__label">函数标识</div>
                <div class="info-item__value mono-text">{{ funcdoc.func }}</div>
              </div>
              <div class="info-item">
                <div class="info-item__label">模块标识</div>
                <div class="info-item__value">{{ funcdoc.service }}</div>
              </div>
              <div class="info-item">
                <div class="info-item__label">模块名称</div>
                <div class="info-item__value">{{ funcdoc.serviceName }}</div>
              </div>
            </div>

            <div class="section-block">
              <div class="panel-title api-market__section-title">请求地址</div>
              <div class="api-market__url-card">
                <div><span class="muted-text">Local：</span><el-link :href="apiUrl()" :underline="false" type="primary">{{ apiUrl() }}</el-link></div>
              </div>
            </div>

            <div v-if="funcdoc.sign === 1 || funcdoc.sign === 2" class="section-block">
              <div class="panel-title api-market__section-title">签名方式</div>
              <div class="api-market__sign-card mono-text">
                <span v-if="funcdoc.sign === 1">sign = MD5($TOKEN$ + unixtimestamp) + unixtimestamp</span>
                <span v-else>sign = SHA256($TOKEN$ + unixtimestamp + nonce) + unixtimestamp + nonce</span>
              </div>
            </div>

            <div class="section-block">
              <div class="panel-title api-market__section-title">请求参数</div>
              <el-table
                :data="requestParams"
                :tree-props="{ children: 'children' }"
                border
                class="api-market__table"
                row-key="id"
                size="mini"
                stripe
              >
                <el-table-column :formatter="nameFormatter" label="字段" prop="name" min-width="180" show-overflow-tooltip />
                <el-table-column :formatter="useFormatter" label="传参方式" min-width="138" show-overflow-tooltip />
                <el-table-column :formatter="typeFormatter" label="类型" prop="type" width="128" show-overflow-tooltip />
                <el-table-column label="示例" prop="example" min-width="160" show-overflow-tooltip />
                <el-table-column label="描述" prop="desc" min-width="180" show-overflow-tooltip />
              </el-table>
            </div>

            <div class="section-block">
              <div class="panel-title api-market__section-title">返回参数</div>
              <el-table
                :data="responseParams"
                :tree-props="{ children: 'children' }"
                border
                class="api-market__table"
                default-expand-all
                row-key="id"
                size="mini"
                stripe
              >
                <el-table-column label="字段" prop="name" min-width="180" show-overflow-tooltip />
                <el-table-column :formatter="typeFormatter" label="类型" prop="type" width="128" show-overflow-tooltip />
                <el-table-column label="示例" prop="example" min-width="160" show-overflow-tooltip />
                <el-table-column label="描述" prop="desc" min-width="180" show-overflow-tooltip />
              </el-table>
            </div>


          </template>
          <el-empty v-else description="请选择左侧接口查看文档详情" />
        </div>
      </el-card>

    </div>

    <el-dialog :visible.sync="testDialogVisible" title="在线测试" width="920px" append-to-body custom-class="api-test-dialog">
      <div v-if="funcdoc.name" class="api-test-panel api-test-dialog__body">
        <div class="api-test-panel__config">
          <div class="api-test-panel__row">
            <span class="api-test-panel__label">请求地址：</span>
            <el-input v-model="testUrl" readonly size="small" class="api-test-panel__url-input">
              <template slot="prepend">
                <el-tag size="small" type="success">POST</el-tag>
              </template>
            </el-input>
          </div>

          <div v-if="funcdoc.sign === 1 || funcdoc.sign === 2" class="api-test-panel__row">
            <span class="api-test-panel__label">签名Token：</span>
            <el-input v-model="testToken" placeholder="请输入签名Token" size="small" show-password></el-input>
          </div>

          <div class="api-test-panel__row api-test-panel__row--textarea">
            <span class="api-test-panel__label">请求参数：</span>
            <div class="api-test-panel__editor">
              <el-input
                v-model="testRequestBody"
                type="textarea"
                :rows="8"
                placeholder="请输入JSON格式的请求参数"
                size="small"
                class="api-test-panel__textarea"
              />
              <div class="api-test-panel__helper-actions">
                <el-button size="small" icon="el-icon-magic-stick" @click="generateExampleParams">生成示例</el-button>
              </div>
            </div>
          </div>

          <div class="api-test-panel__actions">
            <el-button type="primary" icon="el-icon-position" :loading="testLoading" @click="sendTestRequest">发送请求</el-button>
            <el-button icon="el-icon-refresh" @click="clearTestPanel">清空</el-button>
          </div>
        </div>

        <div v-if="testResponse" class="api-test-panel__response">
          <div class="api-test-panel__response-header">
            <span class="api-test-panel__label">响应结果：</span>
            <el-tag :type="testResponseStatus === 200 ? 'success' : 'danger'" size="small">
              {{ testResponseStatus }}
            </el-tag>
            <span class="api-test-panel__time">耗时：{{ testResponseTime }}ms</span>
          </div>
          <pre class="api-test-panel__response-body">{{ testResponse }}</pre>
        </div>
      </div>
      <el-empty v-else description="请先选择接口后再进行在线测试" />
    </el-dialog>
  </div>
</template>


<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import { saveAs } from 'file-saver';

export default {
  name: "APIMKT",
  data() {
    return {
      app: Cookies.get('app'),
      filterText: "",
      selectAll: false,
      selectedApis: [],
      favorites: JSON.parse(localStorage.getItem('api_favorites_' + Cookies.get('app')) || '[]'),
      history: JSON.parse(localStorage.getItem('api_history_' + Cookies.get('app')) || '[]'),
      favoritesVisible: false,
      historyVisible: false,
      defaultProps: {
        children: "funcList",
        label: "name"
      },
      data: [],
      funcdoc: {},
      loading: false,
      requestParams: [],
      responseParams: [],
      testDialogVisible: false,
      testUrl: '',

      testToken: '',
      testRequestBody: '',
      testResponse: '',
      testResponseStatus: 0,
      testResponseTime: 0,
      testLoading: false,
      exporting: false,
      typeReferrer: {
        byte: "int8",
        "java.lang.Byte": "int8",
        char: "char1",
        "java.lang.Character": "char1",
        short: "int16",
        "java.lang.Short": "int16",
        int: "int32",
        "java.lang.Integer": "int32",
        long: "int64",
        "java.lang.Long": "int64",
        boolean: "bool",
        "java.lang.Boolean": "bool",
        float: "float32",
        "java.lang.Float": "float32",
        double: "float64",
        "java.lang.Double": "float64",
        String: "string",
        "java.lang.String": "string"
      }
    };
  },
  computed: {
    selectedCount() {
      return this.selectedApis.length;
    },
    leafCount() {
      return this.getAllLeafNodes(this.data).length;
    },
    totalApiCount() {
      return this.leafCount;
    },
    openApiCount() {
      const leafNodes = this.getAllLeafNodes(this.data);
      return leafNodes.filter(node => node.sign === 0).length;
    },
    signApiCount() {
      const leafNodes = this.getAllLeafNodes(this.data);
      return leafNodes.filter(node => node.sign === 1 || node.sign === 2).length;
    },
    isFavorite() {
      return this.funcdoc.func && this.favorites.some(fav => fav.func === this.funcdoc.func);
    },
    currentPermissionLabel() {
      if (this.funcdoc.sign === 1) return 'MD5签名';
      if (this.funcdoc.sign === 2) return 'SHA256签名';
      if (this.funcdoc.sign === 0) return '开放接口';
      return '等待选择';
    },
    currentPermissionType() {
      if (this.funcdoc.sign === 1 || this.funcdoc.sign === 2) return 'warning';
      if (this.funcdoc.sign === 0) return 'success';
      return 'info';
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({ path: '/' });
      return;
    }
    this.getApiList();
    window.addEventListener('select-api', this.handleSelectApi);
  },
  beforeDestroy() {
    window.removeEventListener('select-api', this.handleSelectApi);
  },
  watch: {
    filterText(val) {
      if (this.$refs.tree) {
        this.$refs.tree.filter(val);
      }
    }
  },
  methods: {
    showFavorites() {
      if (this.favorites.length === 0) {
        this.$message.info('暂无收藏的接口');
        return;
      }
      this.$alert(
        `<div style="max-height: 400px; overflow-y: auto;">
          ${this.favorites.map(fav => `
            <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;"
                 onclick="window.dispatchEvent(new CustomEvent('select-api', { detail: '${fav.func}' }));">
              <div style="font-weight: bold;">${fav.name}</div>
              <div style="font-size: 12px; color: #666;">${fav.func}</div>
            </div>
          `).join('')}
        </div>`,
        '我的收藏',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '关闭'
        }
      );
    },
    showHistory() {
      if (this.history.length === 0) {
        this.$message.info('暂无浏览历史');
        return;
      }
      this.$alert(
        `<div style="max-height: 400px; overflow-y: auto;">
          ${this.history.slice(0, 20).map(item => `
            <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer;"
                 onclick="window.dispatchEvent(new CustomEvent('select-api', { detail: '${item.func}' }));">
              <div style="font-weight: bold;">${item.name}</div>
              <div style="font-size: 12px; color: #666;">${item.func} - ${item.time}</div>
            </div>
          `).join('')}
        </div>`,
        '浏览历史',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '清空历史',
          callback: action => {
            if (action === 'confirm') {
              this.clearHistory();
            }
          }
        }
      );
    },
    clearHistory() {
      this.history = [];
      localStorage.setItem('api_history_' + this.app, '[]');
      this.$message.success('历史已清空');
    },
    toggleFavorite() {
      if (!this.funcdoc.func) return;
      const index = this.favorites.findIndex(fav => fav.func === this.funcdoc.func);
      if (index > -1) {
        this.favorites.splice(index, 1);
        this.$message.success('已取消收藏');
      } else {
        this.favorites.unshift({
          func: this.funcdoc.func,
          name: this.funcdoc.name,
          time: new Date().format('yyyy-MM-dd hh:mm:ss')
        });
        this.$message.success('收藏成功');
      }
      localStorage.setItem('api_favorites_' + this.app, JSON.stringify(this.favorites));
    },
    addToHistory(apiData) {
      const index = this.history.findIndex(item => item.func === apiData.func);
      if (index > -1) {
        this.history.splice(index, 1);
      }
      this.history.unshift({
        func: apiData.func,
        name: apiData.name,
        time: new Date().format('yyyy-MM-dd hh:mm:ss')
      });
      if (this.history.length > 50) {
        this.history = this.history.slice(0, 50);
      }
      localStorage.setItem('api_history_' + this.app, JSON.stringify(this.history));
    },
    copyApiUrl() {
      const url = this.apiUrl();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
          this.$message.success('接口地址已复制');
        }).catch(() => {
          this.fallbackCopy(url);
        });
      } else {
        this.fallbackCopy(url);
      }
    },
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('接口地址已复制');
      } catch (e) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },
    handleSelectAll(checked) {
      const leafNodes = this.getAllLeafNodes(this.data);
      if (checked) {
        this.$refs.tree.setCheckedKeys(leafNodes.map(node => node.func));
        this.selectedApis = [...leafNodes];
      } else {
        this.$refs.tree.setCheckedKeys([]);
        this.selectedApis = [];
      }
    },
    getAllLeafNodes(nodes) {
      let leafNodes = [];
      nodes.forEach(node => {
        if (node.funcList && node.funcList.length > 0) {
          leafNodes = leafNodes.concat(this.getAllLeafNodes(node.funcList));
        } else if (node.func) {
          leafNodes.push(node);
        }
      });
      return leafNodes;
    },
    handleCheckChange() {
      const checkedKeys = this.$refs.tree.getCheckedKeys();
      const leafNodes = this.getAllLeafNodes(this.data);
      this.selectedApis = leafNodes.filter(node => checkedKeys.includes(node.func));
      this.selectAll = this.selectedApis.length === leafNodes.length && leafNodes.length > 0;
    },
    apiClick(nodeData) {
      if (nodeData.func !== undefined) {
        this.getApiDoc(nodeData.func);
        this.addToHistory(nodeData);
      }
    },
    handleSelectApi(event) {
      const func = event.detail;
      if (func) {
        this.getApiDoc(func);
        const leafNodes = this.getAllLeafNodes(this.data);
        const nodeData = leafNodes.find(node => node.func === func);
        if (nodeData) {
          this.addToHistory(nodeData);
        }
      }
    },
    filterNode(value, data) {
      if (!value || data.func === undefined) return true;
      return data.name.indexOf(value) !== -1 || data.func.indexOf(value) !== -1;
    },
    apiUrl() {
      const url = location.href;
      return url.substring(0, url.indexOf("#")) + this.funcdoc.func;
    },
    typeFormatter(index) {
      let arrEndFix = "";
      let type = index.type;
      if (type.indexOf("[]") >= 0) {
        arrEndFix = type.substring(type.indexOf("[]"));
        type = type.substring(0, type.indexOf("[]"));
      }
      if (this.typeReferrer[type] !== undefined) {
        return this.typeReferrer[type] + arrEndFix;
      }
      return index.type;
    },
    nameFormatter(index) {
      if (index.name.startsWith("$")) {
        return index.name.substr(3);
      }
      return index.name;
    },
    useFormatter(index) {
      if (index.name.startsWith("$A$") || index.name.startsWith("$I$") || index.name.startsWith("$U$")) {
        return "网关自动获取，无需传入";
      } else if (index.name.startsWith("$H$") || index.name.startsWith("$h$")) {
        if (index.name.toLowerCase() === '$h$user-agent' || index.name.toLowerCase() === '$h$referer') {
          return "网关自动获取，无需传入";
        }
        return "请求头 Header 参数";
      } else if (index.name.startsWith("$C$") || index.name.startsWith("$c$")) {
        return "Cookie 参数";
      } else if (index.name.startsWith("$S$")) {
        return "GET / POST 通用参数";
      }
      return "GET / POST 通用参数";
    },
    getApiList() {
      request({
        url: "/admin/apimkt/getApiList",
        params: {}
      }).then((res) => {
        this.data = res.data;
      });
    },
    getApiDoc(func) {
      this.loading = true;
      this.responseParams = [];
      request({
        url: "/admin/apimkt/apidoc",
        params: {
          func: func
        }
      }).then((res) => {
        this.funcdoc = res.data;
        let arr = this.funcdoc.fields || [];
        if (arr.length > 0) {
          arr = this.addTreeLevel(arr);
          this.requestParams = arr.slice(0, arr.length - 1);
          const resArr = arr[arr.length - 1];
          resArr.name = "data";
          const resCode = {
            name: "code",
            type: "int",
            desc: this.funcdoc.codeDesc ? this.funcdoc.codeDesc : "请求结果码，0：成功，-1：失败",
            example: 0,
            id: 'code'
          };
          const resMsg = {
            name: "msg",
            type: "string",
            desc: this.funcdoc.msgDesc ? this.funcdoc.msgDesc : "结果说明",
            example: "",
            id: 'msg'
          };
          this.responseParams = [resCode, resMsg, resArr];
        } else {
          this.requestParams = [];
          this.responseParams = [];
        }
      }).catch((e) => {
        console.error(e);
      }).finally(() => {
        this.loading = false;
        this.testUrl = this.apiUrl();
      });
    },
    generateExampleParams() {
      if (!this.requestParams || this.requestParams.length === 0) {
        this.$message.warning('该接口无请求参数');
        return;
      }
      const example = {};
      this.requestParams.forEach(param => {
        if (param.name && !param.name.startsWith('$')) {
          const fieldName = param.name;
          const exampleValue = param.example;
          if (exampleValue !== null && exampleValue !== undefined) {
            example[fieldName] = exampleValue;
          } else {
            example[fieldName] = this.getDefaultValueByType(param.type);
          }
        }
      });
      this.testRequestBody = JSON.stringify(example, null, 2);
      this.$message.success('已生成示例参数');
    },
    getDefaultValueByType(type) {
      if (!type) return '';
      if (type.includes('int') || type.includes('long') || type.includes('short') || type.includes('byte')) {
        return 0;
      }
      if (type.includes('float') || type.includes('double')) {
        return 0.0;
      }
      if (type.includes('boolean')) {
        return false;
      }
      if (type.includes('[]') || type.includes('List') || type.includes('Array')) {
        return [];
      }
      return '';
    },
    async sendTestRequest() {
      if (!this.testUrl) {
        this.$message.error('请先选择接口');
        return;
      }
      let requestBody = {};
      if (this.testRequestBody.trim()) {
        try {
          requestBody = JSON.parse(this.testRequestBody);
        } catch (e) {
          this.$message.error('请求参数JSON格式错误');
          return;
        }
      }
      this.testLoading = true;
      const startTime = Date.now();
      try {
        const headers = {
          'Content-Type': 'application/json'
        };
        if (this.funcdoc.sign === 1 || this.funcdoc.sign === 2) {
          if (!this.testToken) {
            this.$message.error('请输入签名Token');
            this.testLoading = false;
            return;
          }
          const timestamp = Math.floor(Date.now() / 1000);
          let sign = '';
          if (this.funcdoc.sign === 1) {
            sign = await this.md5(this.testToken + timestamp) + timestamp;
          } else {
            const nonce = Math.random().toString(36).substring(2, 15);
            sign = await this.sha256(this.testToken + timestamp + nonce) + timestamp + nonce;
          }
          headers['sign'] = sign;
        }
        const response = await fetch(this.testUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(requestBody)
        });
        const endTime = Date.now();
        this.testResponseTime = endTime - startTime;
        this.testResponseStatus = response.status;
        const responseText = await response.text();
        try {
          const responseJson = JSON.parse(responseText);
          this.testResponse = JSON.stringify(responseJson, null, 2);
        } catch (e) {
          this.testResponse = responseText;
        }
        this.$message.success('请求成功');
      } catch (error) {
        const endTime = Date.now();
        this.testResponseTime = endTime - startTime;
        this.testResponseStatus = 0;
        this.testResponse = `请求失败：${error.message}`;
        this.$message.error('请求失败');
      } finally {
        this.testLoading = false;
      }
    },
    async md5(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => {
        return this.simpleMd5(text);
      });
      if (typeof hashBuffer === 'string') {
        return hashBuffer;
      }
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    simpleMd5(text) {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
    },
    async sha256(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    clearTestPanel() {
      this.testRequestBody = '';
      this.testResponse = '';
      this.testResponseStatus = 0;
      this.testResponseTime = 0;
      this.testToken = '';
      this.$message.success('已清空测试面板');
    },
    addTreeLevel(data, level = 0) {
      return data.map(node => {
        if (level === 0) node.id = node.name;
        if (node.children && node.children.length) {
          node.children.map(x => x.id = node.id + "_" + x.name);
          node.children = this.addTreeLevel(node.children, level + 1);
        }
        return node;
      });
    },
    async exportMultipleToHTML() {
      if (this.selectedApis.length === 0) {
        this.$message.warning('请先选择要导出的接口');
        return;
      }
      this.exporting = true;
      this.$message.info('正在生成文档，请稍候...');
      try {
        const apiDocs = await Promise.all(this.selectedApis.map(api => this.getApiDocDetail(api.func)));
        const htmlContent = this.generateMultiApiHTML(apiDocs);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        saveAs(blob, `${this.app + '接口文档_' + new Date().format("yyyyMMdd_hhmmss")}.html`);
        this.$message.success(`成功导出 ${apiDocs.length} 个接口文档`);
      } catch (error) {
        console.error('导出失败', error);
        this.$message.error('导出失败');
      } finally {
        this.exporting = false;
      }
    },
    getApiDocDetail(func) {
      return new Promise((resolve, reject) => {
        request({
          url: "/admin/apimkt/apidoc",
          params: { func: func }
        }).then(res => {
          resolve(res.data);
        }).catch(error => {
          reject(error);
        });
      });
    },
    generateMultiApiHTML(apiDocs) {
      const exportTime = new Date().format('yyyy-MM-dd hh:mm:ss');
      const groupedApis = this.groupApisByModule(apiDocs);
      const moduleEntries = Object.keys(groupedApis).map((moduleName, index) => ({
        key: `module-${index}`,
        name: moduleName,
        apis: groupedApis[moduleName]
      }));
      const totalApiCount = apiDocs.length;
      const openApiCount = apiDocs.filter(doc => doc.sign === 0).length;
      const signApiCount = apiDocs.filter(doc => doc.sign === 1 || doc.sign === 2).length;
      const tocHTML = this.generateTOC(moduleEntries);
      const apiSearchData = [];
      let apiIndex = 0;
      const sectionsHTML = moduleEntries.map(module => {
        const apiSections = module.apis.map(api => {
          apiSearchData.push({
            id: `api-${apiIndex}`,
            name: api.name || '',
            func: api.func || '',
            description: api.description || '',
            moduleKey: module.key,
            moduleName: module.name
          });
          const sectionHTML = this.generateApiSectionHTML(api, apiIndex);
          apiIndex += 1;
          return sectionHTML;
        }).join('');
        return `
      <section class="module-section" id="${module.key}">
        <div class="panel-header export-module__header">
          <div class="panel-header__main">
            <div class="panel-title">${this.escapeHtml(module.name)}</div>
            <div class="panel-subtitle">共 ${module.apis.length} 个接口，支持目录检索、模块折叠与定位跳转。</div>
          </div>
          <span class="status-pill">${module.apis.length} 个接口</span>
        </div>
        ${apiSections}
      </section>`;
      }).join('');
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.app)} 接口文档</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --text: #1f2937;
      --muted: #64748b;
      --muted-light: #94a3b8;
      --primary: #2563eb;
      --primary-soft: rgba(37, 99, 235, 0.08);
      --border: rgba(226, 232, 240, 0.9);
      --card-bg: rgba(255, 255, 255, 0.96);
      --card-grad: linear-gradient(180deg, #ffffff, #f8fbff);
      --shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
      --shadow-strong: 0 24px 64px rgba(15, 23, 42, 0.12);
      --radius-xl: 20px;
      --radius-lg: 16px;
      --radius-md: 14px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
        radial-gradient(circle at left top, rgba(16, 185, 129, 0.08), transparent 24%),
        var(--bg);
    }
    a { color: inherit; text-decoration: none; }
    .page-shell { display: flex; gap: 16px; padding: 18px; }
    .panel-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow);
    }
    .page-header, .panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }
    .panel-header { margin-bottom: 14px; }
    .page-header__main, .panel-header__main { min-width: 0; flex: 1; }
    .page-header__actions, .panel-header__actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .page-header__title { font-size: 24px; font-weight: 700; line-height: 1.3; color: #0f172a; }
    .page-header__desc, .panel-subtitle { margin-top: 6px; font-size: 13px; line-height: 1.7; color: var(--muted); }
    .panel-title { font-size: 18px; font-weight: 700; color: #0f172a; }
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
    }
    .status-pill--success { background: rgba(16, 185, 129, 0.12); color: #059669; }
    .status-pill--warning { background: rgba(245, 158, 11, 0.14); color: #d97706; }
    .status-pill--danger { background: rgba(239, 68, 68, 0.12); color: #dc2626; }
    .export-sidebar {
      width: 320px;
      flex: 0 0 320px;
      position: sticky;
      top: 18px;
      align-self: flex-start;
      max-height: calc(100vh - 36px);
    }
    .export-sidebar__card { padding: 18px; }
    .export-main { min-width: 0; flex: 1; }
    .export-hero { padding: 20px; margin-bottom: 16px; }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .summary-item {
      padding: 12px 14px;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: var(--card-grad);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    }
    .summary-item__label { font-size: 12px; color: var(--muted); }
    .summary-item__value { margin-top: 6px; font-size: 22px; line-height: 1.25; font-weight: 700; color: #0f172a; }
    .summary-item__meta { margin-top: 6px; font-size: 12px; line-height: 1.5; color: var(--muted-light); }
    .page-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
      margin: 12px 0;
    }
    .page-toolbar__group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .toolbar-input {
      width: 100%;
      min-height: 36px;
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid #dbe4f0;
      background: rgba(255, 255, 255, 0.96);
      color: #1e293b;
      outline: none;
      transition: all 0.2s ease;
    }
    .toolbar-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
    .toolbar-button {
      border: 1px solid #dbe4f0;
      border-radius: 10px;
      background: #fff;
      color: #334155;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .toolbar-button:hover { border-color: #93c5fd; background: #f8fbff; }
    .toolbar-button--primary { border-color: transparent; background: var(--primary); color: #fff; }
    .toolbar-button--primary:hover { background: #1d4ed8; }
    .tree-shell {
      overflow: auto;
      border-radius: 16px;
      padding: 12px;
      background: #f8fbff;
      border: 1px solid rgba(226, 232, 240, 0.8);
      max-height: calc(100vh - 220px);
    }
    .toc-list, .toc-api-list { list-style: none; padding: 0; margin: 0; }
    .toc-module + .toc-module { margin-top: 10px; }
    .toc-module__header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #fff;
      border: 1px solid rgba(226, 232, 240, 0.8);
      cursor: pointer;
      user-select: none;
    }
    .toc-module__header:hover { background: #f8fbff; }
    .toc-toggle {
      width: 18px;
      text-align: center;
      color: var(--muted);
      transition: transform 0.2s ease;
      flex: 0 0 18px;
    }
    .toc-module.is-collapsed .toc-toggle { transform: rotate(-90deg); }
    .toc-module__name { min-width: 0; flex: 1; font-size: 13px; font-weight: 700; color: #0f172a; }
    .toc-module__count {
      flex: 0 0 auto;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--primary-soft);
      color: var(--primary);
      font-size: 12px;
      font-weight: 700;
    }
    .toc-api-list { margin: 8px 0 0; padding-left: 10px; }
    .toc-module.is-collapsed .toc-api-list { display: none; }
    .toc-api-item + .toc-api-item { margin-top: 6px; }
    .toc-link {
      display: block;
      padding: 8px 12px;
      border-radius: 12px;
      color: #475569;
      font-size: 12px;
      line-height: 1.5;
      transition: all 0.2s ease;
    }
    .toc-link:hover { background: #edf5ff; color: var(--primary); }
    .toc-link.is-active { background: var(--primary); color: #fff; box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24); }
    .highlight { background: rgba(250, 204, 21, 0.45); padding: 0 2px; border-radius: 4px; }
    .export-sidebar__tip { margin-top: 8px; font-size: 12px; color: var(--muted); }
    .export-no-result {
      margin-top: 12px;
      padding: 18px 12px;
      border: 1px dashed rgba(148, 163, 184, 0.36);
      border-radius: 14px;
      text-align: center;
      color: var(--muted);
      background: linear-gradient(180deg, #f8fbff, #f1f5f9);
      display: none;
    }
    .module-section + .module-section { margin-top: 18px; }
    .export-module__header { padding: 4px 2px 2px; }
    .api-section {
      padding: 20px;
      margin-top: 12px;
      scroll-margin-top: 18px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }
    .info-item {
      min-width: 0;
      padding: 14px 16px;
      border-radius: 14px;
      background: #f8fbff;
      border: 1px solid rgba(226, 232, 240, 0.8);
    }
    .info-item__label { font-size: 12px; color: var(--muted); }
    .info-item__value { margin-top: 6px; font-size: 14px; line-height: 1.55; color: #0f172a; word-break: break-word; }
    .section-block + .section-block { margin-top: 14px; }
    .section-caption { margin-bottom: 10px; font-size: 13px; color: var(--muted); }
    .url-card, .sign-card {
      padding: 14px 16px;
      border-radius: 16px;
      background: linear-gradient(180deg, #0f172a, #1e293b);
      color: #e2e8f0;
      font-size: 12px;
      line-height: 1.7;
    }
    .url-card a, .sign-card a { color: #93c5fd; }
    .muted-text { color: var(--muted); }
    .mono-text { font-family: Consolas, Monaco, monospace; }
    .doc-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      overflow: hidden;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      background: #fff;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
    }
    .doc-table th {
      background: #f8fafc;
      color: #334155;
      font-size: 12px;
      font-weight: 700;
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #edf2f7;
    }
    .doc-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #edf2f7;
      color: #334155;
      font-size: 12px;
      line-height: 1.6;
      vertical-align: top;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .doc-table tr:nth-child(even) td { background: #fcfdff; }
    .doc-table tr:hover td { background: #f8fbff; }
    .doc-table code {
      display: inline-block;
      max-width: 100%;
      padding: 2px 6px;
      border-radius: 8px;
      background: #f8fafc;
      font-family: Consolas, Monaco, monospace;
      font-size: 12px;
      color: #0f172a;
      white-space: pre-wrap;
    }
    .param-name { display: inline-block; min-width: 0; }
    .empty-state {
      padding: 18px 16px;
      border-radius: 16px;
      border: 1px dashed rgba(148, 163, 184, 0.36);
      background: linear-gradient(180deg, #f8fbff, #f1f5f9);
      color: var(--muted);
      text-align: center;
      font-size: 13px;
    }
    .back-to-top {
      position: fixed;
      right: 26px;
      bottom: 26px;
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      box-shadow: var(--shadow-strong);
      opacity: 0;
      pointer-events: none;
      transform: translateY(12px);
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .back-to-top.is-visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .back-to-top:hover { transform: translateY(-2px); }
    @media (max-width: 1280px) {
      .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 992px) {
      .page-shell { flex-direction: column; }
      .export-sidebar { position: static; width: 100%; max-height: none; }
      .tree-shell { max-height: none; }
      .page-header, .panel-header { flex-direction: column; align-items: flex-start; }
      .info-grid, .summary-grid { grid-template-columns: 1fr; }
    }
    @media print {
      .export-sidebar, .back-to-top { display: none !important; }
      .page-shell { padding: 0; }
      .export-main { width: 100%; }
      .api-section, .export-hero { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page-shell">
    <aside class="export-sidebar">
      <div class="panel-card export-sidebar__card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">接口目录</div>
            <div class="panel-subtitle">已导出 ${totalApiCount} 个接口。</div>
          </div>
        </div>
        <div class="tree-shell" id="tocContainer">
          <ul class="toc-list">
            ${tocHTML}
          </ul>
          <div id="noResults" class="export-no-result">未找到匹配的接口</div>
        </div>
      </div>
    </aside>
    <main class="export-main">
      <section class="panel-card export-hero">
        <div class="page-header">
          <div class="page-header__main">
            <div class="page-header__title">${this.escapeHtml(this.app)} 接口导出文档</div>
          </div>
          <div class="page-header__actions">
            <span class="status-pill">HTML 文档</span>
            <span class="status-pill">导出时间 ${this.escapeHtml(exportTime)}</span>
          </div>
        </div>
      </section>
      ${sectionsHTML}
    </main>
  </div>
  <button id="backToTop" class="back-to-top" type="button" aria-label="回到顶部">↑</button>
  <script>
    const apiData = ${JSON.stringify(apiSearchData.map(item => ({
      id: item.id,
      moduleKey: item.moduleKey,
      moduleName: item.moduleName,
      name: item.name,
      func: item.func,
      description: item.description,
      nameLower: (item.name || '').toLowerCase(),
      funcLower: (item.func || '').toLowerCase(),
      descriptionLower: (item.description || '').toLowerCase()
    })))};
    const apiDataMap = apiData.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    const moduleStates = ${JSON.stringify(moduleEntries.reduce((acc, item) => {
      acc[item.key] = true;
      return acc;
    }, {}))};
    function scrollToSection(sectionId) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        updateActiveNav(sectionId);
      }
    }
    function getScrollTop() {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }
    function scrollToTop() {
      const scrollTarget = document.scrollingElement || document.documentElement || document.body;
      if (window.scrollTo) {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch (error) {
          window.scrollTo(0, 0);
        }
      }
      if (scrollTarget) {
        scrollTarget.scrollTop = 0;
      }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    function updateBackToTop() {
      const backToTopButton = document.getElementById('backToTop');
      if (!backToTopButton) return;
      backToTopButton.classList.toggle('is-visible', getScrollTop() > 240);
    }
    function updateActiveNav(activeId) {
      document.querySelectorAll('.toc-link').forEach(link => {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
      });
    }
    function setModuleExpand(moduleKey, expand) {
      moduleStates[moduleKey] = expand;
      const moduleElement = document.querySelector('[data-module-key="' + moduleKey + '"]');
      if (!moduleElement) return;
      moduleElement.classList.toggle('is-collapsed', !expand);
    }
    function toggleModule(moduleKey) {
      setModuleExpand(moduleKey, !moduleStates[moduleKey]);
    }
    function toggleAllModules(expand) {
      Object.keys(moduleStates).forEach(moduleKey => setModuleExpand(moduleKey, expand));
    }
    function clearHighlights() {
      document.querySelectorAll('.toc-link').forEach(link => {
        link.innerHTML = link.dataset.name || link.textContent;
      });
    }
    function escapeRegExp(text) {
      return text.split('').map(char => ('\\^$.*+?()[]{}|-/'.includes(char) ? '\\' + char : char)).join('');
    }
    function updateSearchMeta(text) {
      document.getElementById('searchMeta').textContent = text;
    }
    function filterApis() {
      const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
      const noResults = document.getElementById('noResults');
      let matchCount = 0;
      clearHighlights();
      document.querySelectorAll('.toc-module').forEach(moduleElement => {
        const moduleKey = moduleElement.dataset.moduleKey;
        let moduleHasMatch = false;
        moduleElement.querySelectorAll('.toc-api-item').forEach(item => {
          const apiId = item.dataset.apiId;
          const api = apiDataMap[apiId];
          const matched = !searchTerm || api.nameLower.includes(searchTerm) || api.funcLower.includes(searchTerm) || api.descriptionLower.includes(searchTerm);
          item.style.display = matched ? '' : 'none';
          if (matched) {
            moduleHasMatch = true;
            matchCount += 1;
            if (searchTerm) {
              const link = item.querySelector('.toc-link');
              const regex = new RegExp('(' + escapeRegExp(searchTerm) + ')', 'ig');
              link.innerHTML = (link.dataset.name || '').replace(regex, '<span class="highlight">$1</span>');
            }
          }
        });
        moduleElement.style.display = moduleHasMatch ? '' : 'none';
        if (searchTerm && moduleHasMatch) {
          setModuleExpand(moduleKey, true);
        }
        if (!searchTerm) {
          setModuleExpand(moduleKey, true);
        }
      });
      noResults.style.display = matchCount > 0 || !searchTerm ? 'none' : 'block';
      updateSearchMeta(searchTerm ? ('匹配 ' + matchCount + ' 个接口') : '支持按名称、函数标识或说明搜索');
    }
    function handlePageScroll() {
      const sections = document.querySelectorAll('.api-section');
      let currentSection = '';
      const scrollTop = getScrollTop();
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 120;
        if (scrollTop >= sectionTop) {
          currentSection = section.getAttribute('id');
        }
      });
      if (currentSection) {
        updateActiveNav(currentSection);
      }
      updateBackToTop();
    }
    window.addEventListener('scroll', handlePageScroll, { passive: true });
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          scrollToSection(link.getAttribute('href').substring(1));
        });
      });
      document.querySelectorAll('.toc-module__header').forEach(header => {
        header.addEventListener('click', () => toggleModule(header.closest('.toc-module').dataset.moduleKey));
      });
      const backToTopButton = document.getElementById('backToTop');
      if (backToTopButton) {
        backToTopButton.addEventListener('click', scrollToTop);
      }
      const firstSection = document.querySelector('.api-section');
      if (firstSection) {
        updateActiveNav(firstSection.getAttribute('id'));
      }
      updateBackToTop();
      handlePageScroll();
    });
  <\/script>
</body>
</html>
      `;
    },
    generateTOC(moduleEntries) {
      let tocHTML = '';
      let apiIndex = 0;
      moduleEntries.forEach(module => {
        tocHTML += `
      <li class="toc-module" data-module-key="${module.key}">
        <div class="toc-module__header">
          <span class="toc-toggle">▼</span>
          <span class="toc-module__name">${this.escapeHtml(module.name)}</span>
          <span class="toc-module__count">${module.apis.length}</span>
        </div>
        <ul class="toc-api-list">
    `;
        module.apis.forEach(api => {
          tocHTML += `
          <li class="toc-api-item" data-api-id="api-${apiIndex}">
            <a
              class="toc-link"
              data-api-id="api-${apiIndex}"
              data-name="${this.escapeHtml(api.name || '')}"
              href="#api-${apiIndex}"
              title="${this.escapeHtml(api.description || '')}"
            >${this.escapeHtml(api.name || '')}</a>
          </li>
      `;
          apiIndex += 1;
        });
        tocHTML += `
        </ul>
      </li>
    `;
      });
      return tocHTML;
    },
    slugify(text) {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    },
    groupApisByModule(apiDocs) {
      const grouped = {};
      apiDocs.forEach(api => {
        const moduleName = api.serviceName || '未分类模块';
        if (!grouped[moduleName]) {
          grouped[moduleName] = [];
        }
        grouped[moduleName].push(api);
      });
      return grouped;
    },
    generateApiSectionHTML(doc, index) {
      const requestParamsTable = this.generateParamsTable(doc.fields ? doc.fields.slice(0, doc.fields.length - 1) : [], true);
      let responseParamsTable = '';
      if (doc.fields && doc.fields.length > 0) {
        const resArr = doc.fields[doc.fields.length - 1];
        const responseParams = [
          { name: 'code', type: 'int', example: 0, desc: doc.codeDesc ? doc.codeDesc : '请求结果码，0：成功，-1：失败' },
          { name: 'msg', type: 'string', example: '', desc: doc.msgDesc ? doc.msgDesc : '结果说明' },
          { ...resArr, name: 'data' }
        ];
        responseParamsTable = this.generateParamsTable(responseParams, false);
      }
      const permissionLabel = doc.sign === 1 ? 'MD5签名' : doc.sign === 2 ? 'SHA256签名' : '开放接口';
      const permissionClass = doc.sign === 0 ? 'status-pill status-pill--success' : 'status-pill status-pill--warning';
      const signContent = doc.sign === 1
        ? 'sign = MD5($TOKEN$ + unixtimestamp) + unixtimestamp'
        : doc.sign === 2
          ? 'sign = SHA256($TOKEN$ + unixtimestamp + nonce) + unixtimestamp + nonce'
          : '';
      const basicInfo = [
        { label: '应用标识', value: doc.app },
        { label: '函数标识', value: doc.func },
        { label: '函数名称', value: doc.name },
        { label: '调用权限', value: permissionLabel },
        { label: '模块标识', value: doc.service },
        { label: '模块名称', value: doc.serviceName }
      ];
      const basicInfoHTML = basicInfo.map(item => `
        <div class="info-item">
          <div class="info-item__label">${this.escapeHtml(item.label)}</div>
          <div class="info-item__value mono-text">${this.escapeHtml(item.value || '')}</div>
        </div>
      `).join('');
      const localUrl = this.generateApiUrl(doc, true);
      return `
    <article class="panel-card api-section" id="api-${index}">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">${this.escapeHtml(doc.name || '')}</div>
          <div class="panel-subtitle">${this.escapeHtml(doc.description || '暂无接口说明。')}</div>
        </div>
        <div class="panel-header__actions">
          <span class="${permissionClass}">${permissionLabel}</span>
        </div>
      </div>
      <div class="info-grid">
        ${basicInfoHTML}
      </div>
      <div class="section-block">
        <div class="section-caption">请求地址</div>
        <div class="url-card mono-text">
          <div><span class="muted-text">Local：</span><a href="${this.escapeHtml(localUrl)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(localUrl)}</a></div>
        </div>
      </div>
      ${signContent ? `
      <div class="section-block">
        <div class="section-caption">签名方式</div>
        <div class="sign-card mono-text">${this.escapeHtml(signContent)}</div>
      </div>` : ''}
      <div class="section-block">
        <div class="section-caption">请求参数</div>
        ${requestParamsTable}
      </div>
      <div class="section-block">
        <div class="section-caption">返回参数</div>
        ${responseParamsTable || '<div class="empty-state">该接口暂无返回参数说明</div>'}
      </div>
    </article>
  `;
    },
    generateParamsTable(params, isRequest) {
      if (!params || params.length === 0) {
        return '<div class="empty-state">无参数</div>';
      }
      const flatParams = this.flattenParams(params);
      const headers = isRequest ? ['字段', '传参方式', '类型', '示例', '描述'] : ['字段', '类型', '示例', '描述'];
      const headerHTML = headers.map(header => `<th>${this.escapeHtml(header)}</th>`).join('');
      const rowsHTML = flatParams.map(param => {
        const example = param.example === null || param.example === undefined
          ? ''
          : (typeof param.example === 'object' ? JSON.stringify(param.example, null, 2) : String(param.example));
        return `
          <tr>
            <td><span class="param-name" style="padding-left: ${param.level * 16}px">${this.escapeHtml(this.nameFormatter(param) || '')}</span></td>
            ${isRequest ? `<td>${this.escapeHtml(this.useFormatter(param) || '')}</td>` : ''}
            <td>${this.escapeHtml(this.typeFormatter(param) || '')}</td>
            <td><code>${this.escapeHtml(example)}</code></td>
            <td>${this.escapeHtml(param.desc || '')}</td>
          </tr>
        `;
      }).join('');
      return `
        <table class="doc-table">
          <thead>
            <tr>${headerHTML}</tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      `;
    },
    escapeHtml(value) {
      return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    flattenParams(params, level = 0) {
      let result = [];
      params.forEach(param => {
        const flatParam = {
          ...param,
          level: level
        };
        result.push(flatParam);
        if (param.children && param.children.length > 0) {
          result = result.concat(this.flattenParams(param.children, level + 1));
        }
      });
      return result;
    },
    generateApiUrl(doc, isLocal) {
      if (isLocal) {
        const url = window.location.href;
        return url.substring(0, url.indexOf("#")) + doc.func;
      }
      return "https://wxtest.guosen.com.cn/" + doc.func;
    }
  }
};
</script>

<style lang="scss" scoped>
.api-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.api-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 24px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  flex: 1;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.api-stats__label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 6px;
}

.api-stats__value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.api-stats__item--total {
  background: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  .api-stats__value { color: #0284c7; }
}

.api-stats__item--open {
  background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
  .api-stats__value { color: #16a34a; }
}

.api-stats__item--sign {
  background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
  .api-stats__value { color: #d97706; }
}

.api-stats__item--selected {
  background: linear-gradient(135deg, #ede9fe 0%, #faf5ff 100%);
  .api-stats__value { color: #7c3aed; }
}

.api-test-panel__config {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.api-test-panel__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.api-test-panel__label {
  flex-shrink: 0;
  min-width: 100px;
  font-weight: 600;
  color: #64748b;
  font-size: 14px;
  padding-top: 6px;
}

.api-test-panel__url-input {
  flex: 1;
}

.api-test-panel__editor {
  flex: 1;
  min-width: 0;
}

.api-test-panel__textarea {
  width: 100%;
  font-family: 'Courier New', monospace;
}

.api-test-panel__helper-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.api-test-panel__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-left: 112px;
}

.api-test-panel__response {
  margin-top: 20px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.api-test-panel__response-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.api-test-panel__time {
  font-size: 12px;
  color: #94a3b8;
}

.api-test-panel__response-body {
  margin: 0;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.api-test-dialog__body {
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

</style>

<style lang="scss" scoped>
.api-market__summary-grid {
  margin-top: 14px;
}

.api-market__summary-name {
  font-size: 16px;
  line-height: 1.35;
}

.api-market {
  height: calc(100vh - 66px);
  overflow: hidden;
}

.api-market__layout {
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(280px, 25%) minmax(0, 1fr);
  align-items: stretch;
  overflow: hidden;
}

.api-market__tree-panel,
.api-market__doc-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.api-market__tree-panel ::v-deep .el-card__body,
.api-market__doc-panel ::v-deep .el-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.api-market__tree-toolbar {
  margin-bottom: 10px;
  flex: 0 0 auto;
}

.api-market__tree-shell {
  flex: 1;
  min-height: 0;
  max-height: none;
}

.api-market__doc-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.api-market__tree-node {

  min-width: 0;
  font-size: 12px;
  line-height: 1.4;
}

.api-market__info-grid {
  margin-top: 14px;
}

.api-market__section-title {
  margin-bottom: 8px;
}

.api-market__url-card,
.api-market__sign-card {
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, #0f172a, #1e293b);
  color: #e2e8f0;
  font-size: 12px;
  line-height: 1.65;
}

.api-market__table ::v-deep .cell {
  line-height: 1.35;
}

.api-market__tree-shell ::v-deep .el-tree-node__content {
  height: 30px;
}

.api-market__tree-node ::v-deep .el-link {
  font-size: 12px;
  max-width: 100%;
}

.api-market__tree-node ::v-deep .el-link--inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.api-market__url-card ::v-deep .el-link,
.api-market__sign-card ::v-deep .el-link {
  color: #93c5fd;
}

@media (max-width: 992px) {
  .api-market {
    height: auto;
    overflow: visible;
  }

  .api-market__layout {
    height: auto;
    overflow: visible;
  }

  .api-market__tree-panel,
  .api-market__doc-panel {
    height: auto;
    min-height: calc(100vh - 220px);
  }

  .api-market__tree-shell {
    min-height: calc(100vh - 330px);
    max-height: calc(100vh - 330px);
  }

  .api-market__doc-scroll {
    min-height: 0;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
}
</style>


