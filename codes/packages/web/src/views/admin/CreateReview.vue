<template>
  <div class="create-review-page">
    <van-nav-bar
      title="创建验收"
      left-arrow
      @click-left="$router.back()"
    />

    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <van-loading size="24px" vertical>
        加载中...
      </van-loading>
    </div>

    <template v-else-if="order">
      <!-- 订单信息 -->
      <van-cell-group inset class="order-info">
        <van-cell title="角色" :value="order.character_name" />
        <van-cell v-if="order.source_work" title="作品" :value="order.source_work" />
        <van-cell title="客户" :value="order.customer_name || '未知'" />
      </van-cell-group>

      <!-- 已有验收记录 -->
      <div v-if="existingReview" class="existing-review">
        <van-cell-group inset>
          <van-cell title="验收状态">
            <template #value>
              <van-tag v-if="existingReview.is_approved" type="success">
                已通过
              </van-tag>
              <van-tag v-else type="warning">
                等待客户确认
              </van-tag>
            </template>
          </van-cell>
          <van-cell title="修改次数" :value="`${existingReview.revision_count}/${existingReview.max_revisions}`" />
          <van-cell title="验收链接" is-link @click="copyReviewUrl">
            <template #value>
              <span class="link-text">点击复制</span>
            </template>
          </van-cell>
        </van-cell-group>

        <!-- 现有成品图 -->
        <div class="images-section">
          <h4>成品图片</h4>
          <div class="images-grid">
            <van-image
              v-for="(img, index) in existingReview.images"
              :key="index"
              :src="img"
              fit="cover"
              @click="previewImage(index)"
            />
          </div>
        </div>

        <!-- 待处理的修改请求 -->
        <div v-if="pendingRevision" class="pending-revision">
          <van-notice-bar
            left-icon="warning-o"
            text="客户提交了修改请求，请尽快处理"
            color="#ff976a"
            background="#fffbe8"
          />
          <van-cell-group inset>
            <van-cell title="修改意见">
              <template #label>
                {{ pendingRevision.request_content }}
              </template>
            </van-cell>
          </van-cell-group>
          <div class="revision-action">
            <van-button type="primary" block @click="showRevisionSubmit = true">
              上传修改后的图片
            </van-button>
          </div>
        </div>
      </div>

      <!-- 创建新验收 -->
      <div v-else class="create-form">
        <van-cell-group inset>
          <van-field name="images" label="成品图">
            <template #input>
              <van-uploader
                v-model="fileList"
                :max-count="9"
                :after-read="handleUpload"
                accept="image/*"
                preview-size="80"
              />
            </template>
          </van-field>

          <van-field
            v-model="form.description"
            type="textarea"
            label="描述"
            placeholder="成品说明（可选）"
            rows="3"
            autosize
          />
        </van-cell-group>

        <div class="submit-section">
          <van-button
            type="primary"
            block
            round
            size="large"
            :loading="submitting"
            :disabled="form.images.length === 0"
            @click="handleSubmit"
          >
            创建验收
          </van-button>
          <p class="submit-tip">
            创建后会生成验收链接，发送给客户确认
          </p>
        </div>
      </div>
    </template>

    <!-- 修改图片上传弹窗 -->
    <van-popup
      v-model:show="showRevisionSubmit"
      position="bottom"
      round
      :style="{ maxHeight: '80vh' }"
    >
      <div class="revision-submit-popup">
        <h3>提交修改结果</h3>
        <van-field name="images" label="修改后图片">
          <template #input>
            <van-uploader
              v-model="revisionFileList"
              :max-count="9"
              :after-read="handleRevisionUpload"
              accept="image/*"
              preview-size="80"
            />
          </template>
        </van-field>
        <van-field
          v-model="revisionNotes"
          type="textarea"
          label="修改说明"
          placeholder="说明修改内容（可选）"
          rows="2"
        />
        <div class="popup-actions">
          <van-button
            block
            type="primary"
            :loading="submittingRevision"
            @click="submitRevision"
          >
            提交修改
          </van-button>
        </div>
      </div>
    </van-popup>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="existingReview?.images || []"
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showSuccessToast, showFailToast } from 'vant'
import { ordersApi, reviewsApi } from '@/api'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id

