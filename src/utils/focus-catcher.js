export const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
  'select:not([disabled]):not([aria-hidden])',
  'textarea:not([disabled]):not([aria-hidden])',
  'button:not([disabled]):not([aria-hidden])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])'
]

export function getFocusableNodes(container) {
  if (!container) return
  const nodes = container.querySelectorAll(FOCUSABLE_ELEMENTS)
  return Array(...nodes)
}

/**
 * Tries to set focus on a node which is not a close trigger
 * if no other nodes exist then focuses on first close trigger
 */
export function setFocusToFirstNode(container) {
  if (!container) return
  
  const focusableNodes = getFocusableNodes(container)

  // no focusable nodes
  if (focusableNodes.length === 0) return
  focusableNodes[0].focus()

  // // remove nodes on whose click, the modal closes
  // // could not think of a better name :(
  // const nodesWhichAreNotCloseTargets = focusableNodes.filter(node => {
  //   return !node.hasAttribute(this.config.closeTrigger)
  // })
  // nodesWhichAreNotCloseTargets[0].focus()

  // if (nodesWhichAreNotCloseTargets.length > 0) nodesWhichAreNotCloseTargets[0].focus()
  // if (nodesWhichAreNotCloseTargets.length === 0) focusableNodes[0].focus()
}

export function retainFocus(event, container) {
  let focusableNodes = getFocusableNodes(container)

  // no focusable nodes
  if (focusableNodes.length === 0) return

  /**
   * Filters nodes which are hidden to prevent
   * focus leak outside modal
   */
  focusableNodes = focusableNodes.filter(node => {
    return (node.offsetParent !== null)
  })


  // if disableFocus is true
  if (!container.contains(document.activeElement)) {
    focusableNodes[0].focus();
    event.preventDefault()
  } else {
    const focusedItemIndex = focusableNodes.indexOf(document.activeElement)

    if (event.shiftKey && focusedItemIndex === 0) {
      focusableNodes[focusableNodes.length - 1].focus()
      event.preventDefault()
    }

    if (!event.shiftKey && focusableNodes.length > 0 && focusedItemIndex === focusableNodes.length - 1) {
      focusableNodes[0].focus()
      event.preventDefault()
    }
  }
}