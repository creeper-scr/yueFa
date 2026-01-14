<template>
  <div class="works-page">
    <van-nav-bar title="作品管理">
      <template #right>
        <van-icon name="add-o" size="20" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <!-- 作品列表 -->
    <div class="works-list">
      <van-loading v-if="loading" class="page-loading" />
      <van-empty v-else-if="works.length === 0" description="暂无作品，点击右上角添加" />
      <template v-else>
        <div
          v-for="work in works"
          :key="work.id"
          class="work-item"
        >
          <van-image :src="work.thumbnail_url || work.image_url" fit="cover" class="work-image" />
          <div class="work-info">
            <div class="work-title">{{ work.title || '未命名' }}</div>
            <div class="work-source">{{ work.source_work || '-' }}</div>
            <div class="work-tags" v-if="work.tags?.length">
              <van-tag v-for="tag in work.tags.slice(0, 2)" :key="tag" size="small" plain>
                {{ tag }}
              </van-tag>
            </div>
          </div>
          <div class="work-actions">
            <van-icon name="edit" @click="editWork(work)" />
            <van-icon name="delete-o" @click="deleteWork(work)" />
          </div>
        </div>
      </template>
    </div>

    <!-- 添加/编辑对话框 -->
    <van-dialog
      v-model:show="showAddDialog"
      :title="editingWork ? '编辑作品' : '添加作品'"
      show-cancel-button
      :before-close="handleDialogClose"
    >
      <van-form ref="formRef">
        <van-cell-group>
          <van-field name="image" label="作品图">
            <template #input>
              <van-uploader
                v-model="imageList"
                :max-count="1"
                :after-read="handleImageUpload"
                accept="image/*"
              />
            </template>
          </van-field>
          <van-field
            v-model="formData.title"
            label="角色名"
            placeholder="如: 雷电将军"
          />
          <van-field
            v-model="formData.source_work"
            label="作品出处"
            placeholder="如: 原神"
          />
          <van-field
            v-model="tagsInput"
            label="标签"
            placeholder="用逗号分隔，如: 长发,渐变紫"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <AdminTabbar />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { worksApi } from '@/api'
import AdminTabbar from '@/components/AdminTabbar.vue'

const loading = ref(false)
const works = ref([])
const showAddDialog = ref(false)
const editingWork = ref(null)
const imageList = ref([])
const tagsInput = ref('')
const formRef = ref(null)

const formData = reactive({
  image_url: '',
  title: '',
  source_work: '',
  tags: []
})

const fetchWorks = async () => {
  loading.value = true
  try {
    const res = await worksApi.getWorks()
    if (res.code === 0) {
      works.value = res.data || []
    }
  } catch (error) {
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

const handleImageUpload = (file) => {
  file.status = 'done'
  formData.image_url = file.content
}

const editWork = (work) => {
  editingWork.value = work
  Object.assign(formData, {
    image_url: work.image_url,
    title: work.title || '',
    source_work: work.source_work || '',
    tags: work.tags || []
  })
  tagsInput.value = (work.tags || []).join(',')
  imageList.value = [{ url: work.image_url, status: 'done' }]
  showAddDialog.value = true
}

const deleteWork = async (work) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '删除后不可恢复，确定要删除这个作品吗？'
    })
    const res = await worksApi.deleteWork(work.id)
    if (res.code === 0) {
      showSuccessToast('删除成功')
      fetchWorks()
    }
  } catch {
    // 取消删除
  }
}

const handleDialogClose = async (action) => {
  if (action !== 'confirm') {
    resetForm()
    return true
  }

  if (!formData.image_url) {
    showToast('请上传作品图')
    return false
  }

  try {
    formData.tags = tagsInput.value ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean) : []

    if (editingWork.value) {
      await worksApi.updateWork(editingWork.value.id, formData)
    } else {
      await worksApi.createWork(formData)
    }

    showSuccessToast(editingWork.value ? '更新成功' : '添加成功')
    fetchWorks()
    resetForm()
    return true
  } catch (error) {
    showToast(error.message || '操作失败')
    return false
  }
}

const resetForm = () => {
  editingWork.value = null
  Object.assign(formData, {
    image_url: '',
    title: '',
    source_work: '',
    tags: []
  })
  tagsInput.value = ''
  imageList.value = []
}

onMounted(() => {
  fetchWorks()
})
</script>

<style scoped>
.works-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.works-list {
  padding: 12px;
}

.work-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.work-image {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  flex-shrink: 0;
}

.work-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.work-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.work-source {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.work-tags {
  margin-top: 4px;
  display: flex;
  gap: 4px;
}

.work-actions {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 18px;
}
</style>
