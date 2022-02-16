import {
  randomString,
  throttle,
  isDomElement,
} from '@fapalz/utils/src/utils/index'

function getWidth(el, type) {
  if (type === 'inner') {
    return el.clientWidth
  }
  if (type === 'outer') {
    return el.offsetWidth
  }
  const s = window.getComputedStyle(el, null)
  if (type === 'width')
    return (
      el.clientWidth -
      parseInt(s.getPropertyValue('padding-left'), 10) -
      parseInt(s.getPropertyValue('padding-right'), 10)
    )
  if (type === 'full') {
    return (
      el.offsetWidth +
      parseInt(s.getPropertyValue('margin-left'), 10) +
      parseInt(s.getPropertyValue('margin-right'), 10)
    )
  }

  return null
}

export default class PriorityMenu {
  constructor(element, options) {
    try {
      this.options = PriorityMenu.mergeSettings(options)

      this.element =
        typeof element === 'string' ? document.querySelector(element) : element
      if (!isDomElement(this.element)) {
        throw new Error(
          'Element shold be is ELEMENT_NODE, check your parameter'
        )
      }

      this.resizeListener = null
      this.isInit = false
      this.matchMedia = false

      if (window.matchMedia && this.options.breakpointDestroy) {
        this.matchMedia = window.matchMedia(this.options.breakpointDestroy)
        this.matchMediaListener = this.matchMediaListener.bind(this)
        this.matchMedia.addEventListener('change', this.matchMediaListener)
        this.matchMediaListener(this.matchMedia)
      } else {
        this.init()
      }
    } catch (error) {
      console.error(error)
    }
  }

  /**
   * Overrides default settings with custom ones.
   * @param {Object} options - Optional settings object.
   * @returns {Object} - Custom settings.
   */
  static mergeSettings(options) {
    const settings = {
      // Base
      containerSelector: false,
      containerWidthOffset: 10,
      itemsListSelector: false,
      delay: 100,
      breakpointDestroy: false,
      updateWidthOnResize: false,

      dropdownMenuId: false,
      dropdownLabel: 'More <i class="caret"></i>',

      // Data attributes
      dataMenu: 'data-priority-menu',
      dataMenuList: 'data-priority-menu-list',
      dataStableItem: 'data-priority-menu-stable',
      dataOverflowItem: 'data-priority-menu-overflow',

      // Classes
      menuItemClass: 'dropdown',
      dropdownToogleClass: 'dropdown-toggle',
      dropdownMenuClass: 'dropdown-menu',

      dropdownMenuTemplate:
        '<li {{dataMenu}} class="{{menuItemClass}}" aria-hidden="true">' +
        '<a id="{{dropdownMenuId}}" href="#" class="{{dropdownToogleClass}}" role="button" aria-haspopup="true" aria-expanded="false">' +
        '{{dropdownLabel}}' +
        '</a>' +
        '<ul class="{{dropdownMenuClass}}" {{dataMenuList}} aria-labelledby="{{dropdownMenuId}}"></ul>' +
        '</li>',

      moved: () => {},
      movedBack: () => {},
      init: () => {},
      initLayout: () => {},
      ready: () => {},
      destroy: () => {},
    }

    const userSttings = Object.keys(options)

    userSttings.forEach((name) => {
      settings[name] = options[name]
    })

    return settings
  }

  matchMediaListener(matchMedia) {
    if (matchMedia.matches) {
      if (this.isInit) {
        this.destroy()
      }
    } else if (!this.isInit) {
      this.init()
    }
  }

  /**
   * Creates dropdown menu to hold overflowing items
   * @return   {DOMobject}   Overflow menu
   */
  createOverflowMenu() {
    let overflowMenu = this.itemsList.querySelector(
      `[${this.options.dataMenu}]`
    )

    if (!overflowMenu) {
      const menuId = this.options.dropdownMenuId
        ? this.options.dropdownMenuId
        : `priority-menu-more-${randomString(6)}`

      const menuHtml = this.options.dropdownMenuTemplate
        .replace('{{dropdownLabel}}', this.options.dropdownLabel)
        .replace('{{menuItemClass}}', this.options.menuItemClass)
        .replace('{{dropdownToogleClass}}', this.options.dropdownToogleClass)
        .replace('{{dropdownMenuClass}}', this.options.dropdownMenuClass)
        .replace('{{dataMenu}}', this.options.dataMenu)
        .replace('{{dataMenuToggle}}', this.options.dataMenuToggle)
        .replace('{{dataMenuList}}', this.options.dataMenuList)
        .replace(new RegExp('{{dropdownMenuId}}', 'g'), menuId)

      // Create DOM structure for the menu
      const menuDOM = document.createElement('div')
      menuDOM.innerHTML = menuHtml

      // Append menu as last child of <ul> list
      // NOTE: we could have used innerHTML, but it breaks event listeners and we want to play nicely :)

      overflowMenu = this.itemsList.appendChild(menuDOM.firstChild)
    }

    // When overFlow menu was not created, throw error
    if (!overflowMenu)
      throw new Error(
        'overflowMenu does not exist, check your custom dropdownMenuTemplate parameter'
      )

    return overflowMenu
  }

