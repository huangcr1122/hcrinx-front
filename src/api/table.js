import request from '@/api/request'

export function getList(params) {
  return request({
    url: '/gw/table/list',
    method: 'get',
    params
  })
}
