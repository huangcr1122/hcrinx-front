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
            <el-button size="small" type="primary" icon="el-icon-download" @click="exportMultipleToHTML">导出已选</el-button>
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
                <div><span class="muted-text">Network：</span><el-link :href="apiUrl2()" :underline="false" type="primary">{{ apiUrl2() }}</el-link></div>
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
    apiUrl2() {
      return "https://wxtest.guosen.com.cn/" + this.funcdoc.func;
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
      this.$message.info('正在生成文档，请稍候...');
      try {
        const apiDocs = [];
        for (const api of this.selectedApis) {
          const doc = await this.getApiDocDetail(api.func);
          apiDocs.push(doc);
        }
        const htmlContent = this.generateMultiApiHTML(apiDocs);
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        saveAs(blob, `${this.app + '接口文档_' + new Date().format("yyyyMMdd_hhmmss")}.html`);
        this.$message.success(`成功导出 ${apiDocs.length} 个接口文档`);
      } catch (error) {
        console.error('导出失败', error);
        this.$message.error('导出失败');
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
      const groupedApis = this.groupApisByModule(apiDocs);
      let sectionsHTML = '';
      let apiIndex = 0;
      Object.keys(groupedApis).forEach(moduleName => {
        const moduleApis = groupedApis[moduleName];
        sectionsHTML += `
      <div class="module-section" id="module-${this.slugify(moduleName)}">
        <h2 class="module-title">${moduleName}</h2>
    `;
        moduleApis.forEach(api => {
          sectionsHTML += this.generateApiSectionHTML(api, apiIndex);
          apiIndex++;
        });
        sectionsHTML += `</div>`;
      });
      const tocHTML = this.generateTOC(groupedApis);
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>API文档</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Microsoft YaHei", Arial, sans-serif; line-height: 1.4; color: #333; padding: 0; margin: 0; font-size: 14px; display: flex; min-height: 100vh; }
        .sidebar { width: 320px; background: #f8f9fa; border-right: 1px solid #e0e0e0; position: fixed; left: 0; top: 0; overflow-y: auto; padding: 5px; }
        .sidebar h2 { color: #409EFF; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e0e0e0; font-size: 16px; }
        .search-box { margin-bottom: 15px; }
        .search-box input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; }
        .search-box input:focus { outline: none; border-color: #409EFF; box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2); }
        .toc { max-height: calc(100vh - 175px); overflow-y: auto; }
        .toc ul { list-style: none; padding: 0; }
        .toc > ul > li { margin: 8px 0; }
        .module-item { margin: 10px 0; }
        .module-header { display: flex; align-items: center; cursor: pointer; padding: 8px 10px; border-radius: 4px; transition: all 0.3s; user-select: none; }
        .module-header:hover { background: #e8f4ff; }
        .module-header .toggle-icon { margin-right: 6px; font-size: 12px; transition: transform 0.3s; color: #666; }
        .module-header.collapsed .toggle-icon { transform: rotate(-90deg); }
        .module-name { font-weight: bold; color: #333; font-size: 14px; }
        .module-count { margin-left: auto; background: #409EFF; color: white; border-radius: 10px; padding: 2px 8px; font-size: 12px; }
        .api-list { list-style: none; padding: 0; margin: 5px 0 5px 20px; overflow: hidden; transition: max-height 0.3s ease; }
        .api-list.collapsed { max-height: 0; }
        .api-list li { margin: 4px 0; }
        .api-list a { color: #666; text-decoration: none; display: block; padding: 6px 10px 6px 20px; border-radius: 3px; transition: all 0.3s; font-size: 13px; position: relative; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .api-list a:before { content: "•"; color: #409EFF; position: absolute; left: 8px; }
        .api-list a:hover { background: #e8f4ff; color: #409EFF; }
        .api-list a.active { background: #409EFF; color: white; }
        .highlight { background-color: #ffeb3b; padding: 0 2px; border-radius: 2px; }
        .no-results { color: #999; font-style: italic; padding: 10px; text-align: center; font-size: 13px; }
        .content { flex: 1; margin-left: 320px; padding: 20px 40px; max-width: calc(100% - 320px); }
        .api-section { margin-bottom: 40px; padding: 25px; border: 1px solid #e0e0e0; border-radius: 8px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.05); scroll-margin-top: 20px; }
        .module-section { margin-bottom: 30px; }
        .module-title { color: #409EFF; margin: 30px 0 15px 0; border-left: 4px solid #409EFF; padding-left: 10px; font-size: 20px; }
        h1 { color: #409EFF; margin-bottom: 15px; border-bottom: 2px solid #409EFF; padding-bottom: 10px; font-size: 24px; }
        h2 { color: #409EFF; margin: 20px 0 12px 0; font-size: 18px; }
        .httpUrl { background: #f8f9fa; padding: 12px; border-left: 3px solid #409EFF; margin: 10px 0; font-family: monospace; font-size: 14px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; white-space: pre-wrap; }
        th { background-color: #f5f7fa; font-weight: bold; color: #333; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .divider { height: 1px; background: #e8e8e8; margin: 20px 0; }
        a { color: #409EFF; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .basic-info { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin: 15px 0; }
        .info-item { display: flex; align-items: center; }
        .info-label { font-weight: bold; min-width: 100px; color: #666; }
        .back-to-top { position: fixed; bottom: 30px; right: 30px; background: #409EFF; color: white; border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer; font-size: 20px; box-shadow: 0 3px 10px rgba(0,0,0,0.2); transition: all 0.3s; z-index: 1000; }
        .back-to-top:hover { background: #66b1ff; transform: translateY(-2px); }
        @media (max-width: 768px) { .sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid #e0e0e0; } .content { margin-left: 0; max-width: 100%; } body { flex-direction: column; } }
        @media print { .back-to-top, .sidebar { display: none; } .content { margin-left: 0; max-width: 100%; padding: 0; } .api-section { page-break-inside: avoid; } }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>API接口目录</h2>
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="搜索接口名称..." oninput="filterApis()">
        </div>
        <div class="toc" id="tocContainer">
            <ul>
                ${tocHTML}
            </ul>
        </div>
    </div>
    <div class="content">
        ${sectionsHTML}
        <button class="back-to-top" onclick="scrollToTop()">↑</button>
    </div>
    <script>
        const apiData = ${JSON.stringify(apiDocs.map((doc, index) => ({ id: index, name: doc.name, module: doc.serviceName || '未分类模块', description: doc.description || '' })))};
        const moduleStates = {};
        Object.keys(apiData.reduce((acc, api) => { acc[api.module] = true; return acc; }, {})).forEach(module => { moduleStates[module] = true; });
        function scrollToSection(sectionId) { const target = document.getElementById(sectionId); if (target) { target.scrollIntoView({ behavior: 'smooth' }); updateActiveNav(sectionId); } }
        function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
        function updateActiveNav(activeId) { document.querySelectorAll('.api-list a').forEach(link => { link.classList.remove('active'); if (link.getAttribute('href') === '#' + activeId) { link.classList.add('active'); } }); }
        function toggleModule(moduleName) {
            const moduleElement = document.querySelector('[data-module="' + moduleName + '"]');
            const apiList = moduleElement.querySelector('.api-list');

            const moduleHeader = moduleElement.querySelector('.module-header');
            moduleStates[moduleName] = !moduleStates[moduleName];
            if (moduleStates[moduleName]) { apiList.classList.remove('collapsed'); moduleHeader.classList.remove('collapsed'); }
            else { apiList.classList.add('collapsed'); moduleHeader.classList.add('collapsed'); }
        }
        function toggleAllModules(expand) {
            Object.keys(moduleStates).forEach(moduleName => {
                moduleStates[moduleName] = expand;
                const moduleElement = document.querySelector('[data-module="' + moduleName + '"]');
                if (moduleElement) {

                    const apiList = moduleElement.querySelector('.api-list');
                    const moduleHeader = moduleElement.querySelector('.module-header');
                    if (expand) { apiList.classList.remove('collapsed'); moduleHeader.classList.remove('collapsed'); }
                    else { apiList.classList.add('collapsed'); moduleHeader.classList.add('collapsed'); }
                }
            });
        }
        function filterApis() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const tocContainer = document.getElementById('tocContainer');
            if (!searchTerm) {
                document.querySelectorAll('.module-item, .api-list li').forEach(el => { el.style.display = ''; });
                document.querySelectorAll('.api-list a').forEach(link => { link.innerHTML = link.textContent; });
                toggleAllModules(true);
                return;
            }
            let hasResults = false;
            document.querySelectorAll('.api-list li').forEach(li => { li.style.display = 'none'; });
            apiData.forEach(api => {
                const apiName = api.name.toLowerCase();
                const apiDesc = api.description.toLowerCase();
                if (apiName.includes(searchTerm) || apiDesc.includes(searchTerm)) {
                    const apiLink = document.querySelector('a[href="#api-' + api.id + '"]');
                    if (apiLink) {

                        const li = apiLink.closest('li');
                        li.style.display = '';
                        const originalText = api.name;
                        const escapedTerm = searchTerm.replace(/[.*+?^$\\{}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp('(' + escapedTerm + ')', 'gi');
                        apiLink.innerHTML = originalText.replace(regex, '<span class="highlight">$1</span>');
                        const moduleElement = li.closest('.module-item');
                        const moduleName = moduleElement.dataset.module;
                        moduleStates[moduleName] = true;
                        const apiList = moduleElement.querySelector('.api-list');
                        const moduleHeader = moduleElement.querySelector('.module-header');
                        apiList.classList.remove('collapsed');
                        moduleHeader.classList.remove('collapsed');
                        hasResults = true;
                    }
                }
            });
            document.querySelectorAll('.module-item').forEach(module => {
                const visibleApis = module.querySelectorAll('.api-list li[style=""]');
                if (visibleApis.length > 0) module.style.display = '';
                else module.style.display = 'none';
            });
            const noResults = document.getElementById('noResults');
            if (!hasResults) {
                if (!noResults) {
                    const noResultsEl = document.createElement('div');
                    noResultsEl.id = 'noResults';
                    noResultsEl.className = 'no-results';
                    noResultsEl.textContent = '未找到匹配的接口';
                    tocContainer.appendChild(noResultsEl);
                }
            } else if (noResults) {
                noResults.remove();
            }
        }
        window.addEventListener('scroll', function() {
            const sections = document.querySelectorAll('.api-section');
            let currentSection = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) currentSection = section.getAttribute('id');
            });
            updateActiveNav(currentSection);
        });
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.api-list a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    scrollToSection(targetId);
                });
            });
            document.querySelectorAll('.module-header').forEach(header => {
                const moduleName = header.closest('.module-item').dataset.module;
                header.addEventListener('click', function(e) {
                    if (e.target.classList.contains('toggle-icon')) return;
                    toggleModule(moduleName);
                });
            });
            const sections = document.querySelectorAll('.api-section');
            if (sections.length > 0) updateActiveNav(sections[0].getAttribute('id'));
            const tocHeader = document.querySelector('.sidebar h2');
            const controls = document.createElement('div');
            controls.style.marginBottom = '10px';
            controls.innerHTML = '<button onclick="toggleAllModules(true)" style="font-size:12px;padding:4px 8px;margin-right:5px;">展开全部</button><button onclick="toggleAllModules(false)" style="font-size:12px;padding:4px 8px;">折叠全部</button>';
            tocHeader.parentNode.insertBefore(controls, tocHeader.nextSibling);

        });
    <\/script>
</body>
</html>
      `;
    },
    generateTOC(groupedApis) {
      let tocHTML = '';
      let apiIndex = 0;
      Object.keys(groupedApis).forEach(moduleName => {
        const moduleApis = groupedApis[moduleName];
        tocHTML += `
      <li class="module-item" data-module="${moduleName}">
        <div class="module-header">
          <span class="toggle-icon">▼</span>
          <span class="module-name">${moduleName}</span>
          <span class="module-count">${moduleApis.length}</span>
        </div>
        <ul class="api-list">
    `;
        moduleApis.forEach(api => {
          tocHTML += `
        <li>
          <a href="#api-${apiIndex}" title="${api.description || ''}">
            ${api.name}
          </a>
        </li>
      `;
          apiIndex++;
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
      const basicInfo = [
        { label: '应用标识', value: doc.app },
        { label: '函数标识', value: doc.func },
        { label: '函数名称', value: doc.name },
        { label: '调用权限', value: doc.sign === 1 ? "MD5签名" : doc.sign === 2 ? "SHA256签名" : "开放" },
        { label: '模块标识', value: doc.service },
        { label: '模块名称', value: doc.serviceName }
      ];
      const basicInfoHTML = basicInfo.map(item => `<div class="info-item"><span class="info-label">${item.label}：</span><span>${item.value || ''}</span></div>`).join('');
      const apiUrl1 = this.generateApiUrl(doc, true);
      const apiUrl2 = this.generateApiUrl(doc, false);
      return `
    <div class="api-section" id="api-${index}">
        <h1>${doc.name}</h1>
        <p><strong>接口说明：</strong><span style="color: #7d8080">${doc.description || ''}</span></p>
        <div class="divider"></div>
        <h2>基本信息</h2>
        <div class="basic-info">${basicInfoHTML}</div>
        <div class="divider"></div>
        <h2>请求地址</h2>
        <p><strong>Local:</strong> <a href="${apiUrl1}" target="_blank">${apiUrl1}</a></p>
        <p><strong>Network:</strong> <a href="${apiUrl2}" target="_blank">${apiUrl2}</a></p>
        <div class="divider"></div>
        <h2>请求参数</h2>
        ${requestParamsTable}
        <div class="divider"></div>
        <h2>返回参数</h2>
        ${responseParamsTable}
    </div>
  `;
    },
    generateParamsTable(params, isRequest) {
      if (!params || params.length === 0) {
        return '<p>无参数</p>';
      }
      const flatParams = this.flattenParams(params);
      const headers = isRequest ? ['字段', '传参方式', '类型', '示例', '描述'] : ['字段', '类型', '示例', '描述'];
      const headerHTML = headers.map(header => `<th>${header}</th>`).join('');
      const rowsHTML = flatParams.map(param => {
        const example = param.example === null ? '' : (typeof param.example === 'object' ? JSON.stringify(param.example, null, 2) : param.example);
        return `
          <tr>
            <td>${this.nameFormatter(param)}</td>
            ${isRequest ? `<td>${this.useFormatter(param)}</td>` : ''}
            <td>${this.typeFormatter(param)}</td>
            <td><code>${example || ''}</code></td>
            <td>${param.desc || ''}</td>
          </tr>
        `;
      }).join('');
      return `
        <table>
          <thead>
            <tr>${headerHTML}</tr>
          </thead>
          <tbody>${rowsHTML}</tbody>
        </table>
      `;
    },
    flattenParams(params, level = 0, prefix = '') {
      let result = [];
      params.forEach(param => {
        const flatParam = {
          ...param,
          name: prefix + param.name,
          level: level
        };
        result.push(flatParam);
        if (param.children && param.children.length > 0) {
          result = result.concat(this.flattenParams(param.children, level + 1, prefix + '&nbsp;&nbsp;&nbsp;&nbsp;'));
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


