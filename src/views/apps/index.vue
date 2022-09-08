<template>
  <div class="dashboard-container">
    <el-row class="servicemain">
      <el-col :span="6" class="servicetree">
        <el-input
          placeholder="输入关键字进行过滤"
          v-model="filterText">
        </el-input>
        <el-tree
          class="filter-tree"
          :data="data"
          :props="defaultProps"
          check-on-click-node
          :filter-node-method="filterNode"
          @node-click="currentNode"
          ref="tree">
        </el-tree>
      </el-col>
      <el-col :span="18" class="servicedoc">
        <el-empty description="" v-show="empty===0"></el-empty>
        <div v-show="empty===2" style="padding: 22px">
          <el-descriptions title="基本信息" :column="2">
            <el-descriptions-item label="函数名称">{{ hcfunc.func }}</el-descriptions-item>
            <el-descriptions-item label="超时时间">{{ hcfunc.timeout + '秒' }}</el-descriptions-item>
            <el-descriptions-item label="最大并发">{{
                hcfunc.qps > 9999 ? '不限制' : hcfunc.qps
              }}
            </el-descriptions-item>
            <el-descriptions-item label="是否重定向">{{ hcfunc.sendRedirect ? '是' : '否' }}</el-descriptions-item>
            <el-descriptions-item label="标签">
              <el-tag v-for="(item,index) in hcfunc.tags" :key="index" size="small" style="margin-left: 3px">{{
                  item
                }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="描述信息">{{ hcfunc.description }}</el-descriptions-item>
          </el-descriptions>
          <el-tabs v-model="activeName" type="card" @tab-click="handleClick">
            <el-tab-pane label="网关Http调用" name="first">
              <el-descriptions title="调用方式" :column="1" border>
                <template slot="extra">
                  <el-button type="primary" @click="postman" size="medium">操作</el-button>
                </template>
                <el-descriptions-item label="示例1">
                  {{
                    'curl -H "Content-Type: application/json" -X POST -d @test.json /gw/invoke/' + hcfunc.appid + '/' + hcfunc.funcid
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="示例2">
                  {{
                    'curl -H "Content-Type: application/json" -X POST -d @test.json  /gw/invoke/' + hcfunc.app + '/' + hcfunc.func
                  }}
                </el-descriptions-item>
              </el-descriptions>
              <br>
              <el-descriptions title="返回数据" :column="1" direction="vertical" border>
                <el-descriptions-item label="返回类型">
                  <span v-html="typeHttp()"></span>
                </el-descriptions-item>
              </el-descriptions>
              <br>

              <el-descriptions title="调用参数" :column="1" direction="vertical">
                <el-descriptions-item label="function">
                  <el-table :data="hcfunc.parametersHttp" border style="width: 100%">
                    <el-table-column prop="name" label="参数名称" width="180">
                    </el-table-column>
                    <el-table-column prop="type" label="参数类型" width="180">
                    </el-table-column>
                    <el-table-column prop="demo" label="示例">
                    </el-table-column>
                  </el-table>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
            <el-tab-pane label="Rpc调用" name="second">
              <el-descriptions title="调用方式" :column="1" border>
                <el-descriptions-item label="示例1">
                  {{
                    'rpcTemplate.call(' + hcfunc.appid + ',' + hcfunc.funcid + ').invoke(' + hcfunc.returnType + '.class,args...)'
                  }}
                </el-descriptions-item>
                <el-descriptions-item label="示例2">
                  {{
                    'rpcTemplate.call("' + hcfunc.app + '","' + hcfunc.func + '").invoke(' + hcfunc.returnType + '.class,args...)'
                  }}
                </el-descriptions-item>
              </el-descriptions>
              <br>
              <el-descriptions title="返回数据" :column="1" direction="vertical" border>
                <el-descriptions-item label="返回类型">
                  {{ hcfunc.returnType }}
                </el-descriptions-item>
              </el-descriptions>
              <br>

              <el-descriptions title="调用参数" :column="1" direction="vertical">
                <el-descriptions-item label="function">
                  <el-table :data="hcfunc.parametersRpc" border style="width: 100%">
                    <el-table-column prop="name" label="参数名称" width="180">
                    </el-table-column>
                    <el-table-column prop="type" label="参数类型" width="180">
                    </el-table-column>
                    <el-table-column prop="demo" label="示例">
                    </el-table-column>
                  </el-table>
                </el-descriptions-item>
              </el-descriptions>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import {stree, sdoc, sapp} from "@/api/apps";
import {typeHttp, paramHttp, paramRpc} from "@/utils/hcutils";

export default {
  name: 'Apps',
  data() {
    return {
      filterText: '',
      data: [],
      activeName: 'first',
      defaultProps: {
        children: 'list',
        label: 'label'
      },
      hcfunc: {
        hcid: 0,
        func: '',
        timeout: 30,
        qps: 999999,
        tags: [],
        sendRedirect: false,
        description: '',
        paramType: [],
        paramName: [],
        parametersHttp: [],
        parametersRpc: [],
        returnType: '',
        appid: 0,
        app: '',
        funcid: 0
      },
      empty: 0
    };
  },
  watch: {
    filterText(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    typeHttp() {
      return this.hcfunc.sendRedirect ? '重定向' : ('{<br>&nbsp;&nbsp;&nbsp;&nbsp;code:0,<br>&nbsp;&nbsp;&nbsp;&nbsp;msg:"OK",' +
        '<br>&nbsp;&nbsp;&nbsp;&nbsp;data:' + typeHttp(this.hcfunc.returnType) + '<br>}')
    },
    handleClick(tab, event) {
      console.log(tab, event);
    },
    fetchData() {
      stree().then(response => {
        this.data = response.data
      });
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    currentNode(value) {
      let that = this;
      if (value.hasOwnProperty("funcid")) {
        that.empty = 2;
        sdoc({appid: value.appid, funcid: value.funcid}).then(response => {
          that.hcfunc = response.data;
          that.hcfunc.appid = value.appid;
          that.hcfunc.funcid = value.funcid;
          that.hcfunc.app = value.app;
          let parametersHttp = [];
          let parametersRpc = [];
          for (let i = 0; i < response.data.paramName.length; i++) {
            parametersHttp.push(paramHttp(response.data.paramName[i], response.data.paramType[i]))
            parametersRpc.push(paramRpc(response.data.paramName[i], response.data.paramType[i]))
          }
          that.hcfunc.parametersHttp = parametersHttp;
          that.hcfunc.parametersRpc = parametersRpc;

        });
      } else {
        that.empty = 1;
        sapp({appname: value.app}).then(response => {
          let appid = response.data.appid;
          let appname = response.data.appname;
          let alias = response.data.alias;
          let createtime = response.data.createtime;
          let updatetime = response.data.updatetime;
          let description = response.data.description;
          let creater = response.data.creater;
        });
      }
    },
    postman() {
      alert(1)
    }
  }
};
</script>

<style lang="scss" scoped>
.dashboard {
  &-container {
    margin: 15px;
  }

  &-text {
    font-size: 30px;
    line-height: 46px;
  }
}

.servicemain {
  padding: 2px;
  height: calc(90vh) !important;
  overflow: auto !important;

  .servicetree {
  }

  .servicedoc {
    height: 100%;
    background: #d2d0;
    padding: 2px;
    border-radius: 5px;
  }
}
</style>
