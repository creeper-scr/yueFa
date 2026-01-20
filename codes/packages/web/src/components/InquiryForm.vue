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

      <!-- PRD F-01 头围数据 -->
      <van-field
        v-model="form.head_circumference"
        name="head_circumference"
        label="头围"
        placeholder="如: 56cm"
      >
        <template #button>
          <van-icon name="question-o" @click="showHeadMeasureGuide = true" />
        </template>
      </van-field>

      <!-- PRD F-01 头围备注 -->
      <van-field
        v-model="form.head_notes"
        name="head_notes"
        label="头型备注"
        placeholder="如: 头型偏扁、后脑勺平"
      />

      <!-- PRD F-03 毛坯来源 -->
      <van-field name="wig_source" label="毛坯来源">
        <template #input>
          <van-radio-group v-model="form.wig_source" direction="horizontal">
            <van-radio name="client_sends">我来寄</van-radio>
            <van-radio name="stylist_buys">毛娘代购</van-radio>
          </van-radio-group>
        </template>
      </van-field>

      <van-field
        v-model="form.budget_range"
        name="budget_range"
        label="预算范围"
        placeholder="如: 400-600"
      />

      <!-- PRD F-01 特殊要求 -->
      <van-field
        v-model="form.special_requirements"
        name="special_requirements"
        label="特殊要求"
        type="textarea"
        placeholder="发际线要求、炸毛效果、鬓角处理等"
        rows="2"
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

    <!-- 头围测量指南 -->
    <van-popup
      v-model:show="showHeadMeasureGuide"
      position="center"
      :style="{ width: '90%', maxWidth: '320px' }"
      round
    >
      <div class="head-measure-guide">
        <h3>头围测量方法</h3>
        <div class="guide-content">
          <div class="guide-step">
            <span class="step-num">1</span>
            <p>准备一条软尺或绳子</p>
          </div>
          <div class="guide-step">
            <span class="step-num">2</span>
            <p>将软尺绕过额头最突出处、耳朵上方、后脑勺最突出处</p>
          </div>
          <div class="guide-step">
            <span class="step-num">3</span>
            <p>记录软尺交汇处的数值(单位: cm)</p>
          </div>
          <div class="guide-tip">
            <van-icon name="info-o" />
            <span>一般成人头围在 54-58cm 之间</span>
          </div>
        </div>
        <van-button block type="primary" @click="showHeadMeasureGuide = false">
          我知道了
        </van-button>
      </div>
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
const showHeadMeasureGuide = ref(false)
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
  head_notes: '',
  wig_source: 'client_sends',
  budget_range: '',
  special_requirements: '',
  reference_images: []
})

const onDateConfirm = ({ selectedValues }) => {
  form.expected_deadline = selectedValues.join('-')
  showDatePicker.value = false
}

const handleUpload = async (file) => {
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

const reset = () => {
  Object.assign(form, {
    customer_name: '',
    customer_contact: '',
    character_name: '',
    source_work: '',
    expected_deadline: '',
    head_circumference: '',
    head_notes: '',
    wig_source: 'client_sends',
    budget_range: '',
    special_requirements: '',
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

.head-measure-guide {
  padding: 20px;
}

.head-measure-guide h3 {
  text-align: center;
  margin-bottom: 16px;
  font-size: 16px;
}

.guide-content {
  margin-bottom: 16px;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--van-primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  margin-right: 12px;
}

.guide-step p {
  margin: 0;
  line-height: 24px;
  font-size: 14px;
  color: #333;
}

.guide-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  margin-top: 16px;
}
</style>
