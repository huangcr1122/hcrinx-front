<template>
  <div class="page-shell topology-page" v-loading="loading" element-loading-text="正在加载拓扑数据...">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">应用拓扑</div>
        <div class="page-header__desc">查看全局应用节点、连接关系与运行状态，支持拖拽聚焦、悬浮查看资源信息和空白区域取消高亮。</div>
      </div>
      <div class="page-header__actions">
        <span class="page-header__hint">{{ lastUpdatedText }}</span>
        <el-button size="small" type="primary" icon="el-icon-refresh-right" @click="fetchTopology">刷新拓扑视图</el-button>
      </div>
    </div>

    <div class="summary-grid topology-summary">

        <div v-for="item in summaryCards" :key="item.label" class="summary-item">
          <div class="summary-item__label">{{ item.label }}</div>
          <div class="summary-item__value">{{ item.value }}</div>
          <div class="summary-item__meta">{{ item.meta }}</div>
        </div>
      </div>

    <div class="legend-list">
      <div v-for="item in legendItems" :key="item.label" class="legend-item">
        <span class="legend-item__dot" :style="{ background: item.color }"></span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <el-card shadow="never" class="panel-card topology-card">

      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">实例关系图</div>
          <div class="panel-subtitle">节点标签展示应用、实例地址与进程号，悬浮可查看 CPU、内存、启动时间与认证状态。</div>
        </div>
        <span class="status-pill">{{ hasTopology ? `已加载 ${data.length} 个节点` : '暂无拓扑数据' }}</span>
      </div>

      <div v-if="hasTopology" ref="topologyChart" class="topology-chart"></div>
      <div v-else class="page-empty page-empty--soft topology-page__empty">
        <div class="page-empty__title">暂无可展示的拓扑实例</div>
        <div class="page-empty__desc">当前未获取到应用实例或连接关系，请确认服务已启动后重新刷新拓扑视图。</div>
        <div class="page-empty__actions">
          <el-button size="small" type="primary" plain @click="fetchTopology">重新加载</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import request from "@/utils/request";

