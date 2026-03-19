import axios from "axios";
import {Message} from "element-ui";
import store from "@/store";
import router from '@/router';

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 300000, // request timeout
});

// request interceptor
service.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// response interceptor
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0 && res.code !== 1) {
      Message.error(res.msg || "Error");
      if (res.code === -999) {
        store.dispatch("user/resetToken").then(() => {
          router.push({path: "/"});
          location.reload();
        });
      }
      return Promise.reject(new Error(res.msg || "Error"));
    } else {
      return res;
    }
  },
  (error) => {
    Message.error(error.message);
    if (error.response.status === 401) {
      store.dispatch("user/resetToken").then(() => {
        router.push({path: "/"});
        location.reload();
      });
    }
    return Promise.reject(error);
  }
);

export default service;
