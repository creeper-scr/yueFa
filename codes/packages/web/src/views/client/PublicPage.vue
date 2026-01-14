<template>
  <div class="public-page">
    <!-- 加载中 -->
    <van-loading v-if="loading" class="page-loading" />

    <!-- 错误状态 -->
    <van-empty v-else-if="error" :description="error">
      <van-button type="primary" size="small" @click="fetchData">重新加载</van-button>
    </van-empty>

    <!-- 主内容 -->
    <template v-else>
      <!-- 头部信息 -->
      <div class="profile-header">
        <van-image
          round
          width="80"
          height="80"
          :src="profile.avatar_url || defaultAvatar"
          class="avatar"
        />
        <div class="profile-info">
          <h1 class="nickname">{{ profile.nickname || '毛娘店铺' }}</h1>
          <div class="wechat" v-if="profile.wechat_id" @click="copyWechat">
            <van-icon name="chat-o" />
            <span>{{ profile.wechat_id }}</span>
            <van-icon name="guide-o" size="12" />
          </div>
        </div>
      </div>

      <!-- 公告 -->
      <div class="announcement" v-if="profile.announcement">
        <van-notice-bar
          :text="profile.announcement"
          left-icon="volume-o"
          mode="closeable"
        />
      </div>

      <!-- Tab切换 -->
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="作品集">
          <WorkGallery :works="works" />
        </van-tab>
        <van-tab title="询价">
          <InquiryForm
            ref="inquiryFormRef"
            :user-slug="slug"
            @submit="handleInquirySubmit"
          />
        </van-tab>
      </van-tabs>
    </template>

    <!-- 底部询价按钮 -->
    <div class="bottom-action" v-if="!loading && !error && activeTab === 0">
      <van-button type="primary" round block @click="activeTab = 1">
        我要询价
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { userApi, worksApi, inquiriesApi } from '@/api'
import WorkGallery from '@/components/WorkGallery.vue'
import InquiryForm from '@/components/InquiryForm.vue'

const route = useRoute()
const slug = route.params.slug

const loading = ref(true)
const error = ref('')
const activeTab = ref(0)
const profile = ref({})
const works = ref([])
const inquiryFormRef = ref(null)

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FF6B6B"/%3E%3Ctext x="50" y="60" text-anchor="middle" fill="white" font-size="30"%3E%E6%AF%9B%3C/text%3E%3C/svg%3E'

const fetchData = async () => {
  loading.value = true
  error.value = ''

  try {
    // 并行获取用户信息和作品
    const [profileRes, worksRes] = await Promise.all([
      userApi.getPublicProfile(slug),
      worksApi.getPublicWorks(slug)
    ])

    if (profileRes.code !== 0) {
      throw new Error(profileRes.message)
    }

    profile.value = profileRes.data
    works.value = worksRes.data || []
  } catch (err) {
    error.value = err.message || '页面加载失败'
  } finally {
    loading.value = false
  }
}

const copyWechat = async () => {
  try {
    await navigator.clipboard.writeText(profile.value.wechat_id)
    showSuccessToast('微信号已复制')
  } catch {
    showToast('复制失败，请手动复制')
  }
}

const handleInquirySubmit = async (data) => {
  try {
    const res = await inquiriesApi.submit(data)
    if (res.code === 0) {
      showSuccessToast('询价提交成功')
      inquiryFormRef.value?.reset()
      activeTab.value = 0
    } else {
      throw new Error(res.message)
    }
  } catch (err) {
    showToast(err.message || '提交失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.public-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.profile-header {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
  padding: 32px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.profile-info {
  color: #fff;
}

.nickname {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px;
}

.wechat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  opacity: 0.9;
  cursor: pointer;
}

.announcement {
  margin: -8px 0 0;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}
</style>
