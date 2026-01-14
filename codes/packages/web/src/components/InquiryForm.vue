<template>
  <van-form @submit="handleSubmit" class="inquiry-form">
    <van-cell-group inset>
      <van-field
        v-model="form.customer_name"
        name="customer_name"
        label="称呼"
        placeholder="您的称呼"
        :rules="[{ required: true, message: '请填写称呼' }]"
      />

      <van-field
        v-model="form.customer_contact"
        name="customer_contact"
        label="联系方式"
        placeholder="微信号/QQ/手机号"
        :rules="[{ required: true, message: '请填写联系方式' }]"
      />

      <van-field
        v-model="form.character_name"
        name="character_name"
        label="角色名"
        placeholder="想要的角色名称"
        :rules="[{ required: true, message: '请填写角色名' }]"
      />

      <van-field
        v-model="form.source_work"
        name="source_work"
        label="作品出处"
        placeholder="角色所属的作品/游戏"
      />

      <van-field
        v-model="form.expected_deadline"
        name="expected_deadline"
        label="期望交付"
        placeholder="选择期望交付日期"
        readonly
        is-link
        @click="showDatePicker = true"
      />

      <van-field
        v-model="form.head_circumference"
        name="head_circumference"
        label="头围"
        placeholder="如: 56cm"
      />

      <van-field
        v-model="form.budget_range"
        name="budget_range"
        label="预算范围"
        placeholder="如: 400-600"
      />

      <van-field
        v-model="form.requirements"
        name="requirements"
        label="其他要求"
        type="textarea"
        placeholder="请详细描述您的需求和特殊要求"
        rows="3"
        autosize
      />

      <!-- 人设图上传 -->
      <van-field name="reference_images" label="人设图">
        <template #input>
          <van-uploader
            v-model="fileList"
            :max-count="5"
            :after-read="handleUpload"
            accept="image/*"
            preview-size="80"
          />
        </template>
      </van-field>
    </van-cell-group>

    <div class="submit-btn">
      <van-button round block type="primary" native-type="submit" :loading="loading">
        提交询价
      </van-button>
    </div>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="selectedDate"
        :min-date="minDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </van-form>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { showToast } from 'vant'

const props = defineProps({
  userSlug: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['submit'])

const loading = ref(false)
const showDatePicker = ref(false)
const fileList = ref([])
const minDate = new Date()
const selectedDate = ref([])

const form = reactive({
  customer_name: '',
  customer_contact: '',
  character_name: '',
  source_work: '',
  expected_deadline: '',
  head_circumference: '',
  budget_range: '',
  requirements: '',
  reference_images: []
})

const onDateConfirm = ({ selectedValues }) => {
  form.expected_deadline = selectedValues.join('-')
  showDatePicker.value = false
}

const handleUpload = async (file) => {
  // 这里需要实际上传到服务器
  // 目前暂时使用base64预览
  file.status = 'done'
  form.reference_images.push(file.content)
}

const handleSubmit = async () => {
  loading.value = true
  try {
    const data = {
      user_slug: props.userSlug,
      ...form
    }
    emit('submit', data)
  } catch (error) {
    showToast(error.message || '提交失败')
  } finally {
    loading.value = false
  }
}

// 重置表单
const reset = () => {
  Object.assign(form, {
    customer_name: '',
    customer_contact: '',
    character_name: '',
    source_work: '',
    expected_deadline: '',
    head_circumference: '',
    budget_range: '',
    requirements: '',
    reference_images: []
  })
  fileList.value = []
}

defineExpose({ reset })
</script>

<style scoped>
.inquiry-form {
  padding: 16px 0;
}

.submit-btn {
  padding: 16px;
}
</style>
