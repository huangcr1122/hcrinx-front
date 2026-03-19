<template>
  <div>
    <div ref="topologyChart" style="height: 91vh;background: #d3dce6;margin: 11px"></div>
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
      data: [],
      links: [],
      index: 0,
    };
  },
  mounted() {
    request({
      url: "/admin/home/getTopology",
      params: {},
    }).then((res) => {
      this.data = res.data.data.map(x => {
        x.id = x.app + "." + x.appip + "." + x.processid;
        x.uptime = new Date(x.uptime).format('yyyy-MM-dd hh:mm:ss');
        x.memory = x.memory / 1024 / 1024 / 1024;
        x.heap = x.heap / 1024 / 1024 / 1024;
        x.memory = x.memory.toFixed(1);
        x.heap = x.heap.toFixed(1);
        x.symbolSize = 77;
        if (x.app === 'router') {
          x.itemStyle = {color: '#fff'};
          x.connecttime = '';
        } else if (x.app === 'admin') {
          x.itemStyle = {color: '#dacbcb'};
          x.connecttime = new Date(x.connecttime).format('yyyy-MM-dd hh:mm:ss');
        } else {
          const colorPalette = ['#61ef86', '#FF6B6B', '#4ECDC4', '#b28f43',
            '#f150fd', '#118AB2', '#7eb49c', '#f3e6a6',
            '#01f7ff', '#4a5fff', '#b8fd50', '#f58263',
            '#95c277', '#aa48ec', '#4fa3e7', '#fff157'];
          const randomIndex = (7 * x.app.length + 17 * x.name.length) % colorPalette.length;
          x.itemStyle = {color: colorPalette[randomIndex]}
          x.connecttime = new Date(x.connecttime).format('yyyy-MM-dd hh:mm:ss');
        }
        return x;
      });
      this.links = res.data.links.map(x => {
        return {
          source: x.split('->')[0],
          target: x.split('->')[1],
        }
      });
      this.initChart();
    });
  },
  beforeDestroy() {
    if (this.chartInstance) {
      this.chartInstance.dispose();
    }
  },
  methods: {
    initChart() {
      this.chartInstance = echarts.init(this.$refs.topologyChart);
      let chartOption = {
        title: {text: '', left: 'center'},
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(50, 50, 50, 0.9)',
          borderColor: '#777',
          borderWidth: 1,
          textStyle: {color: '#fff', fontSize: 12, lineHeight: 11},
          formatter: (params) => {
            const nodeData = params.data;
            if (params.dataType === 'node') {
              return `<div class="custom-tooltip">
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">APP</span>:&nbsp;&nbsp;&nbsp;${nodeData.app}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">名 称</span>:&nbsp;&nbsp;&nbsp;${nodeData.name}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">IP地址</span>:&nbsp;&nbsp;&nbsp;${nodeData.appip}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">进程号</span>:&nbsp;&nbsp;&nbsp;${nodeData.processid}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">启 动</span>:&nbsp;&nbsp;&nbsp;${nodeData.uptime}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">认 证</span>:&nbsp;&nbsp;&nbsp;${nodeData.connecttime}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">CPU</span>:&nbsp;&nbsp;&nbsp;${nodeData.cpuInfo}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">核 数</span>:&nbsp;&nbsp;&nbsp;${nodeData.cpuCore + ' Core'}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">内 存</span>:&nbsp;&nbsp;&nbsp;${nodeData.memory + ' GB'}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">堆内存</span>:&nbsp;&nbsp;&nbsp;${nodeData.heap + ' GB'}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">系 统</span>:&nbsp;&nbsp;&nbsp;${nodeData.os}</p>
                <p><span style="color: #1effd6;width: 40px; display: inline-block;">JVM</span>:&nbsp;&nbsp;&nbsp;${nodeData.jvm}</p>
              </div>`;
            }
            return ``;
          },
        },
        animation: true, // 拖拽时关闭动画以获得更流畅的体验
        series: [{
          type: 'graph',
          layout: 'force', // 节点位置由数据中的 x, y 定义
          force: { // 防止节点重叠的核心配置
            preventOverlap: true,
            nodeSize: 77, // 应与节点实际大小匹配
            // 力学参数调整
            repulsion: 666,   // 较大的斥力使节点分散
            gravity: 0.01,    // 较小的重力避免过度聚集中心
            edgeLength: 300,  // 较长的边减少连线交叉
            friction: 0.7,    // 适中的摩擦系数保证平稳收敛
            // 布局优化参数
            layoutAnimation: true, // 开启动画，观察布局过程
            coolingTime: 2000      // 设置冷却时间，控制布局迭代时长
          },
          draggable: true, // 启用节点拖拽
          edgeSymbol: ['none', 'arrow'], // 单向箭头
          edgeSymbolSize: 10, // 箭头大小
          lineStyle: {color: '#aaa', width: 2, curveness: 0.2},
          data: this.data,
          links: this.links,
          label: {show: true, formatter: (params) => params.data.app + "\n" + params.data.appip + "\n" + params.data.processid},
          emphasis: {focus: 'adjacency'}
        }]
      }
      this.chartInstance.setOption(chartOption);
      this.setupChartEvents();
    },
    setupChartEvents() {
      // 监听节点拖拽结束事件，获取最终位置
      this.chartInstance.on('mouseup', (params) => {
        if (params.dataType === 'node') {
          // console.log(`节点 "${params.data.name}" 被拖动到新位置:`, params.data);
          // 此处可以添加AJAX请求，将新位置 (params.data.x, params.data.y) 保存到后端[1](@ref)
        }
      });

      // 可选：监听全局画布点击事件，点击空白处重置高亮
      this.chartInstance.getZr().on('click', (params) => {
        if (!params.target) {
          this.chartInstance.dispatchAction({type: 'downplay'});
        }
      });
    }
  }
};
</script>
