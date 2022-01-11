import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { usePopperContainer } from '@element-plus/hooks'
import { genTooltipProvides } from '../test-helper/provides'
import ElTooltipContent from '../src/content.vue'
import { TOOLTIP_INJECTION_KEY } from '../src/tokens'

const AXIOM = 'rem is the best girl'

describe('<ElTooltipContent />', () => {
  const {
    controlled,
    id,
    open,
    trigger,
    onOpen,
    onClose,
    onToggle,
    onShow,
    onHide,
  } = genTooltipProvides()

  const defaultProvide = {
    [TOOLTIP_INJECTION_KEY as symbol]: {
      controlled,
      id,
      open,
      trigger,
      onOpen,
      onClose,
      onToggle,
      onShow,
      onHide,
    },
  }

  let unmount
  const createComponent = (props = {}, provides = {}) => {
    const wrapper = mount(
      {
        components: {
          ElTooltipContent,
        },
        template: `<el-tooltip-content><slot /></el-tooltip-content>`,
        setup() {
          usePopperContainer()
        },
      },
      {
        props,
        global: {
          provide: {
            ...defaultProvide,
            ...provides,
          },
          stubs: ['ElPopperContent'],
        },
        slots: {
          default: () => [AXIOM],
        },

        attachTo: document.body,
      }
    )

    unmount = () => wrapper.unmount()
    return wrapper.findComponent(ElTooltipContent)
  }

  let wrapper: ReturnType<typeof createComponent>
  const OLD_ENV = process.env.NODE_ENV
  beforeAll(() => {
    process.env.NODE_ENV = 'test'
  })

  afterAll(() => {
    process.env.NODE_ENV = OLD_ENV
  })

  afterEach(() => {
    ;[onOpen, onClose, onToggle, onShow, onHide].forEach((fn) => fn.mockClear())
    open.value = false
    controlled.value = false
    trigger.value = 'hover'
    unmount?.()
    document.body.innerHTML = ''
  })

  describe('rendering', () => {
    it('should render nothing initially when not controlled', async () => {
      wrapper = createComponent()
      await nextTick()

      expect(wrapper.text()).toBe('')
    })

    describe('persistent content', () => {
      it('should be able to inherit style', async () => {
        const customStyle = {
          position: 'absolute',
        }

        wrapper = createComponent({
          style: customStyle,
        })
        await nextTick()

        expect(wrapper.vm.contentStyle).toEqual(customStyle)
      })
    })

    describe('content rendering', () => {
      it('should not show the content when disabled', async () => {
        wrapper = createComponent({
          disabled: true,
        })

        await nextTick()

        expect(wrapper.vm.shouldShow).toBe(false)
      })
    })

    describe('events', () => {
      beforeEach(async () => {
        wrapper = createComponent()
        await nextTick()
        open.value = true
        await nextTick()
        await nextTick()
      })

      it('should be able to enter trigger', async () => {
        const { vm } = wrapper
        expect(onOpen).not.toHaveBeenCalled()
        const enterEvent = new MouseEvent('mouseenter')
        vm.onContentEnter(enterEvent)
        expect(onOpen).toHaveBeenCalled()
        const leaveEvent = new MouseEvent('mouseleave')
        expect(onClose).not.toHaveBeenCalled()
        vm.onContentLeave(leaveEvent)
        expect(onClose).toHaveBeenCalled()
      })

      it('should not trigger close event when the trigger is not hover', async () => {
        const { vm } = wrapper

        trigger.value = 'click'
        await nextTick()
        const leaveEvent = new MouseEvent('mouseleave')
        expect(onClose).not.toHaveBeenCalled()
        vm.onContentLeave(leaveEvent)
        expect(onClose).not.toHaveBeenCalled()
      })

      it('should be able to stop triggering when controlled', async () => {
        controlled.value = true
        await nextTick()
        const { vm } = wrapper

        expect(onOpen).not.toHaveBeenCalled()
        const enterEvent = new MouseEvent('mouseenter')
        vm.onContentEnter(enterEvent)
        expect(onOpen).not.toHaveBeenCalled()
        const leaveEvent = new MouseEvent('mouseleave')
        expect(onClose).not.toHaveBeenCalled()
        vm.onContentLeave(leaveEvent)
        expect(onClose).not.toHaveBeenCalled()
      })

      describe('onCloseOutside', () => {
        beforeEach(() => {
          // Have to mock this ref because we are not going to render the content in this component
          wrapper.vm.contentRef = {
            popperContentRef: document.createElement('div'),
          } as any
        })

        it('should not close the content after click outside when trigger is hover', async () => {
          document.body.click()
          await nextTick()
          expect(onClose).not.toHaveBeenCalled()
        })

        it('should not close the content after click outside when controlled', async () => {
          controlled.value = true
          trigger.value = 'click'
          await nextTick()

          document.body.click()
          await nextTick()
          expect(onClose).not.toHaveBeenCalled()
        })

        it('should close component after click outside', async () => {
          trigger.value = 'click'

          document.body.click()
          await nextTick()

          expect(onClose).toHaveBeenCalled()
        })
      })
    })
  })
})