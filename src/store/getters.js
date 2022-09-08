const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  name: state => state.user.name,
  mobile: state => state.user.mobile,
  email: state => state.user.email
}
export default getters
