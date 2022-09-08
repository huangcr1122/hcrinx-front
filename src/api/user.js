import request from '@/api/request'

export function login(data) {
  return request({
    url: '/gw/admin/login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/gw/admin/userinfo',
    method: 'post'
  })
}

export function logout() {
  return request({
    url: '/gw/admin/logout',
    method: 'post'
  })
}
