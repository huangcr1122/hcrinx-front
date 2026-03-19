import {resetRouter} from "@/router";
import {sha256} from "@/utils/sha256";
import request from "@/utils/request";
import Cookies from "js-cookie";

const getDefaultState = () => {
  return {
    token: Cookies.get('sessionid')
  };
};

const state = getDefaultState();

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState());
  }
};

const actions = {
  // user login
  login({commit}, userInfo) {
    const {username, password} = userInfo;
    const t = new Date().getTime();
    return new Promise((resolve, reject) => {
      request({
        url: "/admin/user/login",
        method: "post",
        data: {
          username: username.trim(),
          password: sha256(username.trim() + ":" + password + ":" + t),
          t: t
        },
      })
        .then((response) => {
          const data = response.data;
          localStorage.setItem("env", response.msg);
          Cookies.set('sessionid', data.sessionid);
          delete data.sessionid;
          delete data.password;
          localStorage.setItem("hcrinx_user", JSON.stringify(data));
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  ssoLogin({commit}, code) {
    return new Promise((resolve, reject) => {
      request({
        url: "/admin/user/ssoLogin",
        method: "post",
        data: code,
      })
        .then((response) => {
          const data = response.data;
          localStorage.setItem("env", response.msg);
          Cookies.set('sessionid', data.sessionid);
          delete data.sessionid;
          delete data.password;
          localStorage.setItem("hcrinx_user", JSON.stringify(data));
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // user logout
  logout({commit, state}) {
    return new Promise((resolve, reject) => {
      request({
        url: '/admin/user/logout',
        method: 'post'
      })
        .then(() => {
          Cookies.remove('sessionid'); // must remove  token  first
          resetRouter();
          localStorage.removeItem("hcrinx_user");
          commit("RESET_STATE");
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // remove token
  resetToken({commit}) {
    return new Promise((resolve) => {
      Cookies.remove('sessionid'); // must remove  token  first
      commit("RESET_STATE");
      resolve();
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
