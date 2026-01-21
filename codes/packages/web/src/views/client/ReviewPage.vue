<template>
  <div class="review-page">
    <van-nav-bar title="验收确认" />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <van-loading size="24px" vertical>
        加载中...
      </van-loading>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <van-empty description="链接无效或已过期" />
    </div>

    <!-- 验收内容 -->
    <template v-else-if="review">
      <!-- 订单信息 -->
      <div class="order-info">
        <div class="character-name">
          {{ review.order?.character_name }}
        </div>
        <div v-if="review.order?.source_work" class="source-work">
          {{ review.order.source_work }}
        </div>
      </div>

      <!-- 成品图片 -->
      <div class="images-section">
        <h3 class="section-title">
          成品展示
        </h3>
        <div class="images-grid">
          <van-image
            v-for="(img, index) in review.images"
            :key="index"
            :src="img"
            fit="cover"
            @click="previewImage(index)"
          />
        </div>
        <p v-if="review.description" class="description">
          {{ review.description }}
        </p>
      </div>

      <!-- 已通过验收 -->
      <div v-if="review.is_approved" class="approved-status">
        <van-icon name="checked" color="#07c160" size="48" />
        <h3>验收已通过</h3>
        <p>感谢您的确认，请联系毛娘支付尾款</p>
      </div>

      <!-- 修改记录 -->
      <div v-if="review.revisions?.length > 0" class="revisions-section">
        <h3 class="section-title">
          修改记录
        </h3>
        <div
          v-for="revision in review.revisions"
          :key="revision.revision_number"
          class="revision-item"
        >
          <div class="revision-header">
            <span class="revision-num">第{{ revision.revision_number }}次修改</span>
            <van-tag v-if="revision.completed_at" type="success" size="small">
              已处理
            </van-tag>
            <van-tag v-else type="warning" size="small">
              处理中
            </van-tag>
          </div>
          <div class="revision-request">
            <strong>修改意见：</strong>{{ revision.request_content }}
          </div>
          <div v-if="revision.response_notes" class="revision-response">
            <strong>处理说明：</strong>{{ revision.response_notes }}
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div v-if="!review.is_approved" class="action-buttons">
        <van-button
          type="success"
          block
          round
          size="large"
          :loading="approving"
          @click="handleApprove"
        >
          确认满意，去付尾款
        </van-button>

        <van-button
          v-if="canRequestRevision"
          type="default"
          block
          round
          size="large"
          class="revision-btn"
          @click="showRevisionDialog = true"
        >
          申请修改 (剩余{{ remainingRevisions }}次)
        </van-button>

        <p v-if="!canRequestRevision && !review.is_approved" class="no-revision-tip">
          修改次数已用完，如有问题请联系毛娘协商
        </p>
      </div>
    </template>

    <!-- 修改申请弹窗 -->
    <van-dialog
      v-model:show="showRevisionDialog"
      title="申请修改"
      show-cancel-button
      :before-close="handleRevisionSubmit"
    >
      <div class="revision-form">
        <van-field
          v-model="revisionContent"
          type="textarea"
          rows="4"
          placeholder="请详细描述需要修改的地方..."
          :rules="[{ required: true, message: '请填写修改意见' }]"
        />
        <p class="revision-tip">
          提交后毛娘会尽快处理，剩余修改机会: {{ remainingRevisions }}次
        </p>
      </div>
    </van-dialog>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="review?.images || []"
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { reviewsApi } from '@/api'

const route = useRoute()
const token = route.params.token

const loading = ref(true)
const error = ref(false)
const review = ref(null)
const approving = ref(false)
const showRevisionDialog = ref(false)
const revisionContent = ref('')
const showPreview = ref(false)
const previewIndex = ref(0)

// 计算剩余修改次数
const remainingRevisions = computed(() => {
  if (!review.value) return 0
  return review.value.max_revisions - review.value.revision_count
})

const canRequestRevision = computed(() => {
  return remainingRevisions.value > 0
})

// 加载验收数据
const loadReview = async () => {
  try {
    loading.value = true
    const res = await reviewsApi.getByToken(token)
    if (res.code === 0) {
      review.value = res.data
    } else {
      error.value = true
    }
  } catch (_err) {
    error.value = true
  } finally {
    loading.value = false
  }
}

// 预览图片
const previewImage = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

// 确认满意
const handleApprove = async () => {
  approving.value = true
  try {
    const res = await reviewsApi.approve(review.value.id, token)
    if (res.code === 0) {
      showSuccessToast('感谢确认!')
      review.value.is_approved = true
      review.value.approved_at = new Date().toISOString()
    } else {
      showFailToast(res.message || '操作失败')
    }
  } catch (_err) {
    showFailToast('操作失败')
  } finally {
    approving.value = false
  }
}

// 提交修改申请
const handleRevisionSubmit = async (action) => {
  if (action === 'cancel') {
    return true
  }

  if (!revisionContent.value.trim()) {
    showToast('请填写修改意见')
    return false
  }

  try {
    const res = await reviewsApi.requestRevision(review.value.id, {
      token,
      request_content: revisionContent.value.trim()
    })

    if (res.code === 0) {
      showSuccessToast('修改请求已提交')
      revisionContent.value = ''
      // 刷新数据
      loadReview()
      return true
    } else {
      showFailToast(res.message || '提交失败')
      return false
    }
  } catch (_err) {
    showFailToast('提交失败')
    return false
  }
}

onMounted(() => {
  loadReview()
})
</script>

<style scoped>
.review-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.order-info {
  background: #fff;
  padding: 20px;
  text-align: center;
}

.character-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.source-work {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
}

.images-section {
  background: #fff;
  padding: 16px;
  margin-top: 12px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.images-grid .van-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.description {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.approved-status {
  background: #fff;
  padding: 40px 20px;
  margin-top: 12px;
  text-align: center;
}

.approved-status h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #333;
}

.approved-status p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.revisions-section {
  background: #fff;
  padding: 16px;
  margin-top: 12px;
}

.revision-item {
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  margin-bottom: 12px;
}

.revision-item:last-child {
  margin-bottom: 0;
}

.revision-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.revision-num {
  font-weight: 500;
  color: #333;
}

.revision-request,
.revision-response {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-top: 8px;
}

.action-buttons {
  padding: 20px 16px;
  padding-bottom: 40px;
}

.revision-btn {
  margin-top: 12px;
}

.no-revision-tip {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-top: 12px;
}

.revision-form {
  padding: 16px;
}

.revision-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}
</style>
