<template>
  <div class="work-gallery">
    <!-- 空状态 -->
    <van-empty v-if="works.length === 0" description="暂无作品" />

    <!-- 瀑布流布局 -->
    <div v-else class="gallery-container">
      <div class="gallery-column" v-for="(column, index) in columns" :key="index">
        <div
          v-for="work in column"
          :key="work.id"
          class="work-item"
          @click="handleClick(work)"
        >
          <van-image
            :src="work.thumbnail_url || work.image_url"
            fit="cover"
            class="work-image"
            :lazy-load="true"
          >
            <template #loading>
              <van-loading type="spinner" size="20" />
            </template>
            <template #error>
              <div class="image-error">加载失败</div>
            </template>
          </van-image>
          <div class="work-info" v-if="work.title || work.source_work">
            <div class="work-title" v-if="work.title">{{ work.title }}</div>
            <div class="work-source" v-if="work.source_work">{{ work.source_work }}</div>
          </div>
          <div class="work-tags" v-if="work.tags && work.tags.length > 0">
            <van-tag
              v-for="tag in work.tags.slice(0, 3)"
              :key="tag"
              size="small"
              type="primary"
              plain
            >
              {{ tag }}
            </van-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showPreview"
      :images="previewImages"
      :start-position="previewIndex"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  works: {
    type: Array,
    default: () => []
  },
  columnCount: {
    type: Number,
    default: 2
  },
  clickable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click'])

const showPreview = ref(false)
const previewIndex = ref(0)

// 预览图片列表
const previewImages = computed(() => {
  return props.works.map(w => w.image_url)
})

// 将作品分配到列中
const columns = computed(() => {
  const cols = Array.from({ length: props.columnCount }, () => [])
  props.works.forEach((work, index) => {
    cols[index % props.columnCount].push(work)
  })
  return cols
})

const handleClick = (work) => {
  if (props.clickable) {
    const index = props.works.findIndex(w => w.id === work.id)
    previewIndex.value = index
    showPreview.value = true
  }
  emit('click', work)
}
</script>

<style scoped>
.work-gallery {
  width: 100%;
}

.gallery-container {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.gallery-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.work-image {
  width: 100%;
  display: block;
}

.work-info {
  padding: 8px;
}

.work-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.work-source {
  font-size: 12px;
  color: #999;
}

.work-tags {
  padding: 0 8px 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 12px;
}
</style>
