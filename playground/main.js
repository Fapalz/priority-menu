import '../build/index.css'
import PriorityMenu from '../build/index.esm.browser'

const nav = new PriorityMenu('.page-navigation', {
  itemsListSelector: 'ul',
  menuItemClass: 'page-navigation__item',
  dropdownToogleClass: 'page-navigation__link',
  updateWidthOnResize: true,
  breakpointDestroy: '(max-width: 769px)',
  ready: (menu) => {
    const resize = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.target.hasAttribute(menu.options.dataOverflowItem)) {
          if (menu.resizeListener) {
            menu.resizeListener()
          }
        }
      })
    })

    const navListItems = menu.itemsList.children

    for (let i = 0; i < navListItems.length; i += 1) {
      const item = navListItems[i]
      resize.observe(item)
    }
  },
})