export default {
  name: 'DraggableTopology',
  data() {
    return {
      chartInstance: null,
      loading: false,
      lastUpdatedAt: '',
      data: [],
      links: [],
    };
  },
  computed: {
    hasTopology() {
      return this.data.length > 0;
    },
    uniqueAppCount() {
      return new Set(this.data.map(item => item.app)).size;
    },
    serviceNodeCount() {
      return this.data.filter(item => item.app !== 'router' && item.app !== 'admin').length;
    },
    lastUpdatedText() {
      return this.lastUpdatedAt ? `最近同步 ${this.lastUpdatedAt}` : '支持拖拽节点查看实例关系';
    },
    summaryCards() {
      return [
        { label: '拓扑节点', value: this.data.length, meta: '包含网关、管理端与业务实例' },
        { label: '连接关系', value: this.links.length, meta: '按实例上下游关系绘制箭头连接' },
        { label: '应用数量', value: this.uniqueAppCount, meta: '按 APP 名称聚合计算' },
        { label: '业务实例', value: this.serviceNodeCount, meta: '已剔除 router 与 admin 基础节点' },
      ];
    },
    legendItems() {
      return [
        { label: 'Router 网关', color: '#e2e8f0' },
        { label: 'Admin 管理端', color: '#c7d2fe' },
        { label: '业务服务实例', color: '#61ef86' },
      ];
    },
  },
  mounted() {
    this.fetchTopology();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  },
  methods: {
    handleResize() {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    },
    formatDateTime(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '--';
      if (typeof date.format === 'function') {
        return date.format('yyyy-MM-dd hh:mm:ss');
      }
      const pad = (num) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    formatNumberToGB(value) {
      const number = Number(value);
      if (Number.isNaN(number) || !number) return '0.0';
      return (number / 1024 / 1024 / 1024).toFixed(1);
    },
    fetchTopology() {
      this.loading = true;
      request({
        url: "/admin/home/getTopology",
        params: {},
      }).then((res) => {
        const nodeList = (res.data && res.data.data) || [];
        const linkList = (res.data && res.data.links) || [];
        this.data = nodeList.map((item, index) => {
          const node = {...item};
          node.id = `${node.app}.${node.appip}.${node.processid}`;
          node.uptime = this.formatDateTime(node.uptime);
          node.memory = this.formatNumberToGB(node.memory);
          node.heap = this.formatNumberToGB(node.heap);
          node.symbolSize = 77;
          if (node.app === 'router') {
            node.itemStyle = {color: '#e2e8f0'};
            node.connecttime = '--';
            node.symbolSize = 84;
          } else if (node.app === 'admin') {
            node.itemStyle = {color: '#c7d2fe'};
            node.connecttime = this.formatDateTime(node.connecttime);
            node.symbolSize = 80;
          } else {
            const colorPalette = ['#61ef86', '#FF6B6B', '#4ECDC4', '#b28f43', '#f150fd', '#118AB2', '#7eb49c', '#f3e6a6', '#01f7ff', '#4a5fff', '#b8fd50', '#f58263', '#95c277', '#aa48ec', '#4fa3e7', '#fff157'];
            const randomIndex = (7 * node.app.length + 17 * ((node.name || '').length + index)) % colorPalette.length;
            node.itemStyle = {color: colorPalette[randomIndex]};
            node.connecttime = this.formatDateTime(node.connecttime);
          }
          return node;
        });
        this.links = linkList.map(item => ({
          source: item.split('->')[0],
          target: item.split('->')[1],
        }));
        this.lastUpdatedAt = this.formatDateTime(new Date());
      }).catch(() => {
        this.data = [];
        this.links = [];
        this.$message.error('拓扑数据加载失败');
      }).finally(() => {
        this.loading = false;
        this.$nextTick(() => {
          if (this.hasTopology) {
            this.initChart();
          } else if (this.chartInstance) {
            this.chartInstance.clear();
          }
        });
      });
    },
    initChart() {
      if (!this.$refs.topologyChart) return;
      if (!this.chartInstance) {
        this.chartInstance = echarts.init(this.$refs.topologyChart);
      }
      const chartOption = {
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          borderColor: 'rgba(148, 163, 184, 0.4)',
          borderWidth: 1,
          textStyle: {color: '#fff', fontSize: 12, lineHeight: 16},
          formatter: (params) => {
            const nodeData = params.data || {};
            if (params.dataType === 'node') {
              return `<div class="custom-tooltip">
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">APP</span>: ${nodeData.app || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">名称</span>: ${nodeData.name || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">IP地址</span>: ${nodeData.appip || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">进程号</span>: ${nodeData.processid || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">启动</span>: ${nodeData.uptime || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">认证</span>: ${nodeData.connecttime || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">CPU</span>: ${nodeData.cpuInfo || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">核心</span>: ${nodeData.cpuCore || '--'} Core</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">内存</span>: ${nodeData.memory || '--'} GB</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">堆内存</span>: ${nodeData.heap || '--'} GB</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">系统</span>: ${nodeData.os || '--'}</p>
                <p><span style="color: #67e8f9;width: 46px; display: inline-block;">JVM</span>: ${nodeData.jvm || '--'}</p>
              </div>`;
            }
            return '';
          },
        },
        series: [{
          type: 'graph',
          layout: 'force',
          force: {
            preventOverlap: true,
            nodeSize: 77,
            repulsion: 666,
            gravity: 0.01,
            edgeLength: 300,
            friction: 0.7,
            layoutAnimation: true,
            coolingTime: 2000,
          },
          draggable: true,
          roam: true,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 10,
          lineStyle: {color: 'rgba(100, 116, 139, 0.55)', width: 2, curveness: 0.2},
          data: this.data,
          links: this.links,
          label: {
            show: true,
            formatter: (params) => `${params.data.app}\n${params.data.appip}\n${params.data.processid}`,
            color: '#0f172a',
          },
          emphasis: {focus: 'adjacency'}
        }]
      };
      this.chartInstance.setOption(chartOption, true);
      this.setupChartEvents();
      this.handleResize();
    },
    setupChartEvents() {
      if (!this.chartInstance) return;
      this.chartInstance.off('mouseup');
      this.chartInstance.getZr().off('click');
      this.chartInstance.on('mouseup', () => {});
      this.chartInstance.getZr().on('click', (params) => {
        if (!params.target) {
          this.chartInstance.dispatchAction({type: 'downplay'});
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.topology-card {
  padding: 0;
}

.topology-page__empty {
  min-height: 540px;
}

.topology-chart {
  height: calc(100vh - 280px);
  min-height: 540px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff, #edf5ff);
}

::v-deep .topology-card .el-card__body {
  padding: 16px;
}
</style>

