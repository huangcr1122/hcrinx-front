<template>
  <div style="padding: 0;background-color: #f1f1f1">
    <el-container style="height: 93vh; border: 1px solid #eee">
      <el-aside width="20vw" v-if="gitShow">
        <div class="HisTitle">Git提交-{{ branch }}</div>
        <el-input v-model="filterText" class="input-with-select" clearable placeholder="根据CommitId搜索" size="small" style="padding: 5px;" @clear="reset">
          <el-select v-model="branch" slot="prepend" placeholder="请选择" style="width: 99px" @change="changeBranch">
            <el-option v-for="item in branchs" :key="item" :label="item" :value="item"></el-option>
          </el-select>
          <el-button slot="append" icon="el-icon-search" @click="getGitCommitList"></el-button>
        </el-input>
        <el-collapse v-infinite-scroll="getGitCommitList" class="infinite-list" :infinite-scroll-disabled="disabled"
                     style="overflow:auto;height: 84vh;padding-left: 5px" v-loading="gitLoading" v-model="chooseCommitId" accordion @change="showBuildHis">
          <el-collapse-item v-for="(commit, index) in commitList" :key="index" :name="commit.id"
                            placement="top" size="large" style="width: 99%;padding-bottom: 1px;">
            <template slot="title">
              <span style="color: #3a8515">{{ commit.commitTime }} </span>
              <span style="white-space: nowrap;overflow: hidden;padding-left:5px;text-overflow: ellipsis;width:58%;">{{ commit.commitMsg }}</span>
            </template>
            <div style="background: #b2fff5;padding-top: 5px;padding-bottom: 5px">
              <p style="margin-left: 11px;"><span style="font-weight: bold">CommitId：</span>{{ commit.id }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">提交时间：</span>{{ commit.commitTime }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">提交作者：</span>{{ commit.author }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">提交信息：</span>{{ commit.commitMsg }}</p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-aside>
      <el-aside width="20vw" style="background: #dcdbdb">
        <div class="HisTitle">{{ gitShow ? '版本编译' : '部署包' }}</div>
        <div style="display: flex;height: 37px;padding-left: 2px;padding-top: 5px">
          <el-tooltip v-if="gitShow" class="item" effect="dark" content="仅保留最近16次构建历史" placement="bottom-start">
            <el-tag type="success" effect="dark">{{ chooseCommitId }}</el-tag>
          </el-tooltip>
          <el-button v-if="gitShow" icon="el-icon-video-play" style="margin-left: 3px;" size="mini" type="success" @click="commitBuild" :disabled="buildButton">编译
          </el-button>
          <el-input v-model="buildUrl" v-if="!gitShow" clearable placeholder="请输入有效的发布包链接" size="small"></el-input>
          <el-button v-if="!gitShow" icon="el-icon-video-play" style="margin-left: 3px;" size="mini" type="success" @click="newBuild" :disabled="buildButton">新建
          </el-button>
        </div>
        <el-empty v-if="chooseCommitId!==''&&buildList.length===0&&gitShow" description="该版本暂无编译历史记录，点击编译">
          <el-button type="success" @click="commitBuild">编译</el-button>
        </el-empty>
        <el-empty v-if="chooseCommitId===''" description="请选择一个Git提交记录"></el-empty>
        <el-collapse v-if="buildList.length>0" style="overflow:auto;height: 84vh;padding-left: 2px;margin-top: 6px" v-model="chooseBuildId" accordion @change="showDeployHis">
          <el-collapse-item v-for="(build, index) in buildList" :key="index" :name="build.id"
                            placement="top" size="large" style="width: 99%;padding-bottom: 1px;">
            <template slot="title">
              <el-tag v-if="build.start" :type="build.success?'success':'danger'" style="margin-left: 3px" effect="dark">{{ new Date(build.start).format("yyyy-MM-dd hh:mm:ss") }}
              </el-tag>
              <el-tag v-if="build.start" :type="build.success?'success':'danger'" style="margin-left: 3px" effect="dark">结果：{{ build.success ? '成功' : '失败' }}</el-tag>
              <el-tag v-if="build.start" :type="build.success?'success':'danger'" style="margin-left: 3px" effect="dark">
                耗时：{{ Math.round((build.end - build.start) / 1000) + ' 秒' }}
              </el-tag>
              <el-tag v-if="!build.start" style="margin-left: 3px" effect="dark">编译中<i class="el-icon-loading"></i></el-tag>
            </template>
            <div :style="{background: build.success?'#67c23a':'#f56c6c','padding-top': '5px','padding-bottom': '5px','line-height': '12px'}">
              <p v-if="!gitShow" style="margin-left: 11px;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;width:94%;"><span style="font-weight: bold;">来源：</span>{{
                  build.from
                }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">BuildID：</span>{{ build.id }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">开始时间：</span>{{ new Date(build.start).format("yyyy-MM-dd hh:mm:ss") }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">结束时间：</span>{{ new Date(build.end).format("yyyy-MM-dd hh:mm:ss") }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">执行用户：</span>{{ build.user }}</p>
              <p style="margin-left: 11px;" v-if="build.success"><span style="font-weight: bold">制品链接：</span>
                <el-link :underline="false" :href="'http://172.24.149.20/hcrinx/' + app + '/' + chooseCommitId + '/' + build.id + '.zip'">下载</el-link>
              </p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">制品MD5：</span>{{ build.md5 }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">执行日志：</span>
                <el-link :underline="false" @click="showBuildLog0(build.id)">查看</el-link>
              </p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-aside>
      <el-aside width="20vw">
        <div class="HisTitle">制品部署{{ (chooseCommitId === '' || chooseBuildId === '') ? '' : ('-' + chooseBuildId) }}</div>
        <div style="display: flex;height: 37px;padding-left: 2px;padding-top: 5px">
          <el-select v-model="multipleSelection" multiple collapse-tags style="width: 280px" size="small" placeholder="请选择部署主机">
            <el-option v-for="item in hostData" :key="item.id" :label="item.ip+':'+item.deploy" :value="item.id"></el-option>
          </el-select>
          <el-button icon="el-icon-video-play" style="margin-left: 3px;" size="mini" type="warning" @click="deployApp" :disabled="buildButton||deployButton">部署
          </el-button>
        </div>
        <el-empty v-if="chooseBuildId!==''&&chooseCommitId!==''&&deployList.length===0" description="暂无部署历史记录，点击部署">
          <el-button type="warning" @click="deployApp">部署</el-button>
        </el-empty>
        <el-empty v-if="chooseBuildId===''||chooseCommitId===''" description="请选择一个版本编译记录"></el-empty>
        <el-collapse v-if="chooseBuildId!==''&&deployList.length>0" style="overflow:auto;height: 87vh;margin-top: 6px;padding-left: 2px" v-model="chooseDeployId" accordion>
          <el-collapse-item v-for="(deploy, index) in deployList" :key="index" :name="deploy.id"
                            placement="top" size="large" style="width: 99%;padding-bottom: 1px;">
            <template slot="title">
              <el-tag v-if="deploy.start" :type="deploy.success?'success':'danger'" style="margin-left: 3px" effect="dark">{{ new Date(deploy.start).format("yyyy-MM-dd hh:mm:ss")
                }}
              </el-tag>
              <el-tag v-if="deploy.start" :type="deploy.success?'success':'danger'" style="margin-left: 3px" effect="dark">结果：{{ deploy.success ? '成功' : '失败' }}</el-tag>
              <el-tag v-if="deploy.start" :type="deploy.success?'success':'danger'" style="margin-left: 3px" effect="dark">
                耗时：{{ Math.round((deploy.end - deploy.start) / 1000) + ' 秒' }}
              </el-tag>
              <el-tag v-if="!deploy.start" style="margin-left: 3px" effect="dark">部署中<i class="el-icon-loading"></i></el-tag>
            </template>
            <div :style="{background: deploy.success?'#67c23a':'#f56c6c','padding-top': '5px','padding-bottom': '5px','line-height': '12px'}">
              <p style="margin-left: 11px;"><span style="font-weight: bold">DeployID：</span>{{ deploy.id }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">部署时间：</span>{{ new Date(deploy.start).format("yyyy-MM-dd hh:mm:ss") }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">结束时间：</span>{{ new Date(deploy.end).format("yyyy-MM-dd hh:mm:ss") }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">执行用户：</span>{{ deploy.user }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">部署主机：</span>{{ deploy.to ? deploy.to.replaceAll(';', '\n') : '' }}</p>
              <p style="margin-left: 11px;"><span style="font-weight: bold">部署日志：</span>
                <el-link :underline="false" @click="showDeployLog0(deploy.id)">查看</el-link>
              </p>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-aside>
      <el-container style="flex: 1; ">
        <el-main style="background:white;padding:0;">
          <ul v-if="rpcLog" style="height:89vh;overflow-y: auto;" ref="buildLogView">
            <li v-for='(item,index) in rpcLog' :key='index+""+item.ts' :style="{'line-height': '18px','white-space': 'pre-wrap','font-size': '14px',color:levelColor[item.level]}">
              <!--               {{ index }} - -->
              <span style="color: #00bcd4">{{ item.ts }}</span>
              {{ '【' + logLevel[item.level] + '】' + item.content }}
              <br>
            </li>
          </ul>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import request from "@/utils/request";
import Cookies from "js-cookie";

export default {
  name: "Ops",
  data() {
    return {
      app: Cookies.get('app'),
      commitList: [],
      buildList: [],
      deployList: [],
      pageNo: 1,
      pageSize: 20,
      filterText: '',
      chooseCommitId: '',
      chooseBuildId: '',
      chooseDeployId: '',
      disabled: false,
      rpcLog: [],
      logLevel: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'],
      levelColor: ['#9E9E9E', '#8BC34A', '#409EFF', '#E6A23C', '#ff0000'],
      gitLoading: true,
      branchs: [],
      branch: '',
      buildButton: false,
      deployButton: false,
      hostData: [],
      multipleSelection: [],
      gitShow: true,
      buildUrl: '',
    };
  },
  mounted() {
    if (!this.app) {
      this.$router.push({path: "/"});
    }
    request({
      url: "/admin/ops/getRemoteBranch",
      params: {},
    }).then((res) => {
      this.branchs = res.data;
      this.branch = res.msg;
    });
    request({
      url: "/admin/home/getAppHost",
      params: {}
    }).then(res => {
      this.hostData = [];
      if (res.code === 0) {
        res.data.map(x => {
          if (x.valid === 1) {
            this.hostData.push(x);
          }
        })
      }
    });
  },
  methods: {
    reset() {
      this.commitList = [];
      this.pageNo = 1;
      this.getGitCommitList();
    },
    changeBranch(newBranch) {
      request({
        url: "/admin/ops/changeBranch",
        params: {branch: newBranch},
      }).then((res) => {
        if (res.code === 0) {
          this.pageNo = 1;
          this.commitList = [];
          this.getGitCommitList()
        }
      });
    },
    getGitCommitList() {
      this.gitLoading = true;
      request({
        url: "/admin/ops/gitCommitCheck",
        params: {
          commitid: this.filterText,
          pageNo: this.pageNo,
          pageSize: this.pageSize,
        },
      }).then((res) => {
        this.gitLoading = false;
        if (res.code === 1) {
          this.gitShow = false;
          if (this.chooseCommitId === '') {
            this.chooseCommitId = 'default';
            this.showBuildHis();
          }
        } else {
          if (res.data.length === 0) {
            this.disabled = true;
          } else if (this.filterText.trim().length > 0 && res.data.length === 1) {
            this.commitList = [];
            this.pageNo = 1;
            this.commitList.push(res.data[0]);
            this.disabled = true;
          } else {
            this.disabled = false;
            this.pageNo++;
            res.data.map(x => this.commitList.push(x));
          }
        }
      });
    },
    showBuildHis() {
      this.deployList = [];
      if (this.chooseCommitId === '') {
        this.chooseBuildId = '';
        this.buildList = [];
        return
      }
      request({
        url: "/admin/ops/gitCommitPackageHis",
        params: {
          commitid: this.chooseCommitId,
        },
      }).then((res) => {
        this.buildList = res.data;
        this.chooseBuildId = '';
      });
    },
    commitBuild() {
      if (this.chooseCommitId === '') {
        this.$message.error('请选择一个Git版本');
        return
      }
      this.buildButton = true;
      request({
        url: "/admin/ops/gitCommitPackage",
        params: {
          commitid: this.chooseCommitId,
        },
      }).then((res) => {
        let buildId = res.data;
        this.buildList.unshift({id: buildId})
        let timer = setInterval(() => {
          this.showBuildLog(buildId, timer)
        }, 500);
      });
    },
    newBuild() {
      if (this.buildUrl === '') {
        this.$message.error('请输入有效的发布包链接');
        return;
      }
      this.buildButton = true;
      request({
        url: "/admin/ops/gitCommitPackage",
        params: {
          url: this.buildUrl,
        },
      }).then((res) => {
        let buildId = res.data;
        this.buildList.unshift({id: buildId})
        let timer = setInterval(() => {
          this.showBuildLog(buildId, timer)
        }, 500);
      });
    },
    showBuildLog(buildId, timer) {
      request({
        url: "/admin/ops/getBuildLog",
        params: {
          buildId: buildId,
        },
      }).then((res) => {
        this.showLog = true;
        this.rpcLog = res.data;
        if (res.code === 1) {
          clearInterval(timer);
          this.buildButton = false;
          this.showBuildHis();
        }
        const container = this.$refs.buildLogView;
        if (container) {
          this.$nextTick(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          })
        }
      }).catch((e) => {
        clearInterval(timer);
        this.buildButton = false;
        this.showBuildHis();
      });
    },
    showBuildLog0(id) {
      let appbuild = this.buildList.find(x => x.id === id);
      if (appbuild) {
        this.rpcLog = appbuild.log
      }
    },
    showDeployLog0(id) {
      let appdeploy = this.deployList.find(x => x.id === id);
      if (appdeploy) {
        this.rpcLog = appdeploy.log
      }
    },
    showDeployHis() {
      if (this.chooseBuildId === '') {
        this.deployList = [];
        return;
      }
      request({
        url: "/admin/ops/buildDeployHis",
        params: {
          commitid: this.chooseCommitId,
          buildid: this.chooseBuildId,
        },
      }).then((res) => {
        this.deployList = res.data;
        this.chooseDeployId = '';
      });
    },
    deployApp0() {

    },
    deployApp() {
      if (this.chooseBuildId === '') {
        this.$message.error('请选择一个编译版本');
        return
      }
      let appbuild = this.buildList.find(x => x.id === this.chooseBuildId);
      if (appbuild && !appbuild.success) {
        this.$message.error('该编译版本无部署包');
        return
      }
      if (this.multipleSelection.length === 0) {
        this.$message.error('请至少选择一个部署主机');
        return
      }
      this.deployButton = true;
      request({
        url: "/admin/ops/deployApp",
        params: {
          commitid: this.chooseCommitId,
          buildid: this.chooseBuildId,
          hostid: this.multipleSelection.join(",")
        }
      }).then(res => {
        if (res.code === 0) {
          let deployId = res.data;
          this.deployList.unshift({id: deployId})
          let timer = setInterval(() => {
            this.showDeployLog(deployId, timer)
          }, 500);
        }
      });
    },
    showDeployLog(deployId, timer) {
      request({
        url: "/admin/ops/getDeployLog",
        params: {
          deployId: deployId,
        },
      }).then((res) => {
        this.showLog = true;
        this.rpcLog = res.data;
        if (res.code === 1) {
          clearInterval(timer);
          this.deployButton = false;
          this.showDeployHis();
        }
        const container = this.$refs.buildLogView;
        if (container) {
          this.$nextTick(() => {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: 'smooth'
            });
          })
        }
      }).catch((e) => {
        clearInterval(timer);
        this.deployButton = false;
        this.showDeployHis();
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
</style>
