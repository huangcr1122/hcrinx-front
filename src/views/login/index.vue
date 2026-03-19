<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" auto-complete="on" class="login-form" label-position="left">
      <div class="title-container"><h3 class="title">账号登录</h3></div>

      <el-form-item prop="username">
        <span class="svg-container">          <el-icon class="el-icon-s-custom"/>        </span>
        <el-input ref="username" v-model="loginForm.username" auto-complete="on" name="username" placeholder="Username" tabindex="1" type="text" clearable/>
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">          <el-icon class="el-icon-key"/>        </span>
        <el-input :key="passwordType" ref="password" v-model="loginForm.password" :type="passwordType" auto-complete="on" name="password" placeholder="Password" tabindex="2"
                  @keyup.enter.native="handleLogin" clearable/>
        <span class="show-pwd" @click="showPwd">          <el-icon class="el-icon-view"></el-icon>        </span>
      </el-form-item>

      <el-button :loading="loading" style="width: 100%; margin-bottom: 30px" type="primary" @click.native.prevent="handleLogin">账号登录</el-button>

      <el-button :loading="loadingsso" style="width: 100%;margin-left: 0; margin-bottom: 30px" type="success" @click="ssoLogin">SSO登录</el-button>
    </el-form>

  </div>
</template>

<script>
import {validUsername} from "@/utils/validate";

export default {
  name: "Login",
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!validUsername(value)) {
        callback(new Error("请输入正确的用户名"));
      } else {
        callback();
      }
    };
    const validatePassword = (rule, value, callback) => {
      if (value.length < 6) {
        callback(new Error("密码长度至少6位"));
      } else {
        callback();
      }
    };
    return {
      loginForm: {
        username: "",
        password: "",
      },
      loginRules: {
        username: [
          {required: true, trigger: "blur", validator: validateUsername},
        ],
        password: [
          {required: true, trigger: "blur", validator: validatePassword},
        ],
      },
      loading: false,
      loadingsso: false,
      passwordType: "password",
      redirect: undefined,
    };
  },
  watch: {
    $route: {
      handler: function (route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true,
    },
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      this.ssologinCheck(code);
    }
  },
  methods: {
    showPwd() {
      if (this.passwordType === "password") {
        this.passwordType = "";
      } else {
        this.passwordType = "password";
      }
      this.$nextTick(() => {
        this.$refs.password.focus();
      });
    },
    ssoLogin() {
      let returnUrl = location.href;
      location.href = 'http://172.24.154.32/xtgzstg/sso/auth?returnUrl=' + encodeURIComponent(returnUrl);
    },
    ssologinCheck(code) {
      this.loadingsso = true;
      this.$store
        .dispatch("user/ssoLogin", {code: code})
        .then(() => {
          this.loadingsso = false;
          this.$nextTick(() => {
            location.href = location.href.substring(0, location.href.indexOf("/?"))
          });
          this.$router.push({path: this.redirect || "/"});
        })
        .catch(() => {
          this.loadingsso = false;
        });
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true;
          this.$store
            .dispatch("user/login", this.loginForm)
            .then(() => {
              this.loading = false;
              window.location.reload();
              this.$router.push({path: this.redirect || "/"});
            })
            .catch(() => {
              this.loading = false;
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
  },
};
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }
}
</style>

<style lang="scss" scoped>
$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }
}
</style>