const loading = ref(true)
const order = ref(null)
const existingReview = ref(null)
const fileList = ref([])
const submitting = ref(false)
const showPreview = ref(false)
const previewIndex = ref(0)

// 修改相关
const showRevisionSubmit = ref(false)
const revisionFileList = ref([])
const revisionImages = ref([])
const revisionNotes = ref('')
const submittingRevision = ref(false)

const form = reactive({
  images: [],
  description: ''
})

// 待处理的修改请求
const pendingRevision = computed(() => {
  if (!existingReview.value?.revisions) return null
  return existingReview.value.revisions.find(r => !r.completed_at)
})

// 加载数据
const loadData = async () => {
  try {
    loading.value = true

    // 获取订单信息
    const orderRes = await ordersApi.getDetail(orderId)
    if (orderRes.code === 0) {
      order.value = orderRes.data
    } else {
      showFailToast('订单不存在')
      router.back()
      return
    }

    // 获取验收记录
    const reviewRes = await reviewsApi.getByOrderId(orderId)
    if (reviewRes.code === 0 && reviewRes.data) {
      existingReview.value = reviewRes.data
    }
  } catch (_err) {
    showFailToast('加载失败')
  } finally {
    loading.value = false
  }
}

// 上传图片
const handleUpload = async (file) => {
  file.status = 'done'
  form.images.push(file.content)
}

// 上传修改图片
const handleRevisionUpload = async (file) => {
  file.status = 'done'
  revisionImages.value.push(file.content)
}

// 创建验收
const handleSubmit = async () => {
  if (form.images.length === 0) {
    showToast('请上传成品图片')
    return
  }

  submitting.value = true
  try {
    const res = await reviewsApi.create({
      order_id: orderId,
      images: form.images,
      description: form.description
    })

    if (res.code === 0) {
      showSuccessToast('验收已创建')
      // 刷新数据
      loadData()
    } else {
      showFailToast(res.message || '创建失败')
    }
  } catch (_err) {
    showFailToast('创建失败')
  } finally {
    submitting.value = false
  }
}

// 复制验收链接
const copyReviewUrl = async () => {
  if (!existingReview.value?.review_url) return

  try {
    await navigator.clipboard.writeText(existingReview.value.review_url)
    showSuccessToast('链接已复制')
  } catch {
    showToast('复制失败，请手动复制')
  }
}

// 预览图片
const previewImage = (index) => {
  previewIndex.value = index
  showPreview.value = true
}

// 提交修改结果
const submitRevision = async () => {
  if (revisionImages.value.length === 0) {
    showToast('请上传修改后的图片')
    return
  }

  submittingRevision.value = true
  try {
    const res = await reviewsApi.submitRevision(
      existingReview.value.id,
      pendingRevision.value.id,
      {
        response_images: revisionImages.value,
        response_notes: revisionNotes.value
      }
    )

    if (res.code === 0) {
      showSuccessToast('修改已提交')
      showRevisionSubmit.value = false
      revisionFileList.value = []
      revisionImages.value = []
      revisionNotes.value = ''
      // 刷新数据
      loadData()
    } else {
      showFailToast(res.message || '提交失败')
    }
  } catch (_err) {
    showFailToast('提交失败')
  } finally {
    submittingRevision.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.create-review-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.order-info {
  margin: 16px;
}

.existing-review {
  padding-bottom: 20px;
}

.existing-review .van-cell-group {
  margin: 16px;
}

.link-text {
  color: var(--van-primary-color);
}

.images-section {
  background: #fff;
  padding: 16px;
  margin: 16px;
  border-radius: 8px;
}

.images-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #333;
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

.pending-revision {
  margin-top: 16px;
}

.pending-revision .van-cell-group {
  margin: 12px 16px;
}

.revision-action {
  padding: 16px;
}

.create-form {
  padding-bottom: 20px;
}

.create-form .van-cell-group {
  margin: 16px;
}

.submit-section {
  padding: 20px 16px;
}

.submit-tip {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-top: 12px;
}

.revision-submit-popup {
  padding: 20px;
}

.revision-submit-popup h3 {
  margin: 0 0 16px;
  text-align: center;
  font-size: 16px;
}

.popup-actions {
  margin-top: 20px;
}
</style>
