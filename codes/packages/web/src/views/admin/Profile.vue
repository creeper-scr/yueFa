<template>
  <div class="profile-page">
    <van-nav-bar title="主页编辑" />

    <van-form @submit="handleSubmit">
      <van-cell-group inset title="基本信息">
        <!-- 头像 -->
        <van-field name="avatar" label="头像">
          <template #input>
            <van-uploader
              v-model="avatarList"
              :max-count="1"
              :after-read="handleAvatarUpload"
              accept="image/*"
            >
              <van-image
                round
                width="60"
                height="60"
                :src="form.avatar_url || defaultAvatar"
              />
            </van-uploader>
          </template>
        </van-field>

        <van-field
          v-model="form.nickname"
          name="nickname"
          label="店铺名称"
          placeholder="给你的店铺起个名字"
          maxlength="50"
        />

        <van-field
          v-model="form.wechat_id"
          name="wechat_id"
          label="微信号"
          placeholder="客户可通过此微信号联系你"
          maxlength="50"
        />

        <van-field
          v-model="form.announcement"
          name="announcement"
          label="公告"
          type="textarea"
          placeholder="向客户展示你的档期、特色等信息"
          rows="2"
          autosize
          maxlength="200"
          show-word-limit
        />
      </van-cell-group>

      <van-cell-group inset title="专属链接">
        <van-field
          v-model="form.slug"
          name="slug"
          label="链接后缀"
          placeholder="如: maoyang001"
          maxlength="50"
          :rules="[
            { pattern: /^[a-zA-Z0-9_-]{3,50}$/, message: '只能包含字母、数字、下划线，3-50位' }
          ]"
        >
          <template #extra>
            <span class="slug-preview">yuefa.app/s/{{ form.slug || 'xxx' }}</span>
          </template>
        </van-field>
      </van-cell-group>

      <div class="submit-btn">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          保存
        </van-button>
      </div>

      <!-- 分享链接 -->
      <div class="share-section" v-if="form.slug">
        <van-cell-group inset>
          <van-cell title="我的主页链接" :value="shareUrl" is-link @click="copyShareUrl" />
        </van-cell-group>
      </div>
    </van-form>

    <AdminTabbar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { userApi } from '@/api'
import AdminTabbar from '@/components/AdminTabbar.vue'

const loading = ref(false)
const avatarList = ref([])

const form = reactive({
  nickname: '',
  avatar_url: '',
  wechat_id: '',
  announcement: '',
  slug: ''
})

const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23FF6B6B"/%3E%3Ctext x="50" y="60" text-anchor="middle" fill="white" font-size="30"%3E%E6%AF%9B%3C/text%3E%3C/svg%3E'

const shareUrl = computed(() => {
  return form.slug ? `${window.location.origin}/s/${form.slug}` : ''
})

const fetchProfile = async () => {
  try {
    const res = await userApi.getProfile()
    if (res.code === 0) {
      Object.assign(form, res.data)
    }
  } catch (error) {
    showToast('加载失败')
  }
}

const handleAvatarUpload = async (file) => {
  // 简化处理，实际需要上传到服务器
  file.status = 'done'
  form.avatar_url = file.content
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await userApi.updateProfile(form)
    if (res.code === 0) {
      showSuccessToast('保存成功')
    }
  } catch (error) {
    showToast(error.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const copyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    showSuccessToast('链接已复制')
  } catch {
    showToast('复制失败')
  }
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.submit-btn {
  padding: 24px 16px;
}

.slug-preview {
  font-size: 12px;
  color: #999;
}

.share-section {
  margin-top: -8px;
}
</style>