  /**
   * Function calculates breakpoint for each navigation item
   * @return  {array}  Array of breakpoints
   */
  getBreakpoints() {
    // Object to store breakpoints
    const breakpoints = []
    const navListItems = this.itemsList.children
    const itemsLength = navListItems.length

    let stableItemsWidth = 0

    // First breakpoint is the width if the dropdown "More"
    let itemBreakpoint = 0
    // For each menu item add its width, ignore excluded

    for (let i = 0; i < itemsLength; i += 1) {
      const item = navListItems[i]

      if (item.hasAttribute(this.options.dataMenu)) {
        continue
      }

      // Filter stable element
      if (item.hasAttribute(this.options.dataStableItem)) {
        stableItemsWidth += Math.ceil(getWidth(item, 'full'))
        continue
      }

      itemBreakpoint += Math.ceil(getWidth(item, 'full'))
      breakpoints.push(itemBreakpoint)
    }

    this.stableItemsWidth = stableItemsWidth

    return breakpoints
  }

  /**
   * Setup Event listeners
   */
  attachEvents() {
    // Do the priority menu stuff, bind context to the function
    // Listener has to be referenced by a variable so it can be also removed
    if (this.options.delay === 0) {
      this.resizeListener = this.reflowNavigation.bind(this)
    } else {
      this.resizeListener = throttle(
        this.reflowNavigation,
        this.options.delay,
        this
      )
    }

    window.addEventListener('resize', this.resizeListener)
  }

  /*
   * Detach Event listeners
   */
  detachEvents() {
    window.removeEventListener('resize', this.resizeListener)
    this.resizeListener = null // prevent delayed execution of the function (debounced, throttled)
  }

  /**
   * @returns {number} Dropdown width
   */
  updateDropdownMenuWidth() {
    const overflowIndex = this.overflowList.children.length

    if (overflowIndex <= 0) {
      this.dropdownMenuWidth = 0
    } else if (
      overflowIndex > 0 &&
      this.dropdownMenuWidth > 0 &&
      !this.options.updateWidthOnResize
    ) {
      return this.dropdownMenuWidth
    } else {
      this.dropdownMenuWidth = Math.ceil(getWidth(this.overflowMenu, 'full'))
    }
    return this.dropdownMenuWidth
  }

  /**
   * Get current width of the container
   * @return {number}
   */
  updateContainerWidth() {
    this.containerWidth = Math.floor(
      getWidth(this.container, 'width') - this.options.containerWidthOffset
    )
    return this.containerWidth
  }

  /**
   * Update all items width and remove old breakpoint
   */
  updateItemsWidth() {
    this.removeAllFromOverflow()
    this.breakpoints = this.getBreakpoints()
  }

  /**
   * Get free width for elements
   * @return {number} container width
   */
  getAvailableContainerWidth() {
    return this.containerWidth - this.stableItemsWidth - this.dropdownMenuWidth
  }

  /**
   * Move item to overflow menu
   * @param   {DOMObject}   item - Menu item
   * @param   {number}      breakpoint
   * @return  {array}       Items that overflow outside navigation
   */
  addToOverflow(item, breakpoint) {
    item.setAttribute(this.options.dataOverflowItem, true)

    this.overflowList.insertBefore(item, this.overflowList.firstChild)
    // ADD: link to overflow menu items
    this.overflowBreakpoints.unshift(breakpoint)

    // REMOVE: last breakpoint, which coresponds with link width
    this.breakpoints.pop()

    this.options.moved.call(this, item, this)

    return this.overflowBreakpoints
  }

  /**
   * Remove item from the overflow menu
   * @param   {DOMObject}   item - Menu item
   * @param   {number}      breakpoint
   * @return  {array}       Items that overflow outside navigation
   */
  removeFromOverflow(item, breakpoint) {
    item.removeAttribute(this.options.dataOverflowItem)
    // ADD: breakpoint back to the array
    this.breakpoints.push(breakpoint)

    // REMOVE: first item from overflow menu
    this.overflowBreakpoints.shift()

    this.itemsList.insertBefore(item, this.overflowMenu)

    this.options.movedBack.call(this, item, this)
    return this.overflowBreakpoints
  }

  /**
   * Toggles visibility of dropdown menu
   * @param   {boolean}     condition - Condition when overflow menu is visible
   * @return  {DOMObject}   Overflow dropdown menu element
   */
  toggleOverflowDropdown(condition) {
    return this.overflowMenu.setAttribute('aria-hidden', condition)
  }

