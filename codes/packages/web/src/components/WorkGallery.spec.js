import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WorkGallery from './WorkGallery.vue'

describe('WorkGallery', () => {
  const mockWorks = [
    {
      id: 'work-1',
      title: '测试作品1',
      source_work: 'VOCALOID',
      image_url: 'https://example.com/1.jpg',
      thumbnail_url: 'https://example.com/1-thumb.jpg',
      tags: ['长发', '蓝色', '双马尾']
    },
    {
      id: 'work-2',
      title: '测试作品2',
      source_work: '原神',
      image_url: 'https://example.com/2.jpg',
      tags: ['短发']
    },
    {
      id: 'work-3',
      title: '测试作品3',
      source_work: '明日方舟',
      image_url: 'https://example.com/3.jpg',
      tags: []
    }
  ]

  it('作品列表为空时应显示空状态', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: [] }
    })

    // 空状态时不显示gallery-container
    expect(wrapper.find('.gallery-container').exists()).toBe(false)
    expect(wrapper.text()).toContain('暂无作品')
  })

  it('有作品时应显示作品列表', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    expect(wrapper.find('.gallery-container').exists()).toBe(true)
  })

  it('应该将作品分配到正确数量的列中', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, columnCount: 2 }
    })

    const columns = wrapper.findAll('.gallery-column')
    expect(columns.length).toBe(2)
  })

  it('应该按顺序将作品分配到各列', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, columnCount: 2 }
    })

    // 3个作品，2列：第一列2个，第二列1个
    const columns = wrapper.findAll('.gallery-column')
    const firstColumnWorks = columns[0].findAll('.work-item')
    const secondColumnWorks = columns[1].findAll('.work-item')

    expect(firstColumnWorks.length).toBe(2)
    expect(secondColumnWorks.length).toBe(1)
  })

  it('应该显示作品标题和出处', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    expect(wrapper.text()).toContain('测试作品1')
    expect(wrapper.text()).toContain('VOCALOID')
    expect(wrapper.text()).toContain('测试作品2')
    expect(wrapper.text()).toContain('原神')
  })

  it('应该显示作品标签', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    // 验证标签文本存在
    expect(wrapper.text()).toContain('长发')
    expect(wrapper.text()).toContain('蓝色')
    expect(wrapper.text()).toContain('双马尾')
    expect(wrapper.text()).toContain('短发')
  })

  it('没有标题时不应显示标题区域', () => {
    const worksWithoutTitle = [{
      id: 'work-1',
      image_url: 'https://example.com/1.jpg'
    }]

    const wrapper = mount(WorkGallery, {
      props: { works: worksWithoutTitle }
    })

    expect(wrapper.find('.work-info').exists()).toBe(false)
  })

  it('点击作品应触发click事件', async () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    await wrapper.find('.work-item').trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0][0]).toEqual(mockWorks[0])
  })

  it('clickable为true时点击应打开预览', async () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, clickable: true }
    })

    await wrapper.find('.work-item').trigger('click')

    // 检查预览组件应该显示
    expect(wrapper.vm.showPreview).toBe(true)
    expect(wrapper.vm.previewIndex).toBe(0)
  })

  it('clickable为false时点击不应打开预览', async () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, clickable: false }
    })

    await wrapper.find('.work-item').trigger('click')

    expect(wrapper.vm.showPreview).toBe(false)
  })

  it('预览图片列表应包含所有作品原图', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    expect(wrapper.vm.previewImages).toEqual([
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg'
    ])
  })

  it('自定义列数应该生效', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, columnCount: 3 }
    })

    const columns = wrapper.findAll('.gallery-column')
    expect(columns.length).toBe(3)
  })

  it('默认列数应该是2', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks }
    })

    const columns = wrapper.findAll('.gallery-column')
    expect(columns.length).toBe(2)
  })

  it('columns计算属性应正确分配作品', () => {
    const wrapper = mount(WorkGallery, {
      props: { works: mockWorks, columnCount: 2 }
    })

    const columns = wrapper.vm.columns
    // work-1 -> col 0, work-2 -> col 1, work-3 -> col 0
    expect(columns[0].length).toBe(2)
    expect(columns[1].length).toBe(1)
    expect(columns[0][0].id).toBe('work-1')
    expect(columns[1][0].id).toBe('work-2')
    expect(columns[0][1].id).toBe('work-3')
  })
})
