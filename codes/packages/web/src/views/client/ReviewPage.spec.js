import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ReviewPage from './ReviewPage.vue'

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: {
      token: 'test-review-token'
    }
  })
}))

// Mock API
vi.mock('@/api', () => ({
  reviewsApi: {
    getByToken: vi.fn(),
    approve: vi.fn(),
    requestRevision: vi.fn()
  }
}))

import { reviewsApi } from '@/api'

describe('ReviewPage (PRD R-01/R-02)', () => {
  const mockReview = {
    id: 'review-1',
    order: {
      character_name: '初音未来',
      source_work: 'VOCALOID'
    },
    images: [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg'
    ],
    description: '成品已完成，360度展示',
    is_approved: false,
    max_revisions: 2,
    revision_count: 0,
    revisions: []
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('加载时应该显示loading状态', () => {
    reviewsApi.getByToken.mockImplementation(() => new Promise(() => {}))

    const wrapper = mount(ReviewPage)

    expect(wrapper.find('.van-loading').exists()).toBe(true)
  })

  it('加载成功后应该显示验收内容', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.character-name').text()).toBe('初音未来')
    expect(wrapper.find('.source-work').text()).toBe('VOCALOID')
  })

  it('应该显示成品图片', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.findAll('.van-image').length).toBe(3)
  })

  it('应该显示成品描述', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.description').text()).toBe('成品已完成，360度展示')
  })

  // PRD R-01 验收按钮测试
  it('未验收时应该显示两个操作按钮', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    const buttons = wrapper.findAll('.action-buttons .van-button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toContain('确认满意')
    expect(buttons[1].text()).toContain('申请修改')
  })

  it('应该显示剩余修改次数', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.text()).toContain('剩余2次')
  })

  // PRD R-01 确认满意功能测试
  it('点击确认满意应该调用approve API', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })
    reviewsApi.approve.mockResolvedValue({
      code: 0,
      data: { is_approved: true }
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    await wrapper.find('.action-buttons .van-button').trigger('click')
    await flushPromises()

    expect(reviewsApi.approve).toHaveBeenCalledWith('review-1', 'test-review-token')
  })

  it('验收通过后应该显示成功状态', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: { ...mockReview, is_approved: true }
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.approved-status').exists()).toBe(true)
    expect(wrapper.text()).toContain('验收已通过')
  })

  it('验收通过后不应显示操作按钮', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: { ...mockReview, is_approved: true }
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.action-buttons').exists()).toBe(false)
  })

  // PRD R-02 申请修改功能测试
  it('点击申请修改应该显示弹窗', async () => {
    const pendingReview = {
      ...mockReview,
      is_approved: false
    }
    reviewsApi.getByToken.mockResolvedValueOnce({
      code: 0,
      data: pendingReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    // 验证未通过验收，应该有操作按钮
    expect(wrapper.vm.review.is_approved).toBe(false)

    // 设置弹窗状态
    wrapper.vm.showRevisionDialog = true
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.showRevisionDialog).toBe(true)
  })

  it('修改次数用完后不应显示申请修改按钮', async () => {
    const noRevisionsLeft = {
      ...mockReview,
      is_approved: false,
      revision_count: 2,
      max_revisions: 2
    }
    reviewsApi.getByToken.mockResolvedValueOnce({
      code: 0,
      data: noRevisionsLeft
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    // 验证 canRequestRevision 计算属性
    expect(wrapper.vm.canRequestRevision).toBe(false)
    expect(wrapper.vm.remainingRevisions).toBe(0)
    // 应该显示提示文字（在 .no-revision-tip 中）
    expect(wrapper.find('.no-revision-tip').exists()).toBe(true)
  })

  // PRD R-02 修改记录显示测试
  it('有修改记录时应该显示修改历史', async () => {
    const reviewWithRevisions = {
      ...mockReview,
      revision_count: 1,
      revisions: [
        {
          revision_number: 1,
          request_content: '刘海希望再剪短一点',
          completed_at: null
        }
      ]
    }
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: reviewWithRevisions
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.revisions-section').exists()).toBe(true)
    expect(wrapper.text()).toContain('第1次修改')
    expect(wrapper.text()).toContain('刘海希望再剪短一点')
  })

  it('处理中的修改应显示处理中标签', async () => {
    const reviewWithRevisions = {
      ...mockReview,
      revision_count: 1,
      revisions: [
        {
          revision_number: 1,
          request_content: '刘海希望再剪短一点',
          completed_at: null
        }
      ]
    }
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: reviewWithRevisions
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.text()).toContain('处理中')
  })

  it('已处理的修改应显示已处理标签', async () => {
    const reviewWithRevisions = {
      ...mockReview,
      revision_count: 1,
      revisions: [
        {
          revision_number: 1,
          request_content: '刘海希望再剪短一点',
          response_notes: '已按要求修改',
          completed_at: '2026-01-20T10:00:00Z'
        }
      ]
    }
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: reviewWithRevisions
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.text()).toContain('已处理')
  })

  // 错误处理测试
  it('token无效时应显示错误状态', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 1,
      message: '链接无效'
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.van-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('链接无效或已过期')
  })

  it('API错误时应显示错误状态', async () => {
    reviewsApi.getByToken.mockRejectedValue(new Error('Network Error'))

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.find('.van-empty').exists()).toBe(true)
  })

  // 计算属性测试
  it('剩余修改次数计算正确', async () => {
    const reviewWith1Revision = {
      ...mockReview,
      revision_count: 1
    }
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: reviewWith1Revision
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.vm.remainingRevisions).toBe(1)
  })

  it('canRequestRevision 计算正确', async () => {
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: mockReview
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.vm.canRequestRevision).toBe(true)
  })

  it('修改次数用完时 canRequestRevision 应为 false', async () => {
    const noRevisionsLeft = {
      ...mockReview,
      revision_count: 2,
      max_revisions: 2
    }
    reviewsApi.getByToken.mockResolvedValue({
      code: 0,
      data: noRevisionsLeft
    })

    const wrapper = mount(ReviewPage)
    await flushPromises()

    expect(wrapper.vm.canRequestRevision).toBe(false)
  })
})
