<template>
  <van-uploader
    v-model="fileList"
    :max-count="maxCount"
    :after-read="handleAfterRead"
    :before-read="handleBeforeRead"
    :accept="accept"
    :preview-size="previewSize"
    :deletable="deletable"
    @delete="handleDelete"
  >
    <template v-if="$slots.default" #default>
      <slot></slot>
    </template>
  </van-uploader>
</template>

<script setup>
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { uploadApi } from '@/api'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  maxCount: {
    type: Number,
    default: 9
  },
  maxSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB
  },
  accept: {
    type: String,
    default: 'image/*'
  },
  type: {
    type: String,
    default: 'work' // work, avatar, reference
  },
  previewSize: {
    type: [Number, String],
    default: 80
  },
  deletable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'error'])

const fileList = ref([])

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.length > 0) {
    fileList.value = newVal.map(url => ({
      url,
      status: 'done'
    }))
  }
}, { immediate: true })

// 读取前校验
const handleBeforeRead = (file) => {
  const files = Array.isArray(file) ? file : [file]

  for (const f of files) {
    if (f.size > props.maxSize) {
      showToast(`文件大小不能超过${props.maxSize / 1024 / 1024}MB`)
      return false
    }

    if (!f.type.startsWith('image/')) {
      showToast('请选择图片文件')
      return false
    }
  }

  return true
}

// 读取后上传
const handleAfterRead = async (file) => {
  const files = Array.isArray(file) ? file : [file]

  for (const f of files) {
    f.status = 'uploading'
    f.message = '上传中...'

    try {
      // 获取预签名URL
      const presignRes = await uploadApi.getPresignUrl(
        props.type,
        f.file.name,
        f.file.type
      )

      if (presignRes.code !== 0) {
        throw new Error(presignRes.message)
      }

      const { upload_url, file_url } = presignRes.data

      // 上传到OSS/本地
      const uploadSuccess = await uploadApi.uploadToOss(upload_url, f.file)

      if (!uploadSuccess) {
        throw new Error('上传失败')
      }

      f.status = 'done'
      f.url = file_url
      f.message = ''

      emit('success', file_url)
      updateModelValue()
    } catch (error) {
      f.status = 'failed'
      f.message = '上传失败'
      emit('error', error)
    }
  }
}

// 删除
const handleDelete = (_file) => {
  updateModelValue()
}

// 更新modelValue
const updateModelValue = () => {
  const urls = fileList.value
    .filter(f => f.status === 'done' && f.url)
    .map(f => f.url)
  emit('update:modelValue', urls)
}
</script>
