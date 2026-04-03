<template>
  <div class="page-shell ops-page">
    <div :class="['ops-page__grid', { 'ops-page__grid--three': !gitShow }]">
      <el-card v-if="gitShow" class="panel-card ops-page__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">Git 提交</div>
            <div class="panel-subtitle">按分支或 CommitId 快速定位需要编译的版本。</div>
          </div>
        </div>
        <el-input
          v-model="filterText"
          class="input-with-select"
          clearable
          placeholder="根据 CommitId 搜索"
          size="small"
          @clear="reset"
        >
          <el-select v-model="branch" slot="prepend" placeholder="请选择" style="width: 120px" @change="changeBranch">
            <el-option v-for="item in branchs" :key="item" :label="item" :value="item" />
          </el-select>
          <el-button slot="append" icon="el-icon-search" @click="reset" />
        </el-input>
        <div class="list-scroll ops-page__list-shell" v-loading="gitLoading" v-infinite-scroll="getGitCommitList" :infinite-scroll-disabled="disabled">
          <el-empty v-if="!gitLoading && commitList.length === 0" description="暂无提交记录" />
          <el-collapse v-else v-model="chooseCommitId" accordion @change="showBuildHis">
            <el-collapse-item v-for="commit in commitList" :key="commit.id" :name="commit.id">
              <template slot="title">
                <div class="ops-page__collapse-title">
                  <span class="ops-page__time">{{ commit.commitTime }}</span>
                  <span class="ops-page__title-text">{{ commit.commitMsg }}</span>
                </div>
              </template>
              <div class="ops-page__detail-card">
                <p><strong>CommitId：</strong>{{ commit.id }}</p>
                <p><strong>提交时间：</strong>{{ commit.commitTime }}</p>
                <p><strong>提交作者：</strong>{{ commit.author }}</p>
                <p><strong>提交信息：</strong>{{ commit.commitMsg }}</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <el-card class="panel-card ops-page__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">{{ gitShow ? '版本编译' : '部署包构建' }}</div>
            <!-- <div class="panel-subtitle">{{ gitShow ? '选择一个 Git 提交后发起构建。' : '输入可访问的发布包链接直接新建构建。' }}</div> -->
          </div>
          <!-- <div v-if="gitShow" class="panel-header__actions"> -->
            <!-- <span class="status-pill ops-page__commit-pill">{{ chooseCommitId ? `当前 Commit：${chooseCommitId}` : '请选择 Git 提交' }}</span> -->
          <!-- </div> -->

        </div>
        <div class="page-toolbar ops-page__build-toolbar">
          <div class="page-toolbar__group page-toolbar__grow">
            <div v-if="gitShow" class="section-caption ops-page__build-caption">{{ chooseCommitId ? `${chooseCommitId}` : '选择Git提交记录开始编译' }}</div>
            <el-input v-else v-model="buildUrl" clearable placeholder="请输入有效的发布包链接" size="small" />
          </div>

          <div class="page-toolbar__group">
            <el-button
              v-if="gitShow"
              :disabled="buildButton"
              size="small"
              type="success"
              icon="el-icon-video-play"
              @click="commitBuild"
            >
              编译
            </el-button>
            <el-button
              v-else
              :disabled="buildButton"
              size="small"
              type="success"
              icon="el-icon-plus"
              @click="newBuild"
            >
              新建
            </el-button>
          </div>
        </div>
        <div class="list-scroll ops-page__list-shell">
          <el-empty v-if="chooseCommitId !== '' && buildList.length === 0 && gitShow" description="该版本暂无编译历史，可直接发起编译">
            <el-button type="success" @click="commitBuild">开始编译</el-button>
          </el-empty>
          <el-empty v-else-if="chooseCommitId === '' && gitShow" description="请选择一个 Git 提交记录" />
          <el-empty v-else-if="buildList.length === 0 && !gitShow" description="暂无部署包构建记录" />
          <el-collapse v-else v-model="chooseBuildId" accordion @change="showDeployHis">
            <el-collapse-item v-for="build in buildList" :key="build.id" :name="build.id">
              <template slot="title">
                <div class="ops-page__status-line">
                  <el-tag v-if="build.start" :type="build.success ? 'success' : 'danger'" effect="dark" size="mini">
                    {{ new Date(build.start).format("yyyy-MM-dd hh:mm:ss") }}
                  </el-tag>
                  <el-tag v-if="build.start" :type="build.success ? 'success' : 'danger'" effect="dark" size="mini">{{ build.success ? '成功' : '失败' }}</el-tag>
                  <el-tag v-if="build.start" :type="build.success ? 'success' : 'danger'" effect="dark" size="mini">耗时{{ formatCostTime(build.start, build.end) }}</el-tag>
                  <el-tag v-if="!build.start" effect="dark">编译中<i class="el-icon-loading"></i></el-tag>
                </div>
              </template>
              <div class="ops-page__detail-card" :class="{ 'ops-page__detail-card--danger': build.start && !build.success }">
                <p v-if="!gitShow"><strong>来源：</strong>{{ build.from }}</p>
                <p><strong>BuildID：</strong>{{ build.id }}</p>
                <p><strong>开始时间：</strong>{{ build.start ? new Date(build.start).format("yyyy-MM-dd hh:mm:ss") : '-' }}</p>
                <p><strong>结束时间：</strong>{{ build.end ? new Date(build.end).format("yyyy-MM-dd hh:mm:ss") : '-' }}</p>
                <p><strong>执行用户：</strong>{{ build.user || '-' }}</p>
                <p v-if="build.success"><strong>制品链接：</strong><el-link :underline="false" :href="downloadUrl(build)">下载</el-link></p>
                <p><strong>制品 MD5：</strong>{{ build.md5 || '-' }}</p>
                <p><strong>执行日志：</strong><el-link :underline="false" @click="showBuildLog0(build.id)">查看</el-link></p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <el-card class="panel-card ops-page__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">制品部署</div>
            <div class="panel-subtitle">选择构建产物与目标主机后发起部署。</div>
          </div>
        </div>
        <div class="page-toolbar ops-page__build-toolbar">
          <div class="page-toolbar__group page-toolbar__grow">
            <el-select v-model="multipleSelection" multiple collapse-tags size="small" placeholder="请选择部署主机" style="width: 100%">
              <el-option v-for="item in hostData" :key="item.id" :label="item.ip + ':' + item.deploy" :value="item.id" />
            </el-select>
          </div>
          <div class="page-toolbar__group">
            <el-button :disabled="buildButton || deployButton" size="small" type="warning" icon="el-icon-upload" @click="deployApp">部署</el-button>
          </div>
        </div>
        <div v-if="multipleSelection.length" class="section-caption ops-page__host-text">已选主机：{{ selectedHostText }}</div>

        <div class="list-scroll ops-page__list-shell">
          <el-empty v-if="chooseBuildId !== '' && chooseCommitId !== '' && deployList.length === 0" description="暂无部署历史，可直接发起部署">
            <el-button type="warning" @click="deployApp">立即部署</el-button>
          </el-empty>
          <el-empty v-else-if="chooseBuildId === '' || chooseCommitId === ''" description="请选择一个构建版本" />
          <el-collapse v-else v-model="chooseDeployId" accordion>
            <el-collapse-item v-for="deploy in deployList" :key="deploy.id" :name="deploy.id">
              <template slot="title">
                <div class="ops-page__status-line">
                  <el-tag v-if="deploy.start" :type="deploy.success ? 'success' : 'danger'" effect="dark" size="mini">
                    {{ new Date(deploy.start).format("yyyy-MM-dd hh:mm:ss") }}
                  </el-tag>
                  <el-tag v-if="deploy.start" :type="deploy.success ? 'success' : 'danger'" effect="dark" size="mini">{{ deploy.success ? '成功' : '失败' }}</el-tag>
                  <el-tag v-if="deploy.start" :type="deploy.success ? 'success' : 'danger'" effect="dark" size="mini">耗时{{ formatCostTime(deploy.start, deploy.end) }}</el-tag>
                  <el-tag v-if="!deploy.start" effect="dark">部署中<i class="el-icon-loading"></i></el-tag>
                </div>
              </template>
              <div class="ops-page__detail-card" :class="{ 'ops-page__detail-card--danger': deploy.start && !deploy.success }">
                <p><strong>DeployID：</strong>{{ deploy.id }}</p>
                <p><strong>部署时间：</strong>{{ deploy.start ? new Date(deploy.start).format("yyyy-MM-dd hh:mm:ss") : '-' }}</p>
                <p><strong>结束时间：</strong>{{ deploy.end ? new Date(deploy.end).format("yyyy-MM-dd hh:mm:ss") : '-' }}</p>
                <p><strong>执行用户：</strong>{{ deploy.user || '-' }}</p>
                <p><strong>部署主机：</strong>{{ deploy.to ? deploy.to.replaceAll(';', '；') : '-' }}</p>
                <p><strong>部署日志：</strong><el-link :underline="false" @click="showDeployLog0(deploy.id)">查看</el-link></p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <el-card class="panel-card ops-page__panel ops-page__panel--log">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">{{ currentLogTitle }}</div>
            <div class="panel-subtitle">展示当前构建或部署过程中的实时日志输出。</div>
          </div>
        </div>
        <div ref="buildLogView" class="log-stream ops-page__log-shell">
          <div v-if="rpcLog.length === 0" class="muted-text">选择记录后即可在这里查看日志。</div>
          <div v-for="(item, index) in rpcLog" :key="index + '' + item.ts" class="log-stream__item ops-page__log-item" :style="{ color: levelColor[item.level] }">
            <span class="log-stream__meta ops-page__log-meta">{{ item.ts }}</span>
            <span class="ops-page__log-content">{{ '【' + logLevel[item.level] + '】' + item.content }}</span>
          </div>
        </div>

      </el-card>
    </div>
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
      showLog: false,
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
      buildUrl: ''
    };
  },
  computed: {
    selectedHostText() {
      return this.hostData
        .filter(item => this.multipleSelection.includes(item.id))
        .map(item => `${item.ip}:${item.deploy}`)
        .join('，');
    },
    currentLogTitle() {
      if (this.chooseDeployId) {
        return `部署日志 #${this.chooseDeployId}`;
      }
      if (this.chooseBuildId) {
        return `构建日志 #${this.chooseBuildId}`;
      }
      return '实时日志';
    }
  },
  mounted() {
    if (!this.app) {
      this.$router.push({ path: "/" });
      return;
    }
    request({
      url: "/admin/ops/getRemoteBranch",
      params: {}
    }).then((res) => {
      this.branchs = res.data;
      this.branch = res.msg;
      this.getGitCommitList();
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
        });
      }
    });
  },
  methods: {
    formatCostTime(start, end) {
      if (!start || !end) return '-';
      return Math.round((end - start) / 1000) + ' 秒';
    },
    downloadUrl(build) {
      return 'http://172.24.149.20/hcrinx/' + this.app + '/' + this.chooseCommitId + '/' + build.id + '.zip';
    },
    reset() {
      this.commitList = [];
      this.pageNo = 1;
      this.disabled = false;
      this.getGitCommitList();
    },
    changeBranch(newBranch) {
      request({
        url: "/admin/ops/changeBranch",
        params: { branch: newBranch }
      }).then((res) => {
        if (res.code === 0) {
          this.pageNo = 1;
          this.commitList = [];
          this.disabled = false;
          this.getGitCommitList();
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
          pageSize: this.pageSize
        }
      }).then((res) => {
        if (res.code === 1) {
          this.gitShow = false;
          if (this.chooseCommitId === '') {
            this.chooseCommitId = 'default';
            this.showBuildHis();
          }
        } else {
          this.gitShow = true;
          if (res.data.length === 0) {
            this.disabled = true;
          } else if (this.filterText.trim().length > 0 && res.data.length === 1) {
            this.commitList = [res.data[0]];
            this.pageNo = 1;
            this.disabled = true;
          } else {
            this.disabled = false;
            this.pageNo++;
            res.data.map(x => this.commitList.push(x));
          }
        }
      }).finally(() => {
        this.gitLoading = false;
      });
    },
    showBuildHis() {
      this.deployList = [];
      if (this.chooseCommitId === '') {
        this.chooseBuildId = '';
        this.buildList = [];
        return;
      }
      request({
        url: "/admin/ops/gitCommitPackageHis",
        params: {
          commitid: this.chooseCommitId
        }
      }).then((res) => {
        this.buildList = res.data;
        this.chooseBuildId = '';
      });
    },
    commitBuild() {
      if (this.chooseCommitId === '') {
        this.$message.error('请选择一个 Git 版本');
        return;
      }
      this.buildButton = true;
      request({
        url: "/admin/ops/gitCommitPackage",
        params: {
          commitid: this.chooseCommitId
        }
      }).then((res) => {
        const buildId = res.data;
        this.buildList.unshift({ id: buildId });
        const timer = setInterval(() => {
          this.showBuildLog(buildId, timer);
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
          url: this.buildUrl
        }
      }).then((res) => {
        const buildId = res.data;
        this.buildList.unshift({ id: buildId });
        const timer = setInterval(() => {
          this.showBuildLog(buildId, timer);
        }, 500);
      });
    },
    showBuildLog(buildId, timer) {
      request({
        url: "/admin/ops/getBuildLog",
        params: {
          buildId: buildId
        }
      }).then((res) => {
        this.showLog = true;
        this.rpcLog = res.data;
        if (res.code === 1) {
          clearInterval(timer);
          this.buildButton = false;
          this.showBuildHis();
        }
        this.scrollLogToBottom();
      }).catch(() => {
        clearInterval(timer);
        this.buildButton = false;
        this.showBuildHis();
      });
    },
    showBuildLog0(id) {
      const appbuild = this.buildList.find(x => x.id === id);
      if (appbuild) {
        this.rpcLog = appbuild.log || [];
      }
    },
    showDeployLog0(id) {
      const appdeploy = this.deployList.find(x => x.id === id);
      if (appdeploy) {
        this.rpcLog = appdeploy.log || [];
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
          buildid: this.chooseBuildId
        }
      }).then((res) => {
        this.deployList = res.data;
        this.chooseDeployId = '';
      });
    },
    deployApp() {
      if (this.chooseBuildId === '') {
        this.$message.error('请选择一个编译版本');
        return;
      }
      const appbuild = this.buildList.find(x => x.id === this.chooseBuildId);
      if (appbuild && !appbuild.success) {
        this.$message.error('该编译版本无部署包');
        return;
      }
      if (this.multipleSelection.length === 0) {
        this.$message.error('请至少选择一个部署主机');
        return;
      }
      this.deployButton = true;
      request({
        url: "/admin/ops/deployApp",
        params: {
          commitid: this.chooseCommitId,
          buildid: this.chooseBuildId,
          hostid: this.multipleSelection.join(',')
        }
      }).then(res => {
        if (res.code === 0) {
          const deployId = res.data;
          this.deployList.unshift({ id: deployId });
          const timer = setInterval(() => {
            this.showDeployLog(deployId, timer);
          }, 500);
        }
      });
    },
    showDeployLog(deployId, timer) {
      request({
        url: "/admin/ops/getDeployLog",
        params: {
          deployId: deployId
        }
      }).then((res) => {
        this.showLog = true;
        this.rpcLog = res.data;
        if (res.code === 1) {
          clearInterval(timer);
          this.deployButton = false;
          this.showDeployHis();
        }
        this.scrollLogToBottom();
      }).catch(() => {
        clearInterval(timer);
        this.deployButton = false;
        this.showDeployHis();
      });
    },
    scrollLogToBottom() {
      const container = this.$refs.buildLogView;
      if (container) {
        this.$nextTick(() => {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.ops-page__summary-grid {
  margin-top: 14px;
}

.ops-page {
  min-height: calc(100vh - 66px);
}

.ops-page__grid {
  display: grid;
  grid-template-columns: minmax(240px, 19%) minmax(240px, 19%) minmax(240px, 19%) minmax(0, 1fr);
  gap: 5px;
  min-height: calc(100vh - 66px);
  align-items: stretch;
}

.ops-page__grid--three {
  grid-template-columns: minmax(240px, 23%) minmax(240px, 23%) minmax(0, 1fr);
}

.ops-page__panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 66px);
  min-height: 0;
}

.ops-page__panel ::v-deep .el-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  box-sizing: border-box;
}

.ops-page__panel--log {
  min-width: 0;
}


.ops-page__commit-pill {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-page__build-toolbar {
  align-items: flex-start;
}

.ops-page__build-caption {
  margin-bottom: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-page__list-shell {
  margin-top: 10px;
  flex: 1;
  min-height: 0;
  max-height: none;
}

.ops-page__collapse-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  width: 100%;
  font-size: 12px;
}

.ops-page__time {
  color: #16a34a;
  white-space: nowrap;
  font-size: 12px;
}

.ops-page__title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-page__status-line {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.ops-page__detail-card {
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ecfdf5, #f8fafc);
  font-size: 12px;
  line-height: 1.55;
}

.ops-page__detail-card p + p {
  margin-top: 4px;
}

.ops-page__detail-card--danger {
  background: linear-gradient(180deg, #fef2f2, #fff7ed);
}

.ops-page__host-text {
  margin: 6px 0 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ops-page__log-shell {
  flex: 1;
  min-height: 0;
  max-height: none;
  padding: 8px 10px;
}

.ops-page__log-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-bottom: 3px;
}


.ops-page__log-meta {
  flex: 0 0 auto;
  margin-right: 0;
  font-size: 11px;
  line-height: 1.4;
}

.ops-page__log-content {
  min-width: 0;
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
}

@media (max-width: 1680px) {
  .ops-page,
  .ops-page__grid {
    min-height: auto;
  }

  .ops-page__grid,
  .ops-page__grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ops-page__panel {
    height: auto;
    min-height: calc(100vh - 220px);
  }

  .ops-page__list-shell {
    min-height: 380px;
    max-height: calc(100vh - 300px);
  }

  .ops-page__log-shell {
    min-height: calc(100vh - 280px);
    max-height: calc(100vh - 280px);
  }
}

@media (max-width: 992px) {
  .ops-page__grid,
  .ops-page__grid--three {
    grid-template-columns: 1fr;
  }

  .ops-page__build-caption,
  .ops-page__host-text {
    white-space: normal;
  }
}

</style>

