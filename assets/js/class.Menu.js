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
    a.className = 'm-0 p-0 bg-secondary-subtle'
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
   * Adds event listeners for menu interactions and updates.
   */
  #addEvents() {
    // Once device is ready, set-up the createIdentify
    document.addEventListener(this.#EventName.deviceReady, e => {
      this.#menu.append(this.#createIdentify())

      // Remove link not relative to current device
      const lis = this.#menu.querySelectorAll('li[data-restricted]')
      lis.forEach(li => {
        const restricted = JSON.parse(li.dataset.restricted)
        if (restricted.indexOf(this.#device.setting.DeviceType) === -1) {
          li.remove()
        }
      })
    })

    // Manage identify feature
    document.addEventListener(this.#EventName.identifyIsOn, e => {
      this.#identify.checked = true
    })

    this.#identify.addEventListener('change', e => {
      e.preventDefault()
      if (this.#identify.checked) {
        this.#device.setIdentify()
      } else {
        this.#device.unsetIdentify()
      }
    })

    // Manage page navigation
    this.#menu.addEventListener('click', e => {
      let target = e.target
      let nodeName = target.nodeName.toLowerCase()

      if (nodeName !== 'input') { e.preventDefault() } // Block the event except for identify switcher
      if (nodeName === 'i') {
        target = target.parentNode
        nodeName = target.nodeName.toLowerCase()
      }
      if (nodeName === 'a') {
        if (target.parentNode.childElementCount > 1) {
          this.resetActiveLink()
          target.classList.add('active')
        } else {
          const isSubMenu = target?.parentNode?.parentNode?.parentNode?.firstChild
          if (this.#latestActive) { this.#latestActive.classList.remove('active') }
          if (document.documentElement.classList.contains('compact')) { this.hideAllSubMenu() }
          
          window.history.replaceState(null, null, target.search !== '?home' ? target.search : './')

          if (isSubMenu && isSubMenu.nodeName.toLowerCase() === 'a') {
            this.#latestActive = target.parentNode
          } else {
            this.resetActiveLink()
            this.#latestActive = target
          }
          this.#latestActive.classList.add('active')
          this.#pageChange.detail = target.search.substring(1)
          document.dispatchEvent(this.#pageChange)
        }
      }
    })

    // Manage menu compact mode
    this.#input.addEventListener('click', e => {
      e.preventDefault()
      const html = document.documentElement
      if (html.classList.contains('compact')) {
        localStorage.removeItem('collapse')
        html.classList.remove('compact')
      } else {
        localStorage.setItem('collapse', true)
        html.classList.add('compact')
        this.hideAllSubMenu()
      }
    })

    if (localStorage.getItem('collapse')) {
      document.documentElement.classList.add('compact')
    }
  }
}