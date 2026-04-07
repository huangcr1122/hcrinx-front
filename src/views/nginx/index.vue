<template>
  <div class="page-shell nginx-dashboard" v-loading="loading" element-loading-text="正在加载 Nginx 入口数据...">
    <div class="page-header">
      <div class="page-header__main">
        <div class="page-header__title">Nginx 入口大盘</div>
      </div>
      <div class="page-header__actions">
        <span class="page-header__hint">{{ rangeHint }}</span>
        <span class="status-pill">{{ autoRefreshText }}</span>
        <el-button size="small" type="primary" icon="el-icon-refresh-right" @click="fetchDashboard">刷新数据</el-button>
      </div>
    </div>

    <el-card class="panel-card">
      <div class="nginx-dashboard__toolbar">
        <div class="nginx-dashboard__toolbar-grid">
          <div class="nginx-dashboard__field nginx-dashboard__field--wide">
            <div class="nginx-dashboard__field-label">时间范围</div>
            <el-date-picker
              v-model="period"
              class="nginx-dashboard__range"
              type="datetimerange"
              size="small"
              align="right"
              unlink-panels
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :picker-options="pickerOptions"
            />
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">Host 关键字</div>
            <el-input v-model.trim="filters.host" size="small" clearable placeholder="如 guosen.com" />
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">URI 关键字</div>
            <el-input v-model.trim="filters.uriKeyword" size="small" clearable placeholder="如 /api/order" />
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">请求方法</div>
            <el-select v-model="filters.method" size="small" clearable placeholder="全部方法">
              <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">统计粒度</div>
            <el-select v-model="filters.granularity" size="small" placeholder="按小时">
              <el-option v-for="item in granularityOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div v-if="filters.granularity === 'minute'" class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">分钟默认窗口</div>
            <div class="nginx-dashboard__minute-range">
              <el-button size="small" :type="minuteQuickRange === 1 ? 'primary' : 'default'" @click="handleMinuteQuickRangeChange(1)">最近 1 小时</el-button>
              <el-button size="small" :type="minuteQuickRange === 6 ? 'primary' : 'default'" @click="handleMinuteQuickRangeChange(6)">最近 6 小时</el-button>
            </div>
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">状态范围</div>
            <el-select v-model="filters.statusType" size="small" placeholder="全部状态">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">慢请求阈值</div>
            <el-select v-model="filters.slowThreshold" size="small" placeholder="1s">
              <el-option v-for="item in slowThresholdOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>

          <div class="nginx-dashboard__field">
            <div class="nginx-dashboard__field-label">自动刷新</div>
            <el-select v-model="filters.autoRefresh" size="small" placeholder="关闭" @change="handleAutoRefreshChange">
              <el-option v-for="item in autoRefreshOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
        </div>

        <div class="nginx-dashboard__toolbar-footer">
          <div class="nginx-dashboard__preset-wrap">
            <span class="nginx-dashboard__preset-label">快捷视角</span>
            <el-button-group class="nginx-dashboard__preset-group">
              <el-button
                v-for="item in presetOptions"
                :key="item.value"
                size="mini"
                :type="activePreset === item.value ? 'primary' : 'default'"
                @click="applyPreset(item.value)"
              >
                {{ item.label }}
              </el-button>
            </el-button-group>
            <span class="muted-text">图表遵循 Host / URI / 方法 / 状态范围过滤，异常 / 慢请求明细分 Tab 展示，各 Tab 最多 100 条。</span>
          </div>
          <div class="nginx-dashboard__toolbar-actions">
            <el-button size="small" @click="resetFilter">重置</el-button>
            <el-button size="small" type="primary" icon="el-icon-search" @click="fetchDashboard">查询</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <div class="summary-grid nginx-dashboard__summary">
      <div v-for="item in summaryCards" :key="item.label" class="summary-item">
        <div class="summary-item__label">{{ item.label }}</div>
        <div class="summary-item__value">{{ item.value }}</div>
        <div class="summary-item__meta">{{ item.meta }}</div>
      </div>
    </div>

    <div class="nginx-dashboard__overview-grid">
      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">关键洞察</div>
            <div class="panel-subtitle">帮助快速判断当前入口流量的峰值、热点与风险焦点。</div>
          </div>
        </div>
        <div class="nginx-dashboard__insight-grid">
          <div v-for="item in insightCards" :key="item.label" class="nginx-dashboard__insight-item">
            <div class="nginx-dashboard__insight-label">{{ item.label }}</div>
            <div class="nginx-dashboard__insight-value">{{ item.value }}</div>
            <div class="nginx-dashboard__insight-tip">{{ item.tip }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="panel-card">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">当前视角配置</div>
            <div class="panel-subtitle">保留灵活查看能力，便于按场景切换排查视角。</div>
          </div>
        </div>
        <div class="nginx-dashboard__tag-list">
          <el-tag v-for="item in filterTags" :key="item.label" size="mini" effect="plain" :type="item.type">{{ item.label }}：{{ item.value }}</el-tag>
        </div>
        <div class="nginx-dashboard__metric-grid">
          <div v-for="item in qualityMetrics" :key="item.label" class="nginx-dashboard__metric-card">
            <div class="nginx-dashboard__metric-label">{{ item.label }}</div>
            <div class="nginx-dashboard__metric-value">{{ item.value }}</div>
            <div class="nginx-dashboard__metric-tip">{{ item.tip }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="nginx-dashboard__grid">
      <el-card class="panel-card nginx-dashboard__panel nginx-dashboard__panel--wide">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">请求趋势 / 质量趋势</div>
            <div class="panel-subtitle">按{{ granularityText(filters.granularity) }}查看请求总量、4xx / 5xx / 慢请求与平均耗时变化。</div>
          </div>
        </div>
        <div ref="trendChart" class="nginx-dashboard__chart nginx-dashboard__chart--large"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">请求方法分布</div>
            <div class="panel-subtitle">观察 GET / POST 等调用结构。</div>
          </div>
        </div>
        <div ref="methodChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">状态码分布</div>
            <div class="panel-subtitle">识别 2xx/3xx/4xx/5xx 的占比变化。</div>
          </div>
        </div>
        <div ref="statusChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel nginx-dashboard__panel--wide">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">热门 URI Top 10</div>
            <div class="panel-subtitle">按命中量聚合，同时保留平均耗时帮助识别高频入口。</div>
          </div>
        </div>
        <div ref="uriChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel nginx-dashboard__panel--wide">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">风险 URI Top 10</div>
            <div class="panel-subtitle">聚焦异常或慢请求命中的 URI，便于快速缩小排查范围。</div>
          </div>
        </div>
        <div ref="issueUriChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">Upstream Top 10</div>
            <div class="panel-subtitle">识别上游依赖热点及平均响应耗时。</div>
          </div>
        </div>
        <div ref="upstreamChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">Host Top 10</div>
            <div class="panel-subtitle">查看域名维度的流量分布。</div>
          </div>
        </div>
        <div ref="hostChart" class="nginx-dashboard__chart"></div>
      </el-card>

      <el-card class="panel-card nginx-dashboard__panel">
        <div class="panel-header">
          <div class="panel-header__main">
            <div class="panel-title">来源 IP Top 10</div>
            <div class="panel-subtitle">观察高频来源地址与访问聚集情况。</div>
          </div>
        </div>
        <div ref="ipChart" class="nginx-dashboard__chart"></div>
      </el-card>
    </div>

    <el-card class="panel-card nginx-dashboard__table-panel">
      <div class="panel-header">
        <div class="panel-header__main">
          <div class="panel-title">{{ recentTitle }}</div>
          <div class="panel-subtitle">{{ recentSubtitle }}</div>
        </div>
        <div class="panel-header__actions muted-text">展示 {{ filteredRecentList.length }} / {{ activeRecentRawList.length }} 条</div>
      </div>
      <el-tabs v-model="recentActiveTab" class="nginx-dashboard__recent-tabs">
        <el-tab-pane :label="`异常明细（${recentErrorRawList.length}）`" name="error" />
        <el-tab-pane :label="`慢请求明细（${recentSlowRawList.length}）`" name="slow" />
      </el-tabs>
      <div class="nginx-dashboard__table-toolbar">
        <el-input
          v-model.trim="recentKeyword"
          size="small"
          clearable
          prefix-icon="el-icon-search"
          class="nginx-dashboard__table-search"
          placeholder="筛选当前表格中的 Host / URI / 来源 IP / Upstream"
        />
      </div>
      <el-table :data="filteredRecentList" stripe size="mini" class="nginx-dashboard__table">
        <el-table-column label="时间" prop="ts" width="156" sortable />
        <el-table-column label="标记" width="118">
          <template slot-scope="scope">
            <div class="nginx-dashboard__tag-stack">
              <el-tag v-for="item in buildRowTags(scope.row)" :key="item.text" size="mini" :type="item.type">{{ item.text }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="方法" width="74">
          <template slot-scope="scope">
            <el-tag size="mini" type="info">{{ scope.row.method || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态码" width="88" sortable>
          <template slot-scope="scope">
            <el-tag size="mini" :type="statusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Host" prop="host" min-width="160" show-overflow-tooltip />
        <el-table-column label="请求路径" prop="requestUri" min-width="300" show-overflow-tooltip />
        <el-table-column label="请求耗时(s)" prop="requestTime" width="110" sortable>
          <template slot-scope="scope">
            <span :class="requestTimeClass(scope.row.requestTime)">{{ formatSeconds(scope.row.requestTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上游耗时(s)" prop="upstreamTime" width="110" sortable>
          <template slot-scope="scope">
            <span class="nginx-dashboard__upstream-time">{{ formatSeconds(scope.row.upstreamTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="来源 IP" prop="remoteAddr" min-width="128" show-overflow-tooltip />
        <el-table-column label="Upstream" prop="upstreamAddr" min-width="150" show-overflow-tooltip />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts';
import request from '@/utils/request';

const DEFAULT_SLOW_THRESHOLD = 1;

const createDefaultFilters = () => ({
  host: '',
  uriKeyword: '',
  method: '',
  granularity: 'hour',
  statusType: 'all',
  slowThreshold: DEFAULT_SLOW_THRESHOLD,
  autoRefresh: 0
});

export default {
  name: 'NginxDashboard',
  data() {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 3600 * 1000);
    return {
      loading: false,
      period: [start, end],
      filters: createDefaultFilters(),
      recentKeyword: '',
      recentActiveTab: 'error',
      activePreset: 'overview',
      minuteQuickRange: 1,
      autoRefreshTimer: null,
      pickerOptions: {
        shortcuts: [
          {
            text: '最近 15 分钟',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 15 * 60 * 1000), endTime]);
            }
          },
          {
            text: '最近 1 小时',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 3600 * 1000), endTime]);
            }
          },
          {
            text: '最近 6 小时',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 6 * 3600 * 1000), endTime]);
            }
          },
          {
            text: '最近 24 小时',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 24 * 3600 * 1000), endTime]);
            }
          },
          {
            text: '最近 3 天',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 3 * 24 * 3600 * 1000), endTime]);
            }
          },
          {
            text: '最近 7 天',
            onClick: picker => {
              const endTime = new Date();
              picker.$emit('pick', [new Date(endTime.getTime() - 7 * 24 * 3600 * 1000), endTime]);
            }
          }
        ]
      },
      methodOptions: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' },
        { label: 'PATCH', value: 'PATCH' },
        { label: 'OPTIONS', value: 'OPTIONS' }
      ],
      granularityOptions: [
        { label: '按小时', value: 'hour' },
        { label: '按分钟', value: 'minute' }
      ],
      statusOptions: [
        { label: '全部状态', value: 'all' },
        { label: '2xx', value: '2xx' },
        { label: '3xx', value: '3xx' },
        { label: '4xx', value: '4xx' },
        { label: '5xx', value: '5xx' },
        { label: '4xx + 5xx', value: 'error' }
      ],
      slowThresholdOptions: [
        { label: '0.2 秒', value: 0.2 },
        { label: '0.5 秒', value: 0.5 },
        { label: '1 秒', value: 1 },
        { label: '2 秒', value: 2 },
        { label: '3 秒', value: 3 },
        { label: '5 秒', value: 5 }
      ],
      autoRefreshOptions: [
        { label: '关闭', value: 0 },
        { label: '30 秒', value: 30 },
        { label: '60 秒', value: 60 },
        { label: '5 分钟', value: 300 }
      ],
      presetOptions: [
        { label: '全量总览', value: 'overview' },
        { label: '异常观察', value: 'issue' },
        { label: '慢请求', value: 'slow' },
        { label: '5xx 排查', value: '5xx' }
      ],
      dashboard: {
        summary: {},
        trend: [],
        methods: [],
        statuses: [],
        uriTop: [],
        issueUriTop: [],
        hostTop: [],
        ipTop: [],
        upstreamTop: [],
        recentError: [],
        recentSlow: []
      }
    };
  },
  computed: {
    durationSeconds() {
      if (!this.period || !this.period[0] || !this.period[1]) {
        return 0;
      }
      const duration = Math.floor((this.period[1].getTime() - this.period[0].getTime()) / 1000);
      return duration > 0 ? duration : 0;
    },
    rangeHint() {
      if (!this.period || !this.period[0] || !this.period[1]) {
        return '默认展示最近 24 小时';
      }
      return `${this.formatDateTime(this.period[0])} ~ ${this.formatDateTime(this.period[1])}`;
    },
    autoRefreshText() {
      const current = this.autoRefreshOptions.find(item => item.value === this.filters.autoRefresh);
      return `自动刷新：${current ? current.label : '关闭'}`;
    },
    peakBucketLabel() {
      return `峰值${this.granularityText(this.filters.granularity)}请求`;
    },
    successRate() {
      const summary = this.dashboard.summary || {};
      const total = this.toNumber(summary.total);
      const success = this.toNumber(summary.status2xx) + this.toNumber(summary.status3xx);
      return total > 0 ? (success / total) * 100 : 0;
    },
    avgQps() {
      const total = this.toNumber((this.dashboard.summary || {}).total);
      return this.durationSeconds > 0 ? total / this.durationSeconds : 0;
    },
    peakTrendItem() {
      return (this.dashboard.trend || []).reduce((max, item) => {
        if (!max || this.toNumber(item.total) > this.toNumber(max.total)) {
          return item;
        }
        return max;
      }, null);
    },
    peakRiskItem() {
      return (this.dashboard.trend || []).reduce((max, item) => {
        const currentRisk = this.toNumber(item.status5xx) + this.toNumber(item.slowCount);
        const maxRisk = max ? (this.toNumber(max.status5xx) + this.toNumber(max.slowCount)) : -1;
        if (!max || currentRisk > maxRisk) {
          return item;
        }
        return max;
      }, null);
    },
    recentErrorRawList() {
      return this.dashboard.recentError || [];
    },
    recentSlowRawList() {
      return this.dashboard.recentSlow || [];
    },
    activeRecentRawList() {
      return this.recentActiveTab === 'slow' ? this.recentSlowRawList : this.recentErrorRawList;
    },
    filteredRecentList() {
      const keyword = (this.recentKeyword || '').toLowerCase();
      return keyword
        ? this.activeRecentRawList.filter(item => {
          return ['host', 'requestUri', 'remoteAddr', 'upstreamAddr']
            .map(key => (item[key] || '').toString().toLowerCase())
            .some(value => value.includes(keyword));
        })
        : this.activeRecentRawList;
    },
    summaryCards() {
      const summary = this.dashboard.summary || {};
      const peakItem = this.peakTrendItem;
      return [
        { label: '总请求数', value: this.formatNumber(summary.total), meta: '当前筛选条件下入口请求总量' },
        { label: '成功率', value: this.formatPercent(this.successRate), meta: '2xx + 3xx 占全部请求比例' },
        { label: '平均 QPS', value: this.formatRate(this.avgQps), meta: `按 ${this.formatDurationText(this.durationSeconds)} 平均折算` },
        { label: this.peakBucketLabel, value: peakItem ? this.formatNumber(peakItem.total) : '0', meta: peakItem ? `峰值时段 ${peakItem.time}` : '暂无趋势数据' },
        { label: '独立来源 IP', value: this.formatNumber(summary.uv), meta: '按 remote_addr 去重' },
        { label: '涉及 Host', value: this.formatNumber(summary.hostCount), meta: '当前筛选命中的域名数' },
        { label: '慢请求数', value: this.formatNumber(summary.slowCount), meta: `按 ${this.formatThreshold(this.filters.slowThreshold)} 阈值统计` },
        { label: '4xx', value: this.formatNumber(summary.status4xx), meta: '客户端请求异常' },
        { label: '5xx', value: this.formatNumber(summary.status5xx), meta: '服务端请求异常' },
        { label: 'P95 请求耗时', value: this.formatSeconds(summary.p95RequestTime), meta: '95% 请求耗时不超过该值' },
        { label: '平均上游耗时', value: this.formatSeconds(summary.avgUpstreamTime), meta: 'upstream_response_time 平均值' },
        { label: '出口流量', value: this.formatMb(summary.trafficMb), meta: 'body_bytes_sent 汇总' }
      ];
    },
    insightCards() {
      const summary = this.dashboard.summary || {};
      const topMethod = (this.dashboard.methods || [])[0];
      const topUri = (this.dashboard.uriTop || [])[0];
      const topIssueUri = (this.dashboard.issueUriTop || [])[0];
      const topHost = (this.dashboard.hostTop || [])[0];
      const topUpstream = (this.dashboard.upstreamTop || [])[0];
      return [
        {
          label: '峰值时段',
          value: this.peakTrendItem ? `${this.peakTrendItem.time} · ${this.formatNumber(this.peakTrendItem.total)}` : '-',
          tip: `请求量最高的${this.granularityText(this.filters.granularity)}桶`
        },
        {
          label: '主要方法',
          value: topMethod ? `${topMethod.name} · ${this.formatNumber(topMethod.value)}` : '-',
          tip: '当前视角下命中最多的请求方法'
        },
        {
          label: '热点 URI',
          value: topUri ? topUri.name : '-',
          tip: topUri ? `请求 ${this.formatNumber(topUri.value)} 次，均耗 ${this.formatSeconds(topUri.avgRequestTime)}` : '暂无热点路径'
        },
        {
          label: '风险 URI',
          value: topIssueUri ? topIssueUri.name : '-',
          tip: topIssueUri ? `问题命中 ${this.formatNumber(topIssueUri.value)} 次` : '当前暂无风险 URI'
        },
        {
          label: '核心 Host',
          value: topHost ? `${topHost.name} · ${this.formatNumber(topHost.value)}` : '-',
          tip: '流量最集中的域名'
        },
        {
          label: '关键 Upstream',
          value: topUpstream ? `${topUpstream.name} · ${this.formatNumber(topUpstream.value)}` : '-',
          tip: topUpstream ? `平均上游耗时 ${this.formatSeconds(topUpstream.avgUpstreamTime)}` : '暂无上游热点'
        },
        {
          label: '最大请求耗时',
          value: this.formatSeconds(summary.maxRequestTime),
          tip: '便于发现极端慢请求样本'
        },
        {
          label: '风险高点',
          value: this.peakRiskItem ? `${this.peakRiskItem.time}` : '-',
          tip: this.peakRiskItem ? `5xx + 慢请求合计 ${this.formatNumber(this.toNumber(this.peakRiskItem.status5xx) + this.toNumber(this.peakRiskItem.slowCount))}` : '暂无明显风险高点'
        }
      ];
    },
    filterTags() {
      return [
        { label: '统计粒度', value: this.granularityText(this.filters.granularity), type: 'success' },
        { label: '状态范围', value: this.statusText(this.filters.statusType), type: 'info' },
        { label: '慢请求阈值', value: this.formatThreshold(this.filters.slowThreshold), type: 'danger' },
        { label: '请求方法', value: this.filters.method || '全部', type: 'success' },
        { label: 'Host', value: this.filters.host || '全部', type: 'info' },
        { label: 'URI', value: this.filters.uriKeyword || '全部', type: 'info' },
        { label: '自动刷新', value: this.autoRefreshText.replace('自动刷新：', ''), type: 'success' }
      ];
    },
    qualityMetrics() {
      const summary = this.dashboard.summary || {};
      return [
        { label: '平均请求耗时', value: this.formatSeconds(summary.avgRequestTime), tip: 'request_time 平均值' },
        { label: '最大请求耗时', value: this.formatSeconds(summary.maxRequestTime), tip: '当前命中数据中的最大值' },
        { label: '平均上游耗时', value: this.formatSeconds(summary.avgUpstreamTime), tip: 'upstream_response_time 平均值' },
        { label: '最大上游耗时', value: this.formatSeconds(summary.maxUpstreamTime), tip: '上游依赖最长耗时' }
      ];
    },
    recentTitle() {
      return '异常 / 慢请求明细';
    },
    recentSubtitle() {
      return `异常明细与慢请求明细分 Tab 展示，各 Tab 最多返回 100 条；慢请求阈值 ${this.formatThreshold(this.filters.slowThreshold)}。`;
    }
  },
  watch: {
    'filters.granularity'(value, oldValue) {
      if (value === oldValue || value !== 'minute') {
        return;
      }
      this.period = this.buildRecentPeriod(this.minuteQuickRange);
    }
  },
  mounted() {
    this.fetchDashboard();
    this.handleAutoRefreshChange();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
    this.disposeCharts();
  },
  methods: {
    toNumber(value) {
      const num = Number(value || 0);
      return Number.isFinite(num) ? num : 0;
    },
    formatDateTime(value) {
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return '--';
      if (typeof date.format === 'function') {
        return date.format('yyyy-MM-dd hh:mm:ss');
      }
      const pad = num => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    },
    formatNumber(value) {
      const num = this.toNumber(value);
      return num.toLocaleString('zh-CN');
    },
    formatPercent(value) {
      const num = this.toNumber(value);
      return `${num.toFixed(1)}%`;
    },
    formatRate(value) {
      const num = this.toNumber(value);
      if (num >= 1000) {
        return `${num.toFixed(0)}/s`;
      }
      if (num >= 100) {
        return `${num.toFixed(1)}/s`;
      }
      return `${num.toFixed(2)}/s`;
    },
    formatSeconds(value) {
      const num = Number(value);
      if (!Number.isFinite(num) || num < 0) return '0.000s';
      return `${num.toFixed(3)}s`;
    },
    formatMb(value) {
      const num = this.toNumber(value);
      return `${num.toFixed(2)} MB`;
    },
    formatThreshold(value) {
      const num = this.toNumber(value);
      return `${num.toFixed(num < 1 ? 1 : 0)}s`;
    },
    formatDurationText(seconds) {
      const total = this.toNumber(seconds);
      if (total < 60) return `${total} 秒`;
      if (total < 3600) return `${Math.floor(total / 60)} 分钟`;
      if (total < 24 * 3600) return `${(total / 3600).toFixed(total % 3600 === 0 ? 0 : 1)} 小时`;
      return `${(total / 86400).toFixed(total % 86400 === 0 ? 0 : 1)} 天`;
    },
    granularityText(value) {
      const target = this.granularityOptions.find(item => item.value === value);
      return target ? target.label.replace('按', '') : '小时';
    },
    statusText(value) {
      const target = this.statusOptions.find(item => item.value === value);
      return target ? target.label : '全部状态';
    },
    statusTagType(status) {
      const code = Number(status);
      if (code >= 500) return 'danger';
      if (code >= 400) return 'warning';
      if (code >= 300) return 'info';
      return 'success';
    },
    requestTimeClass(value) {
      const seconds = this.toNumber(value);
      if (seconds >= this.filters.slowThreshold) {
        return 'nginx-dashboard__request-time nginx-dashboard__request-time--danger';
      }
      if (seconds >= this.filters.slowThreshold / 2) {
        return 'nginx-dashboard__request-time nginx-dashboard__request-time--warning';
      }
      return 'nginx-dashboard__request-time';
    },
    buildRowTags(row) {
      const tags = [];
      const status = this.toNumber(row.status);
      const requestTime = this.toNumber(row.requestTime);
      if (status >= 500) {
        tags.push({ text: '5xx', type: 'danger' });
      } else if (status >= 400) {
        tags.push({ text: '4xx', type: 'warning' });
      }
      if (requestTime >= this.filters.slowThreshold) {
        tags.push({ text: '慢请求', type: 'danger' });
      }
      if (tags.length === 0) {
        tags.push({ text: '正常', type: 'success' });
      }
      return tags;
    },
    buildRecentPeriod(hours) {
      const safeHours = Number(hours) === 6 ? 6 : 1;
      const end = new Date();
      return [new Date(end.getTime() - safeHours * 3600 * 1000), end];
    },
    handleMinuteQuickRangeChange(hours) {
      this.minuteQuickRange = Number(hours) === 6 ? 6 : 1;
      if (this.filters.granularity === 'minute') {
        this.period = this.buildRecentPeriod(this.minuteQuickRange);
      }
    },
    applyPreset(type) {
      this.activePreset = type;
      if (type === 'overview') {
        this.filters.statusType = 'all';
        this.filters.slowThreshold = 1;
        this.recentActiveTab = 'error';
      } else if (type === 'issue') {
        this.filters.statusType = 'all';
        this.filters.slowThreshold = 1;
        this.recentActiveTab = 'error';
      } else if (type === 'slow') {
        this.filters.statusType = 'all';
        this.filters.slowThreshold = 2;
        this.recentActiveTab = 'slow';
      } else if (type === '5xx') {
        this.filters.statusType = '5xx';
        this.filters.slowThreshold = 1;
        this.recentActiveTab = 'error';
      }
      this.fetchDashboard();
    },
    resetFilter() {
      const end = new Date();
      this.period = [new Date(end.getTime() - 24 * 3600 * 1000), end];
      this.filters = createDefaultFilters();
      this.recentKeyword = '';
      this.recentActiveTab = 'error';
      this.activePreset = 'overview';
      this.minuteQuickRange = 1;
      this.handleAutoRefreshChange();
      this.fetchDashboard();
    },
    handleAutoRefreshChange() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer);
        this.autoRefreshTimer = null;
      }
      const seconds = this.toNumber(this.filters.autoRefresh);
      if (seconds > 0) {
        this.autoRefreshTimer = setInterval(() => {
          if (!this.loading) {
            this.fetchDashboard();
          }
        }, seconds * 1000);
      }
    },
    handleResize() {
      ['trendChart', 'methodChart', 'statusChart', 'uriChart', 'issueUriChart', 'upstreamChart', 'hostChart', 'ipChart'].forEach(refName => {
        const chartDom = this.$refs[refName];
        if (chartDom) {
          const chart = echarts.getInstanceByDom(chartDom);
          if (chart) chart.resize();
        }
      });
    },
    disposeCharts() {
      ['trendChart', 'methodChart', 'statusChart', 'uriChart', 'issueUriChart', 'upstreamChart', 'hostChart', 'ipChart'].forEach(refName => {
        const chartDom = this.$refs[refName];
        if (chartDom) {
          const chart = echarts.getInstanceByDom(chartDom);
          if (chart) chart.dispose();
        }
      });
    },
    renderEmptyChart(refName, text) {
      const chartDom = this.$refs[refName];
      if (!chartDom) return;
      const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
      chart.clear();
      chart.setOption({
        title: {
          text: text || '暂无数据',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#94a3b8',
            fontSize: 14,
            fontWeight: 500
          }
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: []
      });
    },
    renderTrendChart() {
      const chartDom = this.$refs.trendChart;
      if (!chartDom) return;
      const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
      const list = this.dashboard.trend || [];
      if (list.length === 0) {
        this.renderEmptyChart('trendChart', '当前范围暂无入口请求');
        return;
      }
      const isMinute = this.filters.granularity === 'minute';
      const enableZoom = list.length > (isMinute ? 60 : 24);
      chart.setOption({
        color: ['#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#06b6d4'],
        tooltip: { trigger: 'axis' },
        legend: { top: 6 },
        grid: { left: '3%', right: '4%', bottom: enableZoom ? 64 : '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: list.map(item => item.time),
          axisLabel: {
            rotate: isMinute ? 45 : 0,
            hideOverlap: true
          }
        },
        yAxis: [
          { type: 'value', name: '请求数' },
          { type: 'value', name: '耗时(s)' }
        ],
        dataZoom: enableZoom ? [
          { type: 'inside', start: 0, end: 100 },
          { type: 'slider', height: 18, bottom: 16, start: 0, end: 100 }
        ] : [],
        series: [
          { name: '总请求', type: 'bar', barMaxWidth: 22, data: list.map(item => this.toNumber(item.total)) },
          { name: '4xx', type: 'line', smooth: true, yAxisIndex: 0, data: list.map(item => this.toNumber(item.status4xx)) },
          { name: '5xx', type: 'line', smooth: true, yAxisIndex: 0, data: list.map(item => this.toNumber(item.status5xx)) },
          { name: '慢请求', type: 'line', smooth: true, yAxisIndex: 0, data: list.map(item => this.toNumber(item.slowCount)) },
          { name: '平均请求耗时', type: 'line', smooth: true, yAxisIndex: 1, data: list.map(item => this.toNumber(item.avgRequestTime)) },
          { name: '平均上游耗时', type: 'line', smooth: true, yAxisIndex: 1, data: list.map(item => this.toNumber(item.avgUpstreamTime)) }
        ]
      });
    },
    renderPieChart(refName, list, colors, emptyText) {
      const chartDom = this.$refs[refName];
      if (!chartDom) return;
      const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
      if (!list || list.length === 0) {
        this.renderEmptyChart(refName, emptyText);
        return;
      }
      chart.setOption({
        color: colors,
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, type: 'scroll' },
        series: [{
          type: 'pie',
          radius: ['44%', '70%'],
          center: ['50%', '42%'],
          label: { formatter: '{b}\n{c}' },
          data: list.map(item => ({ name: item.name, value: this.toNumber(item.value) }))
        }]
      });
    },
    renderBarChart(refName, list, config) {
      const chartDom = this.$refs[refName];
      if (!chartDom) return;
      const chart = echarts.getInstanceByDom(chartDom) || echarts.init(chartDom);
      if (!list || list.length === 0) {
        this.renderEmptyChart(refName, config.emptyText);
        return;
      }
      chart.setOption({
        color: [config.color],
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: params => {
            const item = list[params[0].dataIndex] || {};
            const lines = [`${item.name || '-'}`, `${config.valueLabel || '数量'}：${this.formatNumber(item.value)}`];
            if (config.metricField && item[config.metricField] !== undefined) {
              const metricValue = config.metricType === 'seconds'
                ? this.formatSeconds(item[config.metricField])
                : this.formatNumber(item[config.metricField]);
              lines.push(`${config.metricLabel}：${metricValue}`);
            }
            return lines.join('<br/>');
          }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '4%', containLabel: true },
        xAxis: { type: 'value' },
        yAxis: {
          type: 'category',
          inverse: true,
          axisLabel: {
            width: config.labelWidth || 260,
            overflow: 'truncate'
          },
          data: list.map(item => item.name)
        },
        series: [{
          type: 'bar',
          barWidth: 16,
          data: list.map(item => this.toNumber(item.value))
        }]
      });
    },
    renderCharts() {
      this.renderTrendChart();
      this.renderPieChart('methodChart', this.dashboard.methods, ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'], '暂无请求方法数据');
      this.renderPieChart('statusChart', this.dashboard.statuses, ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'], '暂无状态码数据');
      this.renderBarChart('uriChart', this.dashboard.uriTop, {
        color: '#2563eb',
        emptyText: '暂无 URI 热点',
        valueLabel: '请求数',
        metricField: 'avgRequestTime',
        metricLabel: '平均请求耗时',
        metricType: 'seconds'
      });
      this.renderBarChart('issueUriChart', this.dashboard.issueUriTop, {
        color: '#ef4444',
        emptyText: '暂无风险 URI',
        valueLabel: '问题命中数',
        metricField: 'avgRequestTime',
        metricLabel: '平均请求耗时',
        metricType: 'seconds'
      });
      this.renderBarChart('upstreamChart', this.dashboard.upstreamTop, {
        color: '#8b5cf6',
        emptyText: '暂无 Upstream 热点',
        valueLabel: '请求数',
        metricField: 'avgUpstreamTime',
        metricLabel: '平均上游耗时',
        metricType: 'seconds'
      });
      this.renderBarChart('hostChart', this.dashboard.hostTop, {
        color: '#10b981',
        emptyText: '暂无 Host 数据',
        valueLabel: '请求数'
      });
      this.renderBarChart('ipChart', this.dashboard.ipTop, {
        color: '#f59e0b',
        emptyText: '暂无来源 IP 数据',
        valueLabel: '请求数'
      });
    },
    fetchDashboard() {
      if (!this.period || !this.period[0] || !this.period[1]) {
        this.$message.warning('请选择开始和结束时间');
        return;
      }
      if (this.period[1].getTime() <= this.period[0].getTime()) {
        this.$message.warning('开始时间必须早于结束时间');
        return;
      }
      if (this.period[1].getTime() - this.period[0].getTime() > 7 * 24 * 3600 * 1000) {
        this.$message.warning('时间范围不能超过 7 天');
        return;
      }
      if (this.filters.granularity === 'minute' && this.period[1].getTime() - this.period[0].getTime() > 48 * 3600 * 1000) {
        this.$message.warning('按分钟粒度时，时间范围不能超过 48 小时');
        return;
      }
      this.loading = true;
      request({
        url: '/admin/home/getNginxDashboard',
        params: {
          start: this.formatDateTime(this.period[0]),
          end: this.formatDateTime(this.period[1]),
          host: this.filters.host,
          uriKeyword: this.filters.uriKeyword,
          method: this.filters.method,
          granularity: this.filters.granularity,
          statusType: this.filters.statusType,
          slowThreshold: this.filters.slowThreshold
        }
      }).then(res => {
        const data = res.data || {};
        const fallbackRecent = Array.isArray(data.recent) ? data.recent : [];
        const recentError = Array.isArray(data.recentError)
          ? data.recentError
          : fallbackRecent.filter(item => this.toNumber(item.status) >= 400).slice(0, 100);
        const recentSlow = Array.isArray(data.recentSlow)
          ? data.recentSlow
          : fallbackRecent.filter(item => this.toNumber(item.requestTime) >= this.filters.slowThreshold).slice(0, 100);
        this.dashboard = {
          summary: data.summary || {},
          trend: data.trend || [],
          methods: data.methods || [],
          statuses: data.statuses || [],
          uriTop: data.uriTop || [],
          issueUriTop: data.issueUriTop || [],
          hostTop: data.hostTop || [],
          ipTop: data.ipTop || [],
          upstreamTop: data.upstreamTop || [],
          recentError,
          recentSlow
        };
      }).finally(() => {
        this.loading = false;
        this.$nextTick(() => {
          this.renderCharts();
        });
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.nginx-dashboard__toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nginx-dashboard__toolbar-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.nginx-dashboard__field {
  min-width: 0;
}

.nginx-dashboard__field--wide {
  grid-column: span 2;
}

.nginx-dashboard__field-label {
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.nginx-dashboard__range,
.nginx-dashboard__field ::v-deep .el-select,
.nginx-dashboard__field ::v-deep .el-input {
  width: 100%;
}

.nginx-dashboard__minute-range {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.nginx-dashboard__toolbar-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.nginx-dashboard__preset-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.nginx-dashboard__preset-label {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
}

.nginx-dashboard__toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.nginx-dashboard__summary,
.nginx-dashboard__overview-grid,
.nginx-dashboard__table-panel {
  margin-top: 12px;
}

.nginx-dashboard__overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.nginx-dashboard__insight-grid,
.nginx-dashboard__metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.nginx-dashboard__insight-item,
.nginx-dashboard__metric-card {
  padding: 12px;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.nginx-dashboard__insight-label,
.nginx-dashboard__metric-label {
  font-size: 12px;
  color: #64748b;
}

.nginx-dashboard__insight-value,
.nginx-dashboard__metric-value {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  word-break: break-word;
}

.nginx-dashboard__insight-tip,
.nginx-dashboard__metric-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.nginx-dashboard__tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.nginx-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.nginx-dashboard__panel {
  min-width: 0;
}

.nginx-dashboard__panel--wide {
  grid-column: span 2;
}

.nginx-dashboard__chart {
  width: 100%;
  height: 320px;
  margin-top: 12px;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff, #f8fbff);
}

.nginx-dashboard__chart--large {
  height: 400px;
}

.nginx-dashboard__table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 12px 0;
}

.nginx-dashboard__table-search {
  width: 360px;
  max-width: 100%;
}

.nginx-dashboard__tag-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.nginx-dashboard__request-time {
  color: #334155;
  font-weight: 600;
}

.nginx-dashboard__request-time--warning {
  color: #d97706;
}

.nginx-dashboard__request-time--danger {
  color: #dc2626;
}

.nginx-dashboard__upstream-time {
  color: #475569;
}

::v-deep .nginx-dashboard__table .el-table__body td {
  vertical-align: top;
}

@media (max-width: 1400px) {
  .nginx-dashboard__toolbar-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .nginx-dashboard__overview-grid,
  .nginx-dashboard__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 992px) {
  .nginx-dashboard__toolbar-grid,
  .nginx-dashboard__overview-grid,
  .nginx-dashboard__grid,
  .nginx-dashboard__insight-grid,
  .nginx-dashboard__metric-grid {
    grid-template-columns: 1fr;
  }

  .nginx-dashboard__field--wide,
  .nginx-dashboard__panel--wide {
    grid-column: span 1;
  }

  .nginx-dashboard__toolbar-footer,
  .nginx-dashboard__preset-wrap,
  .nginx-dashboard__table-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .nginx-dashboard__table-search {
    width: 100%;
  }
}
</style>
