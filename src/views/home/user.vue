<template>
  <div class="dashboard-container">
    <el-form ref="form" :model="form" label-width="80px" style="width: 800px;padding: 100px;margin: auto;">
      <el-form-item label="用户名">
        <el-input v-model="form.name" :disabled="true"></el-input>
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.mobile"></el-input>
      </el-form-item>
      <el-form-item label="邮箱地址">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item label="登录密码">
        <el-input v-model="form.password" :show-password="true" type="password"></el-input>
      </el-form-item>
      <el-form-item>
        <!-- <el-button type="primary" @click="onSubmit" size="small">修改</el-button> -->
        <!-- <el-button size="small">取消</el-button> -->
      </el-form-item>
    </el-form>
  </div>
</template>

<script>

export default {
  name: "User",
  data() {
    return {
      form: {
        name: '',
        mobile: '',
        email: '',
        password: ''
      }
    };
  },
  mounted() {
    this.form = JSON.parse(localStorage.getItem("hcrinx_user"));
  },
  methods: {
    onSubmit() {

    }
  },
};
</script>

<style lang="scss" scoped>
</style>
