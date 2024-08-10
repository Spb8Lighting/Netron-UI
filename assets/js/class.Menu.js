export default class Menu {

  #input = document.createElement('i')
  #menu = document.createElement('ul')
  #identify = document.createElement('input')

  #device = undefined
  #EventName = undefined
  #pageChange = undefined
  #latestActive = undefined

  #links = new Map()

  /**
   * Initializes the menu and sets up event listeners.
   * @param {Object} params - The parameters for initializing the menu.
   * @param {string} params.EventName - The event name used for page changes and other interactions.
   * @param {Object} params._DEVICE_ - The device object to interact with.
   * @param {Object} params.config - The configuration object for menu items.
   * @param {HTMLElement} params.toggle - The element used to toggle the menu.
   * @param {HTMLElement} params.menu - The element where the menu will be appended.
   */
  constructor({ EventName, _DEVICE_, config, toggle, menu }) {
    this.#device = _DEVICE_
    this.#EventName = EventName

    this.config = config

    this.#pageChange = new Event(EventName.pageChange)

    this.#createMenu()
    menu.append(this.#menu)

    toggle.parentNode.prepend(this.#createHomeLink())

    this.#input.className = 'btn fa fa-bars'
    this.#input.title = 'Compact the main menu'

    toggle.append(this.#input)

    this.#addEvents()
  }

  /**
   * Creates a home link for the menu.
   * @returns {HTMLAnchorElement} - The home link element.
   */
  #createHomeLink() {
    const a = document.createElement('a')
    a.className = 'm-0 p-0 d-none d-sm-block bg-secondary-subtle'
    a.href = './'

    const span = document.createElement('span')
    span.id = 'logo'
    span.alt = 'Netron'

    a.append(span)

    return a
  }

  /**
   * Generates the HTML structure of the menu based on the provided configuration.
   */
  #createMenu() {
    this.#menu.className = 'nav h-100 flex-column'
    for (const menu in this.config) {
      this.#menu.append(this.#createSubMenu({ name: menu, prop: this.config[menu] }))
    }
  }

  /**
   * Retrieves the parent sub-menu of a given target element.
   * @param {HTMLElement} target - The target element.
   * @returns {HTMLElement} - The parent sub-menu element.
   */
  #getSubMenu(target) {
    return target?.parentNode?.parentNode?.parentNode?.firstChild
  }

  /**
   * Navigates to the specified page by clicking the appropriate link.
   * @param {string} searchPage - The page to navigate to.
   */
  navigate(searchPage) {
    if (this.#links.has(searchPage)) {
      const link = this.#links.get(searchPage)
      const isSubMenu = this.#getSubMenu(link)
      if (isSubMenu.nextSibling) {
        isSubMenu.click()
        link.click()
      } else {
        link.click()
      }
    } else {
      this.#pageChange.detail = searchPage
      document.dispatchEvent(this.#pageChange)
    }
  }

  /**
   * Hides the sub-menu associated with the target element.
   * @param {HTMLElement} target - The target element.
   */
  hideSubMenu(target) {
    const instance = bootstrap.Collapse.getInstance(target.nextSibling)
    instance.hide()
  }

  /**
   * Creates a sub-menu item.
   * @param {Object} params - The parameters for creating the sub-menu item.
   * @param {string} params.name - The name of the sub-menu.
   * @param {Object} params.prop - The properties of the sub-menu item.
   * @returns {HTMLLIElement} - The created sub-menu item element.
   */
  #createSubMenu({ name, prop }) {
    const li = document.createElement('li')
    li.className = 'nav-item'
    if (prop?.restricted) {
      li.dataset.restricted = JSON.stringify(prop.restricted)
    }

    const a = document.createElement('a')
    a.className = 'nav-link'
    a.href = `./?${name}`
    a.innerText = prop.name

    this.#links.set(name, a)

    li.append(a)

    if (prop?.icon) {
      const i = document.createElement('i')
      i.className = `fa fa-fw ${prop.icon}`
      a.prepend(i)
    }

    if (prop?.items) {
      const ul = document.createElement('ul')
      ul.className = 'nav collapse'
      ul.id = name
      ul.dataset.bsParent = '#main-menu'

      a.href = `#${name}`
      a.dataset.bsToggle = 'collapse'
      a.ariaExpanded = 'false'
      a.ariaControls = name

      for (const item in prop.items) {
        ul.append(this.#createSubMenu({ name: `${name}${item[0].toUpperCase() + item.slice(1)}`, prop: prop.items[item] }))
      }
      li.append(ul)
    }

    return li
  }

  /**
   * Creates an "Identify" section displaying device information and a switch to trigger identification.
   * @returns {HTMLLIElement} - The created identify section element.
   */
  #createIdentify() {
    const li = document.createElement('li')
    li.className = 'p-2 mt-auto'

    const IP = document.createElement('div')
    IP.className = 'd-flex'

    const IPLabel = document.createElement('span')
    IPLabel.innerText = 'IP'

    const IPValue = document.createElement('span')
    IPValue.className = 'col text-end'
    IPValue.innerText = this.#device.IP.ipaddress

    IP.append(IPLabel, IPValue)

    const name = document.createElement('div')
    name.className = 'd-flex'

    const nameLabel = document.createElement('span')
    nameLabel.innerText = 'Name'

    const nameValue = document.createElement('span')
    nameValue.className = 'col text-end'
    nameValue.innerText = this.#device.setting.DeviceName

    name.append(nameLabel, nameValue)

    const identify = document.createElement('div')
    identify.className = 'd-flex'

    const identifyLabel = document.createElement('label')
    identifyLabel.className = 'col'
    identifyLabel.innerText = 'Identify'
    identifyLabel.htmlFor = 'identifySwitch'

    const identifyValue = document.createElement('span')
    identifyValue.className = 'form-switch fs-5'

    this.#identify.className = 'form-check-input'
    this.#identify.type = 'checkbox'
    this.#identify.id = identifyLabel.htmlFor
    this.#identify.role = 'switch'

    identifyValue.append(this.#identify)

    identify.append(identifyLabel, identifyValue)

    li.append(IP, name, identify)

    return li
  }

  /**
   * Hides all currently visible sub-menus.
   */
  hideAllSubMenu() {
    const ul = document.querySelectorAll('ul[data-bs-parent]')
    ul.forEach(list => {
      if (list.classList.contains('show')) {
        const instance = bootstrap.Collapse.getInstance(list)
        instance.hide()
      }
    })
  }

  /**
   * Resets the active state of all menu links.
   */
  resetActiveLink() {
    const allLinksWithChild = this.#menu.querySelectorAll('#main-menu .active')
    allLinksWithChild.forEach(link => {
      if (link.classList.contains('active')) {
        link.classList.remove('active')
      }
    })
  }

  /**
   * Toggles the 'compact' class on the HTML element.
   * If the 'compact' class is present, it will be removed by calling `disableCompactMode`.
   * If the 'compact' class is not present, it will be added by calling `enableCompactMode`.
   * This function is used to toggle a compact mode for a menu or interface.
   */
  #toggleMenuCompact() {
    const html = this.#getHtmlElement()

    if (html.classList.contains('compact')) {
      this.#disableCompactMode()
    } else {
      this.#enableCompactMode()
    }
  }

  /**
   * Disables the compact mode by removing the 'compact' class from the HTML element.
   * It also removes the 'collapse' item from local storage, indicating that
   * the menu or interface is no longer in compact mode.
   */
  #disableCompactMode() {
    const html = this.#getHtmlElement()

    if (!html.classList.contains('compact')) return // Exit if compact mode is already disabled

    localStorage.removeItem('collapse')
    html.classList.remove('compact')
  }

  /**
   * Enables the compact mode by adding the 'compact' class to the HTML element.
   * It also sets a 'collapse' item in local storage to indicate that the
   * menu or interface is in compact mode.
   */
  #enableCompactMode() {
    const html = this.#getHtmlElement()

    if (html.classList.contains('compact')) return // Exit if compact mode is already enabled

    localStorage.setItem('collapse', true)
    html.classList.add('compact')
    this.hideAllSubMenu()
  }

  /**
   * Helper function to retrieve the root HTML element.
   * This function centralizes access to the document element for easier maintenance.
   * 
   * @returns {HTMLElement} The root HTML element of the document.
   */
  #getHtmlElement() {
    return document.documentElement
  }


  /**
 * Adds event listeners for menu interactions and updates.
 */
  #addEvents() {
    document.addEventListener(this.#EventName.deviceReady, e => {
      this.#handleDeviceReady()
    })

    document.addEventListener(this.#EventName.identifyIsOn, e => {
      this.#identify.checked = true
    })

    this.#identify.addEventListener('change', e => {
      e.preventDefault()
      this.#toggleIdentify()
    })

    this.#menu.addEventListener('click', e => {
      this.#handleMenuClick(e)
    })

    this.#input.addEventListener('click', e => {
      e.preventDefault()
      this.#toggleMenuCompact()
    })

    if (localStorage.getItem('collapse')) {
      this.#enableCompactMode()
    }
  }

  /**
  * Handles the device ready event by appending identify and removing non-relevant links.
  */
  #handleDeviceReady() {
    this.#menu.append(this.#createIdentify())
    const lis = this.#menu.querySelectorAll('li[data-restricted]')
    lis.forEach(li => {
      const restricted = JSON.parse(li.dataset.restricted)
      if (restricted.indexOf(this.#device.setting.DeviceType) === -1) {
        li.remove()
      }
    })
  }

  /**
  * Toggles the identify feature on or off based on the checkbox state.
  */
  #toggleIdentify() {
    if (this.#identify.checked) {
      this.#device.setIdentify()
    } else {
      this.#device.unsetIdentify()
    }
  }

  /**
  * Handles menu clicks, managing active links and navigation.
  * @param {Event} e - The click event.
  */
  #handleMenuClick(e) {
    let target = e.target
    const breakpoint = window.getComputedStyle(document.body, ':before').content.replace(/\"/g, '')
    let nodeName = target.nodeName.toLowerCase()

    if (nodeName !== 'input') {
      e.preventDefault()
    }
    if (nodeName === 'i') {
      target = target.parentNode
      nodeName = target.nodeName.toLowerCase()
    }
    if (nodeName === 'a') {
      this.#handleLinkClick(target, breakpoint)
    }
  }

  /**
  * Handles link clicks, updating active states and navigation.
  * @param {HTMLElement} target - The clicked link element.
  * @param {string} breakpoint - The current breakpoint for responsive design.
  */
  #handleLinkClick(target, breakpoint) {
    const html = this.#getHtmlElement()
    if (target.parentNode.childElementCount > 1) {
      this.resetActiveLink()
      target.classList.add('active')
    } else {
      const isSubMenu = target?.parentNode?.parentNode?.parentNode?.firstChild
      if (this.#latestActive) {
        this.#latestActive.classList.remove('active')
      }
      if (html.classList.contains('compact')) {
        this.hideAllSubMenu()
      }

      window.history.replaceState(null, null, target.search !== '?home' ? target.search : './')

      if (isSubMenu && isSubMenu.nodeName.toLowerCase() === 'a') {
        this.#latestActive = target.parentNode
      } else {
        this.resetActiveLink()
        this.#latestActive = target
      }
      this.#latestActive.classList.add('active')
      this.#pageChange.detail = target.search.substring(1)
      if (breakpoint === 'sm') {
        html.classList.add('compact')
      }
      document.dispatchEvent(this.#pageChange)
    }
  }

}