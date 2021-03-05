/**
 * PriorityMenu  1.0.0
 * GitHub template for starting new projects
 * https://github.com/Fapalz/library-starter#readme
 *
 * Copyright 2020-2021 Gladikov Kirill - Fapalz <blacesmot@gmail.com>
 *
 * Released under the MIT License
 *
 * Released on: March 5, 2021
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.PriorityMenu = factory());
}(this, (function () { 'use strict';

  var randomString = function randomString(i) {
    var rnd = '';

    while (rnd.length < i) {
      rnd += Math.random().toString(36).substring(2);
    }

    return rnd.substring(0, i);
  };

  var throttle = function throttle(fn, threshhold, scope) {
    if (threshhold === void 0) {
      threshhold = 250;
    }

    var last;
    var deferTimer; // eslint-disable-next-line func-names

    return function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var context = scope || this;
      var now = +new Date();

      if (last && now < last + threshhold) {
        // hold on to it
        clearTimeout(deferTimer);
        deferTimer = setTimeout(function () {
          last = now;
          fn.apply(context, args);
        }, threshhold);
      } else {
        last = now;
        fn.apply(context, args);
      }
    };
  };

  function isDomElement(obj) {
    return !!(obj && obj.nodeType === 1);
  }

  var PriorityMenu = /*#__PURE__*/function () {
    function PriorityMenu(element, options) {
      this.options = PriorityMenu.mergeSettings(options);
      this.element = typeof element === 'string' ? document.querySelector(element) : element;

      if (!isDomElement(this.element)) {
        throw new Error('Element shold be is ELEMENT_NODE, check your parameter');
      }

      this.resizeListener = null;
      this.isInit = false;
      this.mq = false;

      if (window.matchMedia && this.options.breakpointDestroy) {
        this.mq = window.matchMedia(this.options.breakpointDestroy);
        this.mq.addEventListener('change', this.mqDestroy.bind(this));
        this.mqDestroy(this.mq);
      } else {
        this.init();
      }
    }
    /**
     * Overrides default settings with custom ones.
     * @param {Object} options - Optional settings object.
     * @returns {Object} - Custom settings.
     */


    PriorityMenu.mergeSettings = function mergeSettings(options) {
      var settings = {
        // Base
        containerSelector: false,
        containerWidthOffset: 10,
        itemsListSelector: false,
        delay: 300,
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
        dropdownMenuTemplate: '<li {{dataMenu}} class="{{menuItemClass}}" aria-hidden="true">' + '<a id="{{dropdownMenuId}}" href="#" class="{{dropdownToogleClass}}" role="button" aria-haspopup="true" aria-expanded="false">' + '{{dropdownLabel}}' + '</a>' + '<ul class="{{dropdownMenuClass}}" {{dataMenuList}} aria-labelledby="{{dropdownMenuId}}"></ul>' + '</li>',
        moved: function moved() {},
        movedBack: function movedBack() {}
      };
      var userSttings = Object.keys(options);
      userSttings.forEach(function (name) {
        settings[name] = options[name];
      });
      return settings;
    };

    var _proto = PriorityMenu.prototype;

    _proto.mqDestroy = function mqDestroy(mq) {
      if (mq.matches) {
        if (this.isInit) {
          this.destroy();
        }
      } else if (!this.isInit) {
        this.init();
      }
    }
    /**
     * Creates dropdown menu to hold overflowing items
     * @return   {DOMobject}   Overflow menu
     */
    ;

    _proto.createOverflowMenu = function createOverflowMenu() {
      var overflowMenu = this.itemsList.querySelector("[" + this.options.dataMenu + "]");

      if (!overflowMenu) {
        var menuId = this.options.dropdownMenuId ? this.options.dropdownMenuId : "priority-menu-more-" + randomString(6);
        var menuHtml = this.options.dropdownMenuTemplate.replace('{{dropdownLabel}}', this.options.dropdownLabel).replace('{{menuItemClass}}', this.options.menuItemClass).replace('{{dropdownToogleClass}}', this.options.dropdownToogleClass).replace('{{dropdownMenuClass}}', this.options.dropdownMenuClass).replace('{{dataMenu}}', this.options.dataMenu).replace('{{dataMenuToggle}}', this.options.dataMenuToggle).replace('{{dataMenuList}}', this.options.dataMenuList).replace(new RegExp('{{dropdownMenuId}}', 'g'), menuId); // Create DOM structure for the menu

        var menuDOM = document.createElement('div');
        menuDOM.innerHTML = menuHtml; // Append menu as last child of <ul> list
        // NOTE: we could have used innerHTML, but it breaks event listeners and we want to play nicely :)

        this.itemsList.appendChild(menuDOM.firstChild);
        overflowMenu = this.itemsList.querySelector("[" + this.options.dataMenu + "]");
      } // When overFlow menu was not created, throw error


      if (!overflowMenu) throw new Error('overflowMenu does not exist, check your custom dropdownMenuTemplate parameter');
      return overflowMenu;
    }
    /**
     * Function calculates breakpoint for each navigation item
     * @return  {array}  Array of breakpoints
     */
    ;

    _proto.getBreakpoints = function getBreakpoints() {
      // Object to store breakpoints
      var breakpoints = [];
      var navListItems = this.itemsList.children;
      var itemsLength = navListItems.length;
      var stableItemsWidth = 0; // First breakpoint is the width if the dropdown "More"

      var itemBreakpoint = 0; // For each menu item add its width, ignore excluded

      for (var i = 0; i < itemsLength; i += 1) {
        var item = navListItems[i];

        if (item.hasAttribute(this.options.dataMenu)) {
          continue;
        } // Filter stable element


        if (item.hasAttribute(this.options.dataStableItem)) {
          stableItemsWidth += Math.ceil(item.offsetWidth);
          continue;
        }

        itemBreakpoint += Math.ceil(item.offsetWidth);
        breakpoints.push(itemBreakpoint);
      }

      this.stableItemsWidth = stableItemsWidth;
      return breakpoints;
    }
    /**
     * Setup Event listeners
     */
    ;

    _proto.attachEvents = function attachEvents() {
      // Do the priority menu stuff, bind context to the function
      // Listener has to be referenced by a variable so it can be also removed
      if (this.options.delay === 0) {
        this.resizeListener = this.reflowNavigation.bind(this);
      } else {
        this.resizeListener = throttle(this.reflowNavigation, this.options.delay, this);
      }

      window.addEventListener('resize', this.resizeListener);
    }
    /*
     * Detach Event listeners
     */
    ;

    _proto.detachEvents = function detachEvents() {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null; // prevent delayed execution of the function (debounced, throttled)
    }
    /**
     * @returns {number} Dropdown width
     */
    ;

    _proto.updateDropdownMenuWidth = function updateDropdownMenuWidth() {
      var overflowIndex = this.overflowList.children.length;

      if (overflowIndex <= 0) {
        this.dropdownMenuWidth = 0;
      } else if (overflowIndex > 0 && this.dropdownMenuWidth > 0 && !this.options.updateWidthOnResize) {
        return this.dropdownMenuWidth;
      } else {
        this.dropdownMenuWidth = Math.ceil(this.overflowMenu.offsetWidth);
      }

      return this.dropdownMenuWidth;
    }
    /**
     * Get current width of the container
     * @return {number}
     */
    ;

    _proto.updateContainerWidth = function updateContainerWidth() {
      this.containerWidth = Math.ceil(this.container.offsetWidth - this.options.containerWidthOffset);
      return this.containerWidth;
    }
    /**
     * Update all items width and remove old breakpoint
     */
    ;

    _proto.updateItemsWidth = function updateItemsWidth() {
      this.removeAllFromOverflow();
      this.breakpoints = this.getBreakpoints();
    }
    /**
     * Get free width for elements
     * @return {number} container width
     */
    ;

    _proto.getAvailableContainerWidth = function getAvailableContainerWidth() {
      return this.containerWidth - this.stableItemsWidth - this.dropdownMenuWidth;
    }
    /**
     * Move item to overflow menu
     * @param   {DOMObject}   item - Menu item
     * @param   {number}      breakpoint
     * @return  {array}       Items that overflow outside navigation
     */
    ;

    _proto.addToOverflow = function addToOverflow(item, breakpoint) {
      item.setAttribute(this.options.dataOverflowItem, true);
      this.overflowList.insertBefore(item, this.overflowList.firstChild); // ADD: link to overflow menu items

      this.overflowBreakpoints.unshift(breakpoint); // REMOVE: last breakpoint, which coresponds with link width

      this.breakpoints.pop();
      return this.overflowBreakpoints;
    }
    /**
     * Remove item from the overflow menu
     * @param   {DOMObject}   item - Menu item
     * @param   {number}      breakpoint
     * @return  {array}       Items that overflow outside navigation
     */
    ;

    _proto.removeFromOverflow = function removeFromOverflow(item, breakpoint) {
      item.removeAttribute(this.options.dataOverflowItem); // ADD: breakpoint back to the array

      this.breakpoints.push(breakpoint); // REMOVE: first item from overflow menu

      this.overflowBreakpoints.shift(); // Note: AppendChild is buggy with nested submenu

      this.itemsList.insertBefore(item, this.overflowMenu);
      return this.overflowBreakpoints;
    }
    /**
     * Toggles visibility of dropdown menu
     * @param   {boolean}     condition - Condition when overflow menu is visible
     * @return  {DOMObject}   Overflow dropdown menu element
     */
    ;

    _proto.toggleOverflowDropdown = function toggleOverflowDropdown(condition) {
      return this.overflowMenu.setAttribute('aria-hidden', condition);
    }
    /**
     * Get quantity overflow items
     * @return  {number}   Quantity overflow items
     */
    ;

    _proto.getCountOverflowItems = function getCountOverflowItems() {
      var overflowItems = this.overflowList.children;
      var overflowIndex = 0;

      for (var i = 0; i < overflowItems.length; i += 1) {
        if (overflowItems[i].hasAttribute(this.options.dataOverflowItem)) {
          overflowIndex += 1;
        }
      }

      return overflowIndex;
    }
    /**
     * Check priority and overflow
     */
    ;

    _proto.reflowNavigation = function reflowNavigation() {
      // Cancel execution if handler has been already removed
      if (!this.resizeListener) return false;

      if (this.options.updateWidthOnResize) {
        this.updateItemsWidth();
      } // Iterate over current menu items


      var navListItems = this.itemsList.children;
      var menuIndex = navListItems.length;
      var unStableItems = [];

      for (var i = 0; i < navListItems.length; i += 1) {
        var item = navListItems[i];

        if (item.hasAttribute(this.options.dataMenu) || item.hasAttribute(this.options.dataStableItem)) {
          continue;
        }

        unStableItems.push(item);
      }

      this.updateDropdownMenuWidth();
      this.updateContainerWidth();
      menuIndex = unStableItems.length;

      while (menuIndex) {
        menuIndex -= 1;
        var itemBreakpoint = this.breakpoints[menuIndex]; // Add items, which overflow to menu "more"

        if (itemBreakpoint >= this.getAvailableContainerWidth()) {
          this.addToOverflow(unStableItems[menuIndex], itemBreakpoint);
          this.updateDropdownMenuWidth();
        }
      } // Check current overflow menu items


      var overflowIndex = this.getCountOverflowItems(); // Remove items, which can be added back to the menu

      while (overflowIndex) {
        overflowIndex -= 1;

        if (this.overflowBreakpoints[0] < this.getAvailableContainerWidth() || !this.overflowAlways && this.overflowBreakpoints[this.overflowBreakpoints.length - 1] < this.getAvailableContainerWidth() + this.dropdownMenuWidth) {
          this.removeFromOverflow(this.overflowList.children[0], this.overflowBreakpoints[0]);
          this.updateDropdownMenuWidth();
        }
      } // Check the menu more visibility


      return this.toggleOverflowDropdown(this.overflowList.children.length === 0);
    }
    /**
     * Move all items from overflow
     */
    ;

    _proto.removeAllFromOverflow = function removeAllFromOverflow() {
      var overflowIndex = this.getCountOverflowItems();

      while (overflowIndex) {
        overflowIndex -= 1;
        this.removeFromOverflow(this.overflowList.children[0], this.overflowBreakpoints[0]);
      }
    }
    /**
     * Destroys priority navigation elements and listeners
     */
    ;

    _proto.destroy = function destroy() {
      // Destroy navPriority data
      // Remove event listener
      this.detachEvents(); // Add all items back to menu

      var overflowIndex = this.getCountOverflowItems(); // Remove items, which can be added back to the menu

      while (overflowIndex) {
        overflowIndex -= 1;
        this.removeFromOverflow(this.overflowList.children[0], this.overflowBreakpoints[0]);
      } // Remove dropdown


      this.toggleOverflowDropdown(this.overflowList.children.length === 0);
      this.isInit = false;
      return this.element;
    }
    /**
     * Init priority navigation
     */
    ;

    _proto.init = function init() {
      if (this.isInit) {
        return;
      }

      this.container = undefined;
      this.itemsList = undefined;
      this.containerWidth = 0;
      this.dropdownMenuWidth = 0;
      this.stableItemsWidth = 0;
      this.container = this.options.containerSelector && this.element.querySelectorAll(this.options.containerSelector)[0] ? this.element.querySelectorAll(this.options.containerSelector)[0] : this.element;
      this.itemsList = this.options.itemsListSelector && this.element.querySelectorAll(this.options.itemsListSelector)[0] ? this.element.querySelectorAll(this.options.itemsListSelector)[0] : this.element; // Query first unordered list, our global navigation

      this.overflowMenu = this.createOverflowMenu();
      this.overflowList = this.overflowMenu.querySelector("[" + this.options.dataMenuList + "]") || this.overflowMenu.querySelectorAll('ul')[0];

      if (!this.overflowList) {
        throw new Error('overflowList does not exist, check your custom dropdownMenuTemplate parameter');
      }

      this.overflowAlways = this.overflowList.children.length > 0;
      this.overflowBreakpoints = []; // We need style to calculate paddings of the container element

      this.elementStyle = window.getComputedStyle(this.element); // Calculate navigation breakpoints

      this.breakpoints = this.getBreakpoints(); // Initialize nav priority default state

      this.attachEvents();
      this.reflowNavigation();
      this.isInit = true;
    };

    return PriorityMenu;
  }();

  return PriorityMenu;

})));
