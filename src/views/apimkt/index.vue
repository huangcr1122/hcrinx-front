<template>
  <div class="apidoc" style="padding: 0;background-color: #f1f1f1">
    <el-container style="height: 93vh; border: 1px solid #eee">
      <el-aside width="300px">
        <div style="margin: 3px;padding: 3px; border-bottom: 1px solid #eee; background: white;">
          <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
          <el-button type="primary" size="mini" @click="exportMultipleToHTML" style="margin-left: 10px;">
            导出
          </el-button>
          <span style="font-size: 12px; color: #666; margin-left: 10px;">
            已选中 {{ selectedCount }} 个接口
          </span>
        </div>
        <el-input v-model="filterText" placeholder="输入关键字进行过滤" size="small"></el-input>
        <el-tree
          ref="tree"
          :data="data"
          :filter-node-method="filterNode"
          :props="defaultProps"
          class="filter-tree"
          show-checkbox
          node-key="func"
          highlight-current
          style="background-color: #f1f1f1"
          @node-click="apiClick"
          @check-change="handleCheckChange">
          <template #default="{ node, data }">
            <template v-if="data.sign === 2||data.sign===1">
              <div>
                <el-link :underline="false" icon="el-icon-key">{{
                    data.name
                  }}
                </el-link>
              </div>
            </template>
            <template v-else-if="data.sign === 0">
              <div>
                <el-link :underline="false" icon="el-icon-document">{{ data.name }}</el-link>
              </div>
            </template>
            <template v-else>
              <div>
                <el-link :underline="false">{{ data.name }}</el-link>
              </div>
            </template>
          </template>
        </el-tree>
      </el-aside>
      <el-container style="flex: 1; overflow-y: auto;">
        <el-main v-if="funcdoc.name" id="apiDoc" style="background:white;padding:22px 22px;">
          <h1>{{ funcdoc.name }} </h1>
          <p>接口说明：<span style="color: #7d8080">{{ funcdoc.description }}</span></p>
          <el-divider></el-divider>
          <el-descriptions style="font-size: 16px" title="基本信息">
            <el-descriptions-item label="应用标识">{{
                funcdoc.app
              }}
            </el-descriptions-item>
            <el-descriptions-item label="函数标识">{{
                funcdoc.func
              }}
            </el-descriptions-item>
            <el-descriptions-item label="函数名称">{{
                funcdoc.name
              }}
            </el-descriptions-item>
            <el-descriptions-item label="调用权限">{{
                funcdoc.sign === 1 ? "MD5签名" : funcdoc.sign === 2 ? "SHA256签名" : "开放"
              }}
            </el-descriptions-item>
            <el-descriptions-item label="模块标识">{{
                funcdoc.service
              }}
            </el-descriptions-item>
            <el-descriptions-item label="模块名称">{{
                funcdoc.serviceName
              }}
            </el-descriptions-item>
          </el-descriptions>
          <el-divider></el-divider>
          <h4>请求地址：</h4>
          <p class="httpUrl">
            - Local:
            <el-link :href="apiUrl()" :underline="false" type="primary">{{ apiUrl() }}</el-link>
            <br><br>
            - Network:
            <el-link :href="apiUrl2()" :underline="false" type="primary">{{ apiUrl2() }}</el-link>
          </p>
          <el-divider></el-divider>
          <h4 v-if="funcdoc.sign===2">签名方式(http调用)： </h4>
          <span v-if="funcdoc.sign===1"> sign = MD5($TOKEN$+unixtimestamp)+unixtimestamp</span>
          <span v-if="funcdoc.sign===2"> sign = SHA256($TOKEN$+unixtimestamp+nonce)+unixtimestamp+nonce</span>
          <el-divider v-if="funcdoc.sign===1||funcdoc.sign===2"></el-divider>
          <h4>请求参数：</h4>
          <el-table :data="requestParams" :header-cell-style="{ background: '#cccccc', color: '#000000' }" :tree-props="{ children: 'children' }" border
                    row-key="id"
                    style="width: 98%">
            <el-table-column :formatter="nameFormatter" label="字段" prop="name" width="220"></el-table-column>
            <el-table-column :formatter="useFormatter" label="传参方式" width="220"></el-table-column>
            <el-table-column :formatter="typeFormatter" label="类型" prop="type" width="220"></el-table-column>
            <el-table-column label="示例" prop="example" width="300"></el-table-column>
            <el-table-column label="描述" prop="desc"></el-table-column>
          </el-table>
          <el-divider></el-divider>
          <h4>返回参数：</h4>
          <el-table :data="responseParams" :header-cell-style="{ background: '#cccccc', color: '#000000' }" :tree-props="{ children: 'children' }" border default-expand-all
                    :indent='16' row-key="id" stripe style="width: 98%">
            <el-table-column label="字段" prop="name" width="220"></el-table-column>
            <el-table-column :formatter="typeFormatter" label="类型" prop="type" width="220"></el-table-column>
            <el-table-column label="示例" prop="example" width="300"></el-table-column>
            <el-table-column label="描述" prop="desc"></el-table-column>
          </el-table>
          <el-divider></el-divider>
        </el-main>
        <el-main v-else>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";
