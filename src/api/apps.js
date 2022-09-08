import request from '@/api/request'

export function stree() {
  return request({
    url: '/gw/admin/service_tree',
    method: 'post',
  })
}

export function sapp(data) {
  return request({
    url: '/gw/admin/service_app',
    method: 'post',
    data
  })
}

export function sdoc(data) {
  return request({
    url: '/gw/admin/service_doc',
    method: 'post',
    data
  })
}
