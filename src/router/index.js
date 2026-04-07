import Vue from 'vue'
import Router from 'vue-router'
import Layout from '@/layout'

Vue.use(Router)

export const constantRoutes = [{
  path: '/login',
  component: () => import('@/views/login/index'),
  hidden: true
}, {
  path: '/',
  component: Layout,
  redirect: '/home',
  hidden: true,
  children: [{
    path: 'home',
    component: () => import('@/views/home/index'),
    meta: {title: '应用', icon: 'home'}
  }]
}, {
  path: '/user',
  component: Layout,
  hidden: true,
  children: [{
    path: '',
    component: () => import('@/views/home/user'),
    meta: {title: '个人信息', icon: 'home'}
  }]
}, {
  path: '/topology',
  component: Layout,
  hidden: true,
  children: [{
    path: '',
    component: () => import('@/views/home/topology'),
    meta: {title: '应用拓扑', icon: 'home'}
  }]
}, {
  path: '/syslog',
  component: Layout,
  hidden: true,
  children: [{
    path: '',
    component: () => import('@/views/applog/syslog'),
    meta: {title: '系统日志', icon: 'syslog'}
  }]
}, {
  path: '/nginx',
  component: Layout,
  hidden: true,
  children: [{
    path: '',
    name: 'Nginx入口大盘',
    component: () => import('@/views/nginx/index'),
    meta: {title: 'Nginx', icon: 'table'}
  }]
}, {

  path: '/app',

  component: Layout,
  role: 3,
  place: 1,
  children: [{
    path: '',
    name: '概览',
    component: () => import('@/views/app/index'),
    meta: {title: '概览', icon: 'table'}
  }]
}, {
  path: '/ops',
  component: Layout,
  role: 2,
  place: 1,
  children: [{
    path: '',
    name: '版本管理',
    component: () => import('@/views/ops/index'),
    meta: {title: '版本', icon: 'table'}
  }]
}, {
  path: '/session',
  component: Layout,
  role: 2,
  place: 1,
  icon: 'el-icon-chat-line-square',
  children: [{
    path: '',
    name: '会话管理',
    component: () => import('@/views/session/index'),
    meta: {title: '会话', icon: 'table'}
  }]
}, {
  path: '/cache',
  component: Layout,
  role: 2,
  place: 1,
  icon: 'el-icon-coin',
  children: [{
    path: '',
    name: '缓存管理',
    component: () => import('@/views/session/cache'),
    meta: {title: '缓存', icon: 'table'}
  }]
}, {
  path: '/apimkt',
  component: Layout,
  role: 3,
  place: 1,
  children: [{
    path: '',
    name: 'API文档',
    component: () => import('@/views/apimkt/index'),
    meta: {title: 'API', icon: 'table'}
  }]
}, {
  path: '/signature',
  component: Layout,
  role: 2,
  place: 1,
  icon: 'el-icon-key',
  children: [{
    path: '',
    name: '签名令牌',
    component: () => import('@/views/signature/index'),
    meta: {title: '签名', icon: 'table'}
  }]
}, {
  path: '/funcmemo',
  component: Layout,
  role: 2,
  place: 1,
  children: [{
    path: '',
    name: '调用记录',
    component: () => import('@/views/applog/index'),
    meta: {title: '调用', icon: 'table'}
  }]
}, {
  path: '/applog',
  component: Layout,
  role: 2,
  place: 1,
  icon: 'el-icon-document',
  children: [{
    path: '',
    name: '日志',
    component: () => import('@/views/applog/applog'),
    meta: {title: '日志', icon: 'table'}
  }]
}, {
  path: '/cron',
  component: Layout,
  role: 2,
  place: 1,
  children: [{
    path: '',
    name: '定时作业',
    component: () => import('@/views/cron/index'),
    meta: {title: '作业', icon: 'table'}
  }]
}, {
  path: '/router',
  component: Layout,
  hidden: true,
  children: [{
    path: '',
    name: '路由表',
    component: () => import('@/views/router/index'),
    meta: {title: '路由', icon: 'table'}
  }]
}, {
  path: '/alert',
  component: Layout,
  role: 2,
  place: 1,
  children: [{
    path: '',
    name: '告警',
    component: () => import('@/views/alert/index'),
    meta: {title: '告警', icon: 'table'}
  }]
}, {
  path: '/404',
  component: () => import('@/views/404'),
  hidden: true
},
  {path: '*', redirect: '/404', hidden: true}
]
const createRouter = () => new Router({
  scrollBehavior: () => ({y: 0}),
  routes: constantRoutes
})

const router = createRouter()

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