import {saveAs} from 'file-saver';

export default {
  name: "APIMKT",
  data() {
    return {
      app: Cookies.get('app'),
      filterText: "",
      selectAll: false,
      selectedApis: [], // 存储选中的接口
      defaultProps: {
        children: "funcList",
        label: "name",
      },
      data: [],
      depends: [],
      funcdoc: {},
      loading: false,
      requestParams: [],
      responseParams: [],
      newHash: "",
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
        "java.lang.String": "string",
      },
    };
  },
  computed: {
    selectedCount() {
      return this.selectedApis.length;
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: '/'});
    }
    this.getApiList();
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    },
  },
  methods: {
    // 处理全选/全不选
    handleSelectAll(checked) {
      if (checked) {
        // 获取所有叶子节点（接口节点）
        const leafNodes = this.getAllLeafNodes(this.data);
        this.$refs.tree.setCheckedKeys(leafNodes.map(node => node.func));
      } else {
        this.$refs.tree.setCheckedKeys([]);
      }
    },

    // 递归获取所有叶子节点
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

    // 处理复选框变化
    handleCheckChange(data, checked, indeterminate) {
      const checkedKeys = this.$refs.tree.getCheckedKeys();
      const leafNodes = this.getAllLeafNodes(this.data);

      // 更新选中的接口列表
      this.selectedApis = leafNodes.filter(node =>
        checkedKeys.includes(node.func)
      );

      // 更新全选状态
      this.selectAll = this.selectedApis.length === leafNodes.length && leafNodes.length > 0;
    },

    apiClick(index) {
      if (index.func !== undefined) {
        const role = JSON.parse(localStorage.getItem("app")).role;
        this.getApiDoc(index.func);
      }
    },
    filterNode(value, data) {
      if (!value || data.func === undefined) return true;
      return (
        data.name.indexOf(value) !== -1 ||
        data.func.indexOf(value) !== -1
      );
    },
    apiUrl() {
      let url = location.href;
      return (
        url.substring(0, url.indexOf("#")) + this.funcdoc.func
      );
    },
    apiUrl2() {
      return (
        "https://wxtest.guosen.com.cn/" + this.funcdoc.func
      );
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
    requireFormatter(index) {
      return index.required ? "是" : "否";
    },
    nameFormatter(index) {
      if (index.name.startsWith("$")) {
        return index.name.substr(3);
      }
      return index.name;
    },
    useFormatter(index) {
      if (index.name.startsWith("$A$")) {
        return "网关自动获取,不用传";
      } else if (index.name.startsWith("$I$")) {
        return "网关自动获取,不用传";
      } else if (index.name.startsWith("$U$")) {
        return "网关自动获取,不用传";
      } else if (index.name.startsWith("$H$") || index.name.startsWith("$h$")) {
        if (index.name.toLowerCase() === '$h$user-agent' || index.name.toLowerCase() === '$h$referer') {
          return "网关自动获取,不用传";
        }
        return "请求头Header参数";
      } else if (index.name.startsWith("$C$") || index.name.startsWith("$c$")) {
        return "Cookie参数";
      } else if (index.name.startsWith("$S$")) {
        return "GET/POST通用参数";
      }
      return "GET/POST通用参数";
    },
    getApiList() {
      request({
        url: "/admin/apimkt/getApiList",
        params: {},
      }).then((res) => {
        this.data = res.data;
      });
    },
    getApiDoc(func) {
      let that = this;
      that.loading = true;
      that.responseParams = [];
      that.depends = [];
      request({
        url: "/admin/apimkt/apidoc",
        params: {
          func: func
        },
      })
        .then((res) => {
          that.loading = false;
          that.funcdoc = res.data;
          let arr = that.funcdoc.fields;
          if (arr.length > 0) {
            arr = this.addTreeLevel(arr)
            that.requestParams = arr.slice(0, arr.length - 1);
            let resArr = arr[arr.length - 1];
            resArr.name = "data";
            let resCode = {
              name: "code",
              type: "int",
              desc: that.funcdoc.codeDesc ? that.funcdoc.codeDesc : "请求结果码，0：成功，-1：失败",
              example: 0,
            };
            let resMsg = {
              name: "msg",
              type: "string",
              desc: that.funcdoc.msgDesc ? that.funcdoc.msgDesc : "结果说明",
              example: "",
            };
            that.responseParams.push(resCode);
            that.responseParams.push(resMsg);
            that.responseParams.push(resArr);
          }
        })
        .catch((e) => {
          console.error(e);
        });
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

    // 导出多个接口到一个HTML文件
    async exportMultipleToHTML() {
      if (this.selectedApis.length === 0) {
        this.$message.warning('请先选择要导出的接口');
        return;
      }

      this.$message.info('正在生成文档，请稍候...');

      try {
        // 获取所有选中接口的文档详情
        const apiDocs = [];
        for (const api of this.selectedApis) {
          const doc = await this.getApiDocDetail(api.func);
          apiDocs.push(doc);
        }

        // 生成HTML内容
        const htmlContent = this.generateMultiApiHTML(apiDocs);
        const blob = new Blob([htmlContent], {type: 'text/html;charset=utf-8'});
        saveAs(blob, `${this.app + '接口文档_' + new Date().format("yyyyMMdd_hhmmss")}.html`);

        this.$message.success(`成功导出 ${apiDocs.length} 个接口文档`);
      } catch (error) {
        console.error('导出失败', error);
        this.$message.error('导出失败');
      }
    },

    // 获取接口文档详情
    getApiDocDetail(func) {
      return new Promise((resolve, reject) => {
        request({
          url: "/admin/apimkt/apidoc",
          params: {func: func}
        })
          .then(res => {
            resolve(res.data);
          })
          .catch(error => {
            reject(error);
          });
      });
    },

    // 生成多个API的HTML内容
// 生成多个API的HTML内容
    generateMultiApiHTML(apiDocs) {
      // 按照模块对接口进行分组
      const groupedApis = this.groupApisByModule(apiDocs);

      let sectionsHTML = '';
      let apiIndex = 0;

      // 生成每个模块和接口的内容
      Object.keys(groupedApis).forEach(moduleName => {
        const moduleApis = groupedApis[moduleName];

        // 生成模块标题
        sectionsHTML += `
      <div class="module-section" id="module-${this.slugify(moduleName)}">
        <h2 class="module-title">${moduleName}</h2>
    `;

        // 生成该模块下的所有接口
        moduleApis.forEach(api => {
          sectionsHTML += this.generateApiSectionHTML(api, apiIndex);
          apiIndex++;
        });

        sectionsHTML += `</div>`;
      });

      // 生成目录（按照模块分组）
      const tocHTML = this.generateTOC(groupedApis);

      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>API文档</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: "Microsoft YaHei", Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            padding: 0;
            margin: 0;
            font-size: 14px;
            display: flex;
            min-height: 100vh;
        }

        /* 左侧目录样式 */
        .sidebar {
            width: 320px;
            background: #f8f9fa;
            border-right: 1px solid #e0e0e0;
            position: fixed;
            left: 0;
            top: 0;
            overflow-y: auto;
            padding: 5px;
        }

        .sidebar h2 {
            color: #409EFF;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 16px;
        }

        /* 搜索框样式 */
        .search-box {
            margin-bottom: 15px;
        }

        .search-box input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 13px;
        }

        .search-box input:focus {
            outline: none;
            border-color: #409EFF;
            box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
        }

        /* 目录树样式 */
        .toc {
            max-height: calc(100vh - 175px);
            overflow-y: auto;
        }

        .toc ul {
            list-style: none;
            padding: 0;
        }

        .toc > ul > li {
            margin: 8px 0;
        }

        .module-item {
            margin: 10px 0;
        }

        .module-header {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 8px 10px;
            border-radius: 4px;
            transition: all 0.3s;
            user-select: none;
        }

        .module-header:hover {
            background: #e8f4ff;
        }

        .module-header .toggle-icon {
            margin-right: 6px;
            font-size: 12px;
            transition: transform 0.3s;
            color: #666;
        }

        .module-header.collapsed .toggle-icon {
            transform: rotate(-90deg);
        }

        .module-name {
            font-weight: bold;
            color: #333;
            font-size: 14px;
        }

        .module-count {
            margin-left: auto;
            background: #409EFF;
            color: white;
            border-radius: 10px;
            padding: 2px 8px;
            font-size: 12px;
        }

        .api-list {
            list-style: none;
            padding: 0;
            margin: 5px 0 5px 20px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .api-list.collapsed {
            max-height: 0;
        }

        .api-list li {
            margin: 4px 0;
        }

        .api-list a {
            color: #666;
            text-decoration: none;
            display: block;
            padding: 6px 10px 6px 20px;
            border-radius: 3px;
            transition: all 0.3s;
            font-size: 13px;
            position: relative;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .api-list a:before {
            content: "•";
            color: #409EFF;
            position: absolute;
            left: 8px;
        }

        .api-list a:hover {
            background: #e8f4ff;
            color: #409EFF;
        }

        .api-list a.active {
            background: #409EFF;
            color: white;
        }

        /* 搜索高亮 */
        .highlight {
            background-color: #ffeb3b;
            padding: 0 2px;
            border-radius: 2px;
        }

        /* 无结果提示 */
        .no-results {
            color: #999;
            font-style: italic;
            padding: 10px;
            text-align: center;
            font-size: 13px;
        }

        /* 右侧内容区域 */
        .content {
            flex: 1;
            margin-left: 320px;
            padding: 20px 40px;
            max-width: calc(100% - 320px);
        }

        .api-section {
            margin-bottom: 40px;
            padding: 25px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            scroll-margin-top: 20px;
        }

        .module-section {
            margin-bottom: 30px;
        }

        .module-title {
            color: #409EFF;
            margin: 30px 0 15px 0;
            border-left: 4px solid #409EFF;
            padding-left: 10px;
            font-size: 20px;
        }

        h1 {
            color: #409EFF;
            margin-bottom: 15px;
            border-bottom: 2px solid #409EFF;
            padding-bottom: 10px;
            font-size: 24px;
        }

        h2 {
            color: #409EFF;
            margin: 20px 0 12px 0;
            font-size: 18px;
        }

        h4 {
            color: #666;
            margin: 15px 0 8px 0;
            font-size: 15px;
        }

        .httpUrl {
            background: #f8f9fa;
            padding: 12px;
            border-left: 3px solid #409EFF;
            margin: 10px 0;
            font-family: monospace;
            font-size: 14px;
            border-radius: 3px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 13px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
            white-space: pre-wrap;
        }

        th {
            background-color: #f5f7fa;
            font-weight: bold;
            color: #333;
        }

        tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .divider {
            height: 1px;
            background: #e8e8e8;
            margin: 20px 0;
        }

        a {
            color: #409EFF;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .basic-info {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 12px;
            margin: 15px 0;
        }

        .info-item {
            display: flex;
            align-items: center;
        }

        .info-label {
            font-weight: bold;
            min-width: 100px;
            color: #666;
        }

        .back-to-top {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #409EFF;
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            font-size: 20px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            transition: all 0.3s;
            z-index: 1000;
        }

        .back-to-top:hover {
            background: #66b1ff;
            transform: translateY(-2px);
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
                border-right: none;
                border-bottom: 1px solid #e0e0e0;
            }

            .content {
                margin-left: 0;
                max-width: 100%;
            }

            body {
                flex-direction: column;
            }
        }

        @media print {
            .back-to-top, .sidebar {
                display: none;
            }

            .content {
                margin-left: 0;
                max-width: 100%;
                padding: 0;
            }

            .api-section {
                page-break-inside: avoid;
            }
        }

        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
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
        // 存储所有API数据用于搜索
        const apiData = ${JSON.stringify(apiDocs.map((doc, index) => ({
        id: index,
        name: doc.name,
        module: doc.serviceName || '未分类模块',
        description: doc.description || ''
      })))};

        // 模块折叠状态
        const moduleStates = {};

        // 初始化模块状态（默认展开）
        Object.keys(apiData.reduce((acc, api) => {
          acc[api.module] = true;
          return acc;
        }, {})).forEach(module => {
          moduleStates[module] = true;
        });

        // 平滑滚动到指定章节
        function scrollToSection(sectionId) {
            const target = document.getElementById(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                // 更新活跃状态
                updateActiveNav(sectionId);
            }
        }

        // 滚动到顶部
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 更新活跃的导航项
        function updateActiveNav(activeId) {
            document.querySelectorAll('.api-list a').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + activeId) {
                    link.classList.add('active');
                }
            });
        }

        // 切换模块折叠状态
        function toggleModule(moduleName) {
            const moduleElement = document.querySelector(\`[data-module="\${moduleName}"]\`);
            const apiList = moduleElement.querySelector('.api-list');
            const toggleIcon = moduleElement.querySelector('.toggle-icon');
            const moduleHeader = moduleElement.querySelector('.module-header');

            moduleStates[moduleName] = !moduleStates[moduleName];

            if (moduleStates[moduleName]) {
                apiList.classList.remove('collapsed');
                moduleHeader.classList.remove('collapsed');
            } else {
                apiList.classList.add('collapsed');
                moduleHeader.classList.add('collapsed');
            }
        }

        // 折叠/展开所有模块
        function toggleAllModules(expand) {
            Object.keys(moduleStates).forEach(moduleName => {
                moduleStates[moduleName] = expand;
                const moduleElement = document.querySelector(\`[data-module="\${moduleName}"]\`);
                if (moduleElement) {
                    const apiList = moduleElement.querySelector('.api-list');
                    const moduleHeader = moduleElement.querySelector('.module-header');

                    if (expand) {
                        apiList.classList.remove('collapsed');
                        moduleHeader.classList.remove('collapsed');
                    } else {
                        apiList.classList.add('collapsed');
                        moduleHeader.classList.add('collapsed');
                    }
                }
            });
        }

        // 搜索过滤API
        function filterApis() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            const tocContainer = document.getElementById('tocContainer');

            if (!searchTerm) {
                // 清空搜索，显示所有
                document.querySelectorAll('.module-item, .api-list li').forEach(el => {
                    el.style.display = '';
                });
                document.querySelectorAll('.api-list a').forEach(link => {
                    link.innerHTML = link.textContent;
                });
                // 展开所有模块
                toggleAllModules(true);
                return;
            }

            let hasResults = false;

            // 隐藏所有API链接
            document.querySelectorAll('.api-list li').forEach(li => {
                li.style.display = 'none';
            });

            // 搜索匹配的API
            apiData.forEach(api => {
                const apiName = api.name.toLowerCase();
                const apiDesc = api.description.toLowerCase();

                if (apiName.includes(searchTerm) || apiDesc.includes(searchTerm)) {
                    const apiLink = document.querySelector(\`a[href="#api-\${api.id}"]\`);
                    if (apiLink) {
                        const li = apiLink.closest('li');
                        li.style.display = '';

                        // 高亮匹配的文本
                        const originalText = api.name;
                        const regex = new RegExp(\`(\${searchTerm.replace(/[.*+?^$\\{}()|[\]\\]/g, '\\\\$&')})\`, 'gi');
                        apiLink.innerHTML = originalText.replace(regex, '<span class="highlight">$1</span>');

                        // 展开父模块
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

            // 显示/隐藏模块
            document.querySelectorAll('.module-item').forEach(module => {
                const visibleApis = module.querySelectorAll('.api-list li[style=""]');
                if (visibleApis.length > 0) {
                    module.style.display = '';
                } else {
                    module.style.display = 'none';
                }
            });

            // 显示无结果提示
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

        // 监听滚动事件，自动高亮当前章节
        window.addEventListener('scroll', function() {
            const sections = document.querySelectorAll('.api-section');
            let currentSection = '';

            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) {
                    currentSection = section.getAttribute('id');
                }
            });
            updateActiveNav(currentSection);
        });

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            // 为所有目录链接添加点击事件
            document.querySelectorAll('.api-list a').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href').substring(1);
                    scrollToSection(targetId);
                });
            });

            // 为所有模块标题添加点击事件（折叠/展开）
            document.querySelectorAll('.module-header').forEach(header => {
                const moduleName = header.closest('.module-item').dataset.module;
                header.addEventListener('click', function(e) {
                    if (e.target.classList.contains('toggle-icon')) return;
                    toggleModule(moduleName);
                });
            });

            // 初始高亮第一个章节
            const sections = document.querySelectorAll('.api-section');
            if (sections.length > 0) {
                updateActiveNav(sections[0].getAttribute('id'));
            }

            // 添加折叠/展开所有按钮
            const tocHeader = document.querySelector('.sidebar h2');
            const controls = document.createElement('div');
            controls.style.marginBottom = '10px';
            controls.innerHTML = \`
                <button onclick="toggleAllModules(true)" style="font-size:12px;padding:4px 8px;margin-right:5px;">展开全部</button>
                <button onclick="toggleAllModules(false)" style="font-size:12px;padding:4px 8px;">折叠全部</button>
            \`;
            tocHeader.parentNode.insertBefore(controls, tocHeader.nextSibling);
        });
    <\/script>
</body>
</html>
      `;
    },

// 生成目录（按照模块分组）
    generateTOC(groupedApis) {
      let tocHTML = '';
      let apiIndex = 0;

      Object.keys(groupedApis).forEach(moduleName => {
        const moduleApis = groupedApis[moduleName];
        const moduleSlug = this.slugify(moduleName);

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
// 生成URL友好的slug
    slugify(text) {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // 空格替换为连字符
        .replace(/[^\w\-]+/g, '')       // 移除所有非单词字符
        .replace(/\-\-+/g, '-')         // 将多个连字符替换为单个
        .replace(/^-+/, '')             // 移除开头的连字符
        .replace(/-+$/, '');            // 移除结尾的连字符
    },
// 按照模块对接口进行分组
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
    // 生成单个API部分的HTML
    generateApiSectionHTML(doc, index) {
      let requestParamsTable = this.generateParamsTable(doc.fields ?
        doc.fields.slice(0, doc.fields.length - 1) : [], true);

      // 生成返回参数表格
      let responseParamsTable = '';
      if (doc.fields && doc.fields.length > 0) {
        const resArr = doc.fields[doc.fields.length - 1];
        const responseParams = [
          {name: 'code', type: 'int', example: 0, desc: doc.codeDesc ? doc.codeDesc : '请求结果码，0：成功，-1：失败'},
          {name: 'msg', type: 'string', example: '', desc: doc.msgDesc ? doc.msgDesc : '结果说明'},
          {...resArr, name: 'data'}
        ];
        responseParamsTable = this.generateParamsTable(responseParams, false);
      }

      // 基本信息
      const basicInfo = [
        {label: '应用标识', value: doc.app},
        {label: '函数标识', value: doc.func},
        {label: '函数名称', value: doc.name},
        {label: '调用权限', value: doc.sign === 1 ? "MD5签名" : doc.sign === 2 ? "SHA256签名" : "开放"},
        {label: '模块标识', value: doc.service},
        {label: '模块名称', value: doc.serviceName}
      ];

      const basicInfoHTML = basicInfo.map(item =>
        `<div class="info-item">
        <span class="info-label">${item.label}：</span>
        <span>${item.value || ''}</span>
    </div>`
      ).join('');

      // 请求地址
      const apiUrl1 = this.generateApiUrl(doc, true);
      const apiUrl2 = this.generateApiUrl(doc, false);

      return `
    <div class="api-section" id="api-${index}">
        <h1>${doc.name}</h1>
        <p><strong>接口说明：</strong><span style="color: #7d8080">${doc.description || ''}</span></p>
        <div class="divider"></div>

        <h2>基本信息</h2>
        <div class="basic-info">
            ${basicInfoHTML}
        </div>

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
    // 生成参数表格
    generateParamsTable(params, isRequest) {
      if (!params || params.length === 0) {
        return '<p>无参数</p>';
      }
      // 扁平化树形结构
      const flatParams = this.flattenParams(params);
      const headers = isRequest ?
        ['字段', '传参方式', '类型', '示例', '描述'] :
        ['字段', '类型', '示例', '描述'];
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
    // 扁平化参数树
    flattenParams(params, level = 0, prefix = '') {
      let result = [];
      const indent = '&nbsp;'.repeat(level * 4);
      params.forEach(param => {
        const flatParam = {
          ...param,
          name: prefix + param.name,
          level: level
        };
        result.push(flatParam);
        if (param.children && param.children.length > 0) {
          result = result.concat(this.flattenParams(
            param.children, level + 1, prefix + '&nbsp;&nbsp;&nbsp;&nbsp;'
          ));
        }
      });
      return result;
    },
    // 生成API地址
    generateApiUrl(doc, isLocal) {
      if (isLocal) {
        let url = window.location.href;
        return url.substring(0, url.indexOf("#")) + doc.func;
      } else {
        return "https://wxtest.guosen.com.cn/" + doc.func;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.apidoc {
  padding: 66px;
  background: white;
}

.httpUrl {
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
  border-radius: 11px;
  background-color: #000000;
  color: #ffffff;
  font-size: 16px;
}

::v-deep .el-table .el-table__cell {
  padding: 5px 0;
}

::v-deep .el-table .el-table__expand-icon {
  width: 10px;
}
</style>
