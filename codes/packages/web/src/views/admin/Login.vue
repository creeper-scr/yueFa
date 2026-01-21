<template>
  <div class="login-page">
    <div class="login-header">
      <h1 class="title">
        约发
      </h1>
      <p class="subtitle">
        Cosplay假发造型师专属工具
      </p>
    </div>

    <div class="login-form">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            type="tel"
            maxlength="11"
            :rules="[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
            ]"
          />
          <van-field
            v-model="code"
            name="code"
            label="验证码"
            placeholder="请输入验证码"
            type="number"
            maxlength="6"
            :rules="[{ required: true, message: '请输入验证码' }]"
          >
            <template #button>
              <van-button
                size="small"
                type="primary"
                :disabled="countdown > 0"
                :loading="sendingCode"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </van-button>
            </template>
          </van-field>
        </van-cell-group>

        <div class="login-btn">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
          >
            登录
          </van-button>
        </div>
      </van-form>

      <p class="login-tip">
        未注册的手机号将自动创建账号
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { useUserStore } from '@/stores'
import { authApi } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

let timer = null

const sendCode = async () => {
  // 验证手机号
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    const res = await authApi.sendSms(phone.value)
    if (res.code === 0) {
      showSuccessToast('验证码已发送')

      // 开发环境自动填充验证码
      if (res.data?.code) {
        code.value = res.data.code
      }

      // 开始倒计时
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
  } catch (error) {
    showToast(error.message || '发送失败')
  } finally {
    sendingCode.value = false
  }
}

const handleLogin = async () => {
  loading.value = true
  try {
    const res = await userStore.login(phone.value, code.value)
    if (res.code === 0) {
      showSuccessToast('登录成功')

      // 跳转到原页面或订单页
      const redirect = route.query.redirect || '/admin/orders'
      router.replace(redirect)
    }
  } catch (error) {
    showToast(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FF6B6B 0%, #FF8E8E 50%, #f7f8fa 50%);
  padding-top: 80px;
}

.login-header {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}

.title {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 8px;
}

.subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.login-form {
  margin: 0 16px;
}

.login-btn {
  padding: 24px 16px 16px;
}

.login-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 0;
}
</style>