  /**
   * Get quantity overflow items
   * @return  {number}   Quantity overflow items
   */
  getCountOverflowItems() {
    const overflowItems = this.overflowList.children
    let overflowIndex = 0

    for (let i = 0; i < overflowItems.length; i += 1) {
      if (overflowItems[i].hasAttribute(this.options.dataOverflowItem)) {
        overflowIndex += 1
      }
    }
    return overflowIndex
  }

  /**
   * Check priority and overflow
   */
  reflowNavigation() {
    // Cancel execution if handler has been already removed
    if (!this.resizeListener) return false

    if (this.options.updateWidthOnResize) {
      this.updateItemsWidth()
    }

    // Iterate over current menu items
    const navListItems = this.itemsList.children
    const unStableItems = []

    for (let i = 0; i < navListItems.length; i += 1) {
      const item = navListItems[i]
      if (
        item.hasAttribute(this.options.dataMenu) ||
        item.hasAttribute(this.options.dataStableItem)
      ) {
        continue
      }

      unStableItems.push(item)
    }

    this.updateDropdownMenuWidth()
    this.updateContainerWidth()

    let unStableItemsLength = unStableItems.length

    while (unStableItemsLength) {
      unStableItemsLength -= 1
      const itemBreakpoint = this.breakpoints[unStableItemsLength]

      // Add items, which overflow to menu "more"
      if (itemBreakpoint >= this.getAvailableContainerWidth()) {
        this.addToOverflow(unStableItems[unStableItemsLength], itemBreakpoint)
        this.updateDropdownMenuWidth()
      }
    }

    // Check current overflow menu items
    let overflowIndex = this.getCountOverflowItems()

    // Remove items, which can be added back to the menu
    while (overflowIndex) {
      overflowIndex -= 1
      if (
        this.overflowBreakpoints[0] < this.getAvailableContainerWidth() ||
        (!this.overflowAlways &&
          this.overflowBreakpoints[this.overflowBreakpoints.length - 1] <
            this.getAvailableContainerWidth() + this.dropdownMenuWidth)
      ) {
        this.removeFromOverflow(
          this.overflowList.children[0],
          this.overflowBreakpoints[0]
        )
        this.updateDropdownMenuWidth()
      }
    }

    // Check the menu more visibility
    return this.toggleOverflowDropdown(this.overflowList.children.length === 0)
  }

  /**
   * Move all items from overflow
   */
  removeAllFromOverflow() {
    let overflowIndex = this.getCountOverflowItems()

    while (overflowIndex) {
      overflowIndex -= 1
      this.removeFromOverflow(
        this.overflowList.children[0],
        this.overflowBreakpoints[0]
      )
    }
  }

  /**
   * Destroys priority navigation elements and listeners
   */
  destroy() {
    // Destroy navPriority data

    // Remove event listener
    this.detachEvents()

    this.removeAllFromOverflow()

    // Remove dropdown
    this.toggleOverflowDropdown(this.overflowList.children.length === 0)

    this.isInit = false

    this.options.destroy.call(this, this)

    return this.element
  }

  /**
   * Init priority navigation
   */
  init() {
    if (this.isInit) {
      return
    }

    try {
      this.options.init.call(this, this)

      this.container = undefined
      this.itemsList = undefined

      this.containerWidth = 0
      this.dropdownMenuWidth = 0
      this.stableItemsWidth = 0

      this.container =
        this.options.containerSelector &&
        this.element.querySelectorAll(this.options.containerSelector)[0]
          ? this.element.querySelectorAll(this.options.containerSelector)[0]
          : this.element

      this.itemsList =
        this.options.itemsListSelector &&
        this.element.querySelectorAll(this.options.itemsListSelector)[0]
          ? this.element.querySelectorAll(this.options.itemsListSelector)[0]
          : this.element // Query first unordered list, our global navigation

      this.overflowMenu = this.createOverflowMenu()

      this.overflowList =
        this.overflowMenu.querySelector(`[${this.options.dataMenuList}]`) ||
        this.overflowMenu.querySelectorAll('ul')[0]

      if (!this.overflowList) {
        throw new Error(
          'overflowList does not exist, check your custom dropdownMenuTemplate parameter'
        )
      }

      this.overflowAlways = this.overflowList.children.length > 0

      this.overflowBreakpoints = []

      // We need style to calculate paddings of the container element
      // this.elementStyle = window.getComputedStyle(this.element)

      this.options.initLayout.call(this, this)

      // Calculate navigation breakpoints
      this.breakpoints = this.getBreakpoints()

      // Initialize nav priority default state
      this.attachEvents()
      this.reflowNavigation()

      this.isInit = true
      this.options.ready.call(this, this)
    } catch (error) {
      console.error(error)
    }
  }
}
