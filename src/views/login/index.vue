<template>
  <div class="login-container">
    <div class="login-layout">
      <div class="login-aside">
        <div class="login-brand">Hcrinx</div>
        <div class="login-title">统一应用管理与观测平台</div>
        <div class="login-desc">集中查看应用概览、日志、告警、会话、定时作业与版本发布，让运维与研发协作更顺畅。</div>
        <ul class="login-points">
          <li>统一登录与应用权限隔离</li>
          <li>日志、调用、拓扑、告警一体化查看</li>
          <li>支持 SSO 登录与账号登录</li>
        </ul>
      </div>

      <div class="login-panel">
        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" auto-complete="on" class="login-form" label-position="left">
          <div class="title-container">
            <div class="title">欢迎登录</div>
            <div class="subtitle">请输入账号密码，或使用 SSO 快速进入系统</div>
          </div>

          <el-form-item prop="username" class="login-item">
            <span class="svg-container"><i class="el-icon-s-custom"></i></span>
            <el-input ref="username" v-model="loginForm.username" auto-complete="on" name="username" placeholder="用户名" tabindex="1" type="text" clearable/>
          </el-form-item>

          <el-form-item prop="password" class="login-item">
            <span class="svg-container"><i class="el-icon-key"></i></span>
            <el-input :key="passwordType" ref="password" v-model="loginForm.password" :type="passwordType" auto-complete="on" name="password" placeholder="密码" tabindex="2" @keyup.enter.native="handleLogin" clearable/>
            <span class="show-pwd" @click="showPwd"><i class="el-icon-view"></i></span>
          </el-form-item>

          <el-button :loading="loading" class="login-btn" type="primary" @click.native.prevent="handleLogin">账号登录</el-button>
          <el-button :loading="loadingsso" class="login-btn login-btn--secondary" type="success" @click="ssoLogin">SSO 登录</el-button>
        </el-form>
      </div>
    </div>
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
      handler(route) {
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
      this.passwordType = this.passwordType === "password" ? "" : "password";
      this.$nextTick(() => {
        this.$refs.password.focus();
      });
    },
    ssoLogin() {
      const returnUrl = location.href;
      location.href = location.origin + '/xtgzstg/sso/auth?returnUrl=' + encodeURIComponent(returnUrl);
    },
    ssologinCheck(code) {
      this.loadingsso = true;
      this.$store
        .dispatch("user/ssoLogin", {code: code})
        .then(() => {
          this.loadingsso = false;
          this.$nextTick(() => {
            location.href = location.href.substring(0, location.href.indexOf("/?"));
          });
          this.$router.push({path: this.redirect || "/"});
        })
        .catch(() => {
          this.loadingsso = false;
        });
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (!valid) {
          return false;
        }
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
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.28), transparent 30%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.22), transparent 32%),
    linear-gradient(135deg, #0f172a, #1e293b 55%, #0b1120);
}

.login-layout {
  display: grid;
  grid-template-columns: 1.1fr minmax(420px, 520px);
  align-items: stretch;
  min-height: calc(100vh - 64px);
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 80px rgba(2, 8, 23, 0.36);
  backdrop-filter: blur(12px);
}

.login-aside {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 56px 64px;
  color: #fff;
}

.login-brand {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 116px;
  height: 42px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  font-size: 18px;
  font-weight: 700;
}

.login-title {
  margin-top: 28px;
  font-size: 40px;
  font-weight: 700;
  line-height: 1.25;
}

.login-desc {
  margin-top: 18px;
  max-width: 520px;
  font-size: 16px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.76);
}

.login-points {
  margin: 32px 0 0;
  padding-left: 20px;
  line-height: 2;
  color: rgba(255, 255, 255, 0.86);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.96);
}

.login-form {
  width: 100%;
}

.title-container {
  margin-bottom: 28px;
}

.title {
  font-size: 30px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin-top: 10px;
  color: #64748b;
  line-height: 1.7;
}

.login-item {
  position: relative;
  margin-bottom: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

::v-deep .login-item .el-form-item__content {
  display: flex;
  align-items: center;
}

::v-deep .login-item .el-input {
  width: calc(100% - 48px);
}

::v-deep .login-item .el-input__inner {
  height: 54px;
  border: none;
  background: transparent;
  box-shadow: none;
}

.svg-container {
  width: 48px;
  text-align: center;
  font-size: 18px;
  color: #64748b;
}

.show-pwd {
  position: absolute;
  right: 16px;
  top: 16px;
  font-size: 18px;
  color: #94a3b8;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  height: 46px;
  margin-bottom: 14px;
  border-radius: 14px;
}

.login-btn--secondary {
  margin-left: 0;
}
</style>
