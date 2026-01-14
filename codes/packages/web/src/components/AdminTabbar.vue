<template>
  <van-tabbar v-model="active" route>
    <van-tabbar-item to="/admin/orders" icon="orders-o">订单</van-tabbar-item>
    <van-tabbar-item to="/admin/works" icon="photo-o">作品</van-tabbar-item>
    <van-tabbar-item to="/admin/profile" icon="user-o">主页</van-tabbar-item>
  </van-tabbar>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const active = ref(0)

// 根据路由设置活动项
watch(() => route.path, (path) => {
  if (path.includes('/orders')) {
    active.value = 0
  } else if (path.includes('/works')) {
    active.value = 1
  } else if (path.includes('/profile')) {
    active.value = 2
  }
}, { immediate: true })
</script>
