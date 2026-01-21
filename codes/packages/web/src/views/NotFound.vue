<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-300 mb-4">
        404
      </h1>
      <p class="text-gray-500 mb-6">
        页面不存在
      </p>
      <van-button type="primary" @click="goHome">
        返回首页
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>
