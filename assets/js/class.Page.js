import MobileKeyboard from 'MobileKeyboard'
import Translate from 'Translate'
import { EventName, config, attr, word, apis } from 'config'

export default class Page {

  #device = undefined
  #fetch = undefined
  #alert = undefined
  #menu = undefined
  #translate = undefined
  #alertFn = {}

  #devMode = undefined

  #keyboard = undefined

  #class = {
    pageTitle: 'fs-6 me-0 ms-0 mt-0 mb-2 pe-0 ps-0 pt-0 pb-2 border-bottom border-primary border-2 fw-bold'
  }

  #alertTimeOut = {}

  #pageTitle = document.getElementById('pageTitle')
  #pageContent = document.getElementById('pageContent')

  constructor({ _DEVICE_, _FETCH_, _ALERT_, _MENU_, devMode }) {
    this.#devMode = devMode
    this.#device = _DEVICE_
    this.#fetch = _FETCH_
    this.#alert = _ALERT_
    this.#menu = _MENU_
    this.#translate = new Translate({ _DEVICE_: _DEVICE_ })

    this.#keyboard = new MobileKeyboard()

    this.addEvents()
  }

  #getAlertNode(value) {
    const alert = document.createElement('aside')
    alert.className = 'm-1 p-2 alert fade hide'
    alert.role = 'alert'
    alert.ariaRole = 'Form feedback'
    alert.innerText = value

    this.#alert.prepend(alert)

    return alert
  }

  /**
   * Sets up event listeners for page changes and content interactions.
   * - Handles custom page change events and updates the page accordingly.
   * - Manages interactions with keyboard elements and internal links.
   */
  addEvents() {
    // Once device is ready, check the page to load
    document.addEventListener(EventName.pageChange, e => {
      const pageRequest = `page_${e.detail}`

      if (this[pageRequest] !== undefined && typeof this[pageRequest] === 'function') {
        this[pageRequest]()
      } else {
        this.page_404(e.detail)
      }
    })

    this.#pageContent.addEventListener('click', e => {
      let target = e.target
      if (target.nodeName.toLowerCase() === 'i') {
        target = target.parentNode
      }
      if (target.classList.contains('keyboard')) {
        const div = target.parentNode.parentNode
        const input = div.querySelector('input')

        // Always update keyboard value
        this.#keyboard.updateValue(input.value)

        if (!this.#keyboard.keyboardNode.previousSibling.isSameNode(div)) {
          this.#keyboard.setInput(input)
          div.after(this.#keyboard.keyboardNode)
        } else {
          this.#keyboard.toggle()
        }
      }
      if (target.nodeName.toLowerCase() === 'a') { // Internal link
        e.preventDefault()
        const searchPage = target.search.substring(1)
        this.#menu.navigate(searchPage)
      }
    })
  }

  /**
   * Displays an alert message by modifying the provided element.
   * The alert will automatically hide after 2 seconds.
   *
   * @param {Object} options - Configuration for the alert.
   * @param {HTMLElement} options.elem - The element to update with the alert message.
   * @param {string} options.value - The message to display in the alert.
   * @param {string} options.type - The type of alert, used for styling (e.g., 'error', 'success').
   */
  setAlert({ elem, value, type, id }) {
    const alert = this.#getAlertNode(value)
    alert.classList.add('show', `alert-${type}`)
    elem.disabled = true

    this.#alertFn[id] = () => {
      clearTimeout(this.#alertTimeOut[id])
      alert.remove()
      elem.disabled = false
    }

    this.#alertTimeOut[id] = setTimeout(() => this.#alertFn[id](), 2000)
  }



  /**
   * Sets the document title and updates the page title element.
   * Resets any previous state before setting the new title.
   *
   * @param {string} title - The new title to set.
   */
  setTitle(title) {
    this.reset()
    document.title = `${this.#device.setting.DeviceName} - ${title}`
    this.#pageTitle.innerText = title
  }

  /**
   * Creates an icon element with the specified FontAwesome class.
   *
   * @param {string} icon - The FontAwesome icon class (e.g., 'fa-home').
   * @returns {HTMLElement} The created `<i>` element with the specified icon class.
   */
  getIcon(icon) {
    const i = document.createElement('i')
    i.className = `fa fa-fw ${icon}`
    return i
  }

  /**
   * Creates a block title element, either a paragraph or a link, based on the `link` parameter.
   *
   * @param {string} value - The text to display in the block title.
   * @param {string} [link=false] - Optional URL for the link element.
   * @returns {HTMLElement} The created `<p>` or `<a>` element with the specified text and optional link.
   */
  getBlockTitle(value, link = false) {
    const p = document.createElement(link ? 'a' : 'p')
    p.className = this.#class.pageTitle + ' w-100'
    p.innerText = value
    if (link) {
      p.href = link
    }
    return p
  }

  /**
   * Retrieves an attribute value from a line object, applying translation if available.
   *
   * @param {Object} options - Configuration for retrieving the attribute value.
   * @param {Object} options.line - The line object containing attribute values.
   * @param {string} options.attr - The attribute key to retrieve.
   * @param {*} [options.directValue] - Optional direct value to return if attribute is not found.
   * @returns {*} The attribute value, potentially translated, or the direct value if no attribute is found.
   */
  getAttribute({ line, attr, directValue }) {
    if (this.#translate[attr] !== undefined && typeof this.#translate[attr] === 'function') {
      return this.#translate[attr]({ value: line[attr], line: line })
    } else {
      return attr ? line[attr] : directValue
    }
  }

  getTable({ config, content, specific, vertical, horizontal }) {
    const table = document.createElement('table')
    table.className = 'table table-sm table-hover table-borderless'
    const thead = document.createElement('thead')
    const tbody = document.createElement('tbody')

    table.append(thead, tbody)

    if (vertical) {
      for (const head of config) {
        const tr = document.createElement('tr')
        const tdLabel = document.createElement('td')
        tdLabel.innerText = head.label
        tdLabel.className = 'w-50'
        if (head?.icon) {
          tdLabel.prepend(this.getIcon(head.icon))
        }
        const td = document.createElement('td')
        td.innerHTML = this.getAttribute({ line: content, attr: head.attr })

        tr.append(tdLabel, td)
        tbody.append(tr)
      }
    } else {
      tbody.className = 'border-light-subtle border-top'

      const trHead = document.createElement('tr')
      for (const head of config) {
        const th = document.createElement('th')
        th.innerText = head.label
        if (head?.icon) {
          th.prepend(this.getIcon(head.icon))
        }
        trHead.append(th)
      }

      thead.append(trHead)

      if (horizontal) {
        const tr = document.createElement('tr')
        for (const head of config) {
          const td = document.createElement('td')
          this.getAttribute({ line: content, attr: head.attr, directValue: head.directValue })
          tr.append(td)
        }
        tbody.append(tr)
      } else {
        let i = 0
        for (const line in content) {
          const currentLine = content[line]
          const tr = document.createElement('tr')
          for (const head of config) {
            const td = document.createElement('td')
            if (head.attr !== 'index' && head.attr !== 'indexSource') {
              if (specific && specific === 'dmxPorts' && head?.alt && this.#translate.isClonedPort({ portID: i, port: currentLine })) { // Port is outputting another port
                let reuseLine = content[Number(currentLine.ptClonePort)]
                switch (head.attr) {
                  case 'ptProtocol':
                    td.innerText = this.#translate.replaceText({ text: word.page.home_DMXPorts_ClonedPort, search: { '%1': Number(currentLine.ptClonePort) + 1 } })
                    break
                  default:
                    td.innerHTML = this.getAttribute({ line: reuseLine, attr: head.attr })
                    break
                }
              } else {
                td.innerHTML = this.getAttribute({ line: currentLine, attr: head.attr })
              }
            } else {
              switch (head.attr) {
                case 'index':
                  td.innerText = i + 1
                  break
                case 'indexSource':
                  td.innerText = this.#translate.ptSource({ value: i })
                  break
              }
            }
            tr.append(td)
          }
          tbody.append(tr)
          i++
        }

      }
    }
    return table
  }

  /**
 * Resets the page content and title
 * Clears the inner text of the page title element and the inner HTML of the page content element
 */
  reset() {
    this.#pageTitle.innerText = ''
    this.#pageContent.innerHTML = ''
  }

  /**
   * Creates a summary table for the Netron device with device and DMX port information
   * 
   * @returns {HTMLDivElement} The created `<div>` element containing the Netron resume table
   */
  getNetronResumeTable() {
    const div = document.createElement('div')
    div.className = 'netron-table ms-auto me-auto'

    const pName = document.createElement('p')
    pName.className = 'text-center p-0 m-0'
    pName.innerText = this.#device.setting.DeviceName
    div.append(pName)

    const table = document.createElement('table')
    table.className = 'm-0 p-0 text-center table table-sm table-bordered align-middle caption-top'

    const thead = document.createElement('thead')
    const trHead = document.createElement('tr')

    const tbody = document.createElement('tbody')
    const trBody = document.createElement('tr')

    const tfoot = document.createElement('tfoot')
    const trFoot = document.createElement('tr')

    this.#device.dmxPorts.forEach((port, i) => {
      const th = document.createElement('th')
      th.innerText = i + 1
      trHead.append(th)

      const td = document.createElement('td')
      if (this.#translate.isClonedPort({ portID: i, port: port })) {
        td.innerText = `P${port.ptClonePort + 1}`
      } else {
        td.innerText = this.#translate.ptUniverse({ value: port.ptUniverse, line: port }).toString().padStart(3, '0')
      }
      trBody.append(td)
    })

    thead.append(trHead)
    tbody.append(trBody)

    const tdCue = document.createElement('td')
    tdCue.colSpan = this.#device.dmxPorts.length
    tdCue.innerText = this.#device.cuesStatus.CueRunningName
    trFoot.append(tdCue)

    tfoot.append(trFoot)

    table.append(thead, tbody, tfoot)

    div.append(table)

    const pIP = pName.cloneNode()
    pIP.innerText = `IP ${this.#device.IP.ipaddress}`
    div.append(pIP)

    return div
  }

  /**
   * Fetches and returns a thumbnail image of the device
   * If the image file is not found, a fallback image is used
   *
   * @returns {Promise<HTMLImageElement>} A promise that resolves to the created `<img>` element with the device thumbnail
   */
  async getDeviceThumbnail() {
    const img = document.createElement('img')
    img.className = 'img-fix-150 ms-auto me-auto'
    img.width = '150'
    img.height = '150'

    try {
      const response = await fetch(`./assets/img/${this.#device.setting.DeviceType}.png`, { method: 'HEAD' })
      if (response.ok) {
        img.src = `./assets/img/${this.#device.setting.DeviceType}.png`
      } else {
        img.src = `./assets/img/netron.svg`
      }
    } catch (error) {
      // Handle error if needed
    }

    return img
  }

  /**
   * Creates a row container div element
   * 
   * @returns {HTMLDivElement} The created `<div>` element with class 'row m-0 p-0'
   */
  getRow() {
    const div = document.createElement('div')
    div.className = 'row m-0 p-0'
    return div
  }

  /**
 * Creates an input element based on provided attributes and options
 * 
 * @param {Object} params - The parameters for creating the input
 * @param {string} [params.attr] - Attribute object containing label and description
 * @param {boolean} [params.disableIndexInLabel] - Whether to disable index in option labels
 * @param {string} [params.label] - Label text for the input
 * @param {string} [params.icon] - Icon class to be added to the label
 * @param {string} [params.id] - ID for the input element
 * @param {string} [params.name] - Name attribute for the input
 * @param {string} [params.type] - Type of the input ('input' or 'select')
 * @param {string} [params.subtype] - Subtype of the input ('text', 'checkbox', etc.)
 * @param {number} [params.minLength] - Minimum length for text inputs
 * @param {number} [params.maxLength] - Maximum length for text inputs
 * @param {number} [params.min] - Minimum value for numeric inputs
 * @param {number} [params.max] - Maximum value for numeric inputs
 * @param {string} [params.defaultValue] - Default value for the input
 * @param {Array<Object>} [params.options] - Options for select inputs
 * @param {Array<Object>} [params.optgroup] - Option groups for select inputs
 * @param {boolean} [params.required] - Whether the input is required
 * @param {boolean} [params.hide] - Options to hide certain inputs
 * @param {string} [params.specific] - Specific type for additional data attributes
 * 
 * @returns {HTMLDivElement} The created `<div>` element containing the input element
 */
  getInput({ attr, disableIndexInLabel, label, icon, id, name, type, subtype, minLength, maxLength, min, max, defaultValue, options, optgroup, required, hide, specific }) {
    const div = document.createElement('div')
    div.className = 'input-group'

    const labelNode = document.createElement('label')
    labelNode.innerText = attr ? attr.label : label
    labelNode.htmlFor = id
    labelNode.className = 'input-group-text'

    if (icon) {
      const iconIcon = document.createElement('i')
      iconIcon.className = `fa fa-fw ${icon}`
      labelNode.prepend(iconIcon)
    }
    if (attr?.icon) {
      const iconIcon = document.createElement('i')
      iconIcon.className = `fa fa-fw ${attr.icon}`
      labelNode.prepend(iconIcon)
    }

    if (attr?.desc) {
      labelNode.title = attr.desc
    }

    let input
    switch (type) {
      case 'input':
        input = document.createElement('input')
        input.type = subtype ? subtype : 'text'

        if (input.type === 'checkbox') {
          input.className = 'form-check-input'
          if (defaultValue) { input.checked = true }

          const checkbox = input.cloneNode(true)
          input = document.createElement('span')
          input.className = 'form-switch fs-4 ms-2 mt-auto'
          input.append(checkbox)
        } else {
          input.autocomplete = 'off'
          input.className = 'form-control'
          input.value = defaultValue
          if (min !== undefined) { input.min = min }
          if (max !== undefined) { input.max = max }
          if (minLength !== undefined) { input.minLength = minLength }
          if (maxLength !== undefined) { input.maxLength = maxLength }
          if (required) { input.required = true }

          const keyboardLink = document.createElement('span')
          keyboardLink.className = 'input-group-text'

          const keyboardButton = document.createElement('button')
          keyboardButton.className = 'keyboard m-0 p-0 btn btn-sm'
          keyboardButton.type = 'button'

          const keyboardIcon = document.createElement('i')
          keyboardIcon.className = 'm-0 p-0 fs-5 fa fa-fw fa-keyboard'

          keyboardButton.append(keyboardIcon)

          keyboardLink.append(keyboardButton)

          div.append(keyboardLink)
        }
        break
      case 'select':
        input = document.createElement('select')
        input.className = 'form-select'
        const listOption = new Map()
        options.forEach((option, i) => {
          const optName = option?.name ? option.name : option
          const optText = disableIndexInLabel ? optName : `${i + 1}: ${optName}`
          const opt = document.createElement('option')
          opt.value = option.value !== undefined ? option.value : i
          opt.innerText = optText
          if (option?.desc) {
            opt.title = option.desc
          }
          if (option?.disabled) {
            opt.disabled = true
          }
          switch (specific) {
            case 'universe':
              opt.dataset.universe = this.#translate.ptUniverse({
                value: option.universe,
                line: {
                  presetID: i
                }
              })
              break
            case 'name':
              opt.dataset.name = option.name
            case 'owner':
              if (option.Owner === 1) {
                opt.disabled = true
                opt.innerText = `${word.locked} ${optText}`
              }
              break
          }

          if (hide && option.hidden === 1) {
            opt.dataset.hide = JSON.stringify(hide)
          }
          if (defaultValue === undefined) {
            if (i === 0) {
              opt.selected = true
            }
          } else if (
            defaultValue === option.value || defaultValue === i
          ) {
            opt.selected = true
          }
          listOption.set(i, opt)
          input.append(opt)
        })

        if (optgroup) {
          for (const group of optgroup) {
            const opt = document.createElement('optgroup')
            opt.label = group.label
            group.index.forEach(value => {
              opt.append(listOption.get(value))
            })
            input.prepend(opt)
          }
        }
        break
    }
    if (subtype === 'checkbox') {
      input.firstChild.name = attr?.attr ? attr.attr : id
      input.firstChild.id = id
    } else {
      input.name = attr?.attr ? attr.attr : id
      input.id = id
    }

    div.prepend(labelNode, input)
    return div
  }

  /**
   * Creates a submit button for a form
   * 
   * @param {string} action - Text for the button
   * 
   * @returns {HTMLButtonElement} The created `<button>` element for form submission
   */
  getSubmit(action) {
    const button = document.createElement('button')
    button.type = 'submit'
    button.className = 'btn btn-primary mt-4'
    button.innerText = action
    return button
  }

  /**
   * Creates a form element with an optional label and explanation
   * 
   * @param {Object} params - The parameters for creating the form
   * @param {string} [params.id] - ID for the form element
   * @param {string} [params.label] - Label text for the form
   * @param {string} [params.explanation] - Explanation text to be displayed below the label
   * 
   * @returns {Object} An object containing the created form and fieldset elements
   */
  getForm({ id, label, explanation }) {
    const form = document.createElement('form')
    form.className = 'm-0 p-0 mb-5'
    form.id = id ? id : `id-${Date.now()}`

    const fieldset = document.createElement('fieldset')
    fieldset.className = 'form-group'

    form.append(fieldset)

    if (label) {
      const legend = document.createElement('legend')
      legend.innerText = label
      legend.className = this.#class.pageTitle

      fieldset.append(legend)

      if (explanation) {
        const p = document.createElement('p')
        p.className = 'text-muted'
        p.innerHTML = explanation
        fieldset.append(p)
      }
    }
    return { form: form, fieldset: fieldset }
  }

  /**
   * Retrieves values from form elements based on a provided list
   * 
   * @param {Object} params - The parameters for getting form values
   * @param {Array<Object>} params.list - List of objects each containing an element and a key for value extraction
   * 
   * @returns {Map<string, any>} A map of key-value pairs where keys are form element keys and values are form values
   */
  getFormValue({ list }) {
    const map = new Map()
    for (const elem of list) {
      if (elem?.directValue !== undefined) {
        map.set(elem.key, elem.directValue)
      } else {
        let input = elem.elem.children[1]
        const nodeName = input.nodeName.toLowerCase()
        if (nodeName !== 'input' && nodeName !== 'select') {
          input = input.firstChild
        }
        if (!input.disabled) {
          let value = input.value
          if (input.type === 'checkbox') {
            value = input.checked ? 1 : 0
          }
          map.set(elem.key, value)
        }
      }
    }
    return map
  }

  /**
   * Handles form submission with validation and data posting
   * 
   * @param {Object} params - The parameters for handling form submission
   * @param {Array<Object>} params.list - List of form elements to be processed
   * @param {HTMLFormElement} params.form - The form element
   * @param {HTMLButtonElement} params.button - The submit button element
   * @param {string} params.url - URL to send the form data
   * @param {Function} [params.check] - Optional function for additional validation checks
   * @param {string} [params.success] - Success message to be displayed
   * @param {Function} [params.callback] - Optional callback function for custom form processing
   * @param {Function} [params.after] - Optional after function for custom processing of answer
   */
  sendForm({ list, form, button, url, check, success, callback, after }) {
    form.addEventListener('submit', async e => {
      e.preventDefault()
      this.#keyboard.hide()

      const formData = new FormData()

      const formValue = this.getFormValue({ list: list })

      for (const elem of list) {
        if (formValue.has(elem.key)) {
          let value = formValue.get(elem.key)
          if (elem?.directValue === undefined) {
            if (elem.precall && typeof elem.precall === 'function') {
              value = elem.precall(value, formData)
            }
          }
          formData.append(elem.key, value)
        }
      }

      formData.append('EndFlag', 1)

      let error
      if (callback && typeof callback === 'function') {
        error = callback(formData)
      }
      if (check && typeof check === 'function') {
        error = error ? error : check()
      }

      if (!error) {
        const response = await this.#fetch.post({ url: url, formData: formData })
        if (after && typeof after === 'function') {
          after(response)
        }
      }

      const id = button.parentNode.parentNode.id

      const alertOption = { id: id, elem: button, value: error ? error : success, type: error ? 'danger' : 'success' }

      this.setAlert(alertOption)
    })
  }

  /**
 * Disables or enables elements and hides or shows them based on the `disabled` parameter
 * 
 * @param {Object} params - The parameters for disabling elements
 * @param {HTMLElement|HTMLElement[]} params.elem - Element or array of elements to be disabled
 * @param {boolean} [params.disabled=false] - Whether to disable or enable the elements
 */
  disabledElem({ elem, disabled = false }) {
    if (Array.isArray(elem)) {
      elem.forEach(el => this.disabledElem({ elem: el, disabled: disabled }))
    } else {
      let input = elem.children[1]
      if (input) {
        const nodeName = input.nodeName.toLowerCase()
        if (nodeName !== 'input' && nodeName !== 'select') {
          input = input.firstChild
        }
        input.disabled = disabled
      }
      if (disabled) {
        elem.classList.add('d-none')
      } else {
        elem.classList.remove('d-none')
      }
    }
  }

  /**
   * Gets the appropriate icon class for a given port based on its mode
   * @param {Object} params - The parameters for determining the port icon
   * @param {Object} params.port - The port object
   * @param {number} params.portID - The ID of the port
   * @returns {string} The Font Awesome icon class for the port
   */
  #getPortIcon({ port, portID }) {
    const iconMap = {
      0: 'fa-ban', // Disable
      1: 'fa-arrow-right-to-bracket', // Input
      2: 'fa-arrow-right-from-bracket', // Output
      3: 'fa-volume-high', // Send value
    }

    let icon = iconMap[port.ptMode] || 'fa-ban' // Default to 'Disable' icon

    if (this.#translate.isClonedPort({ portID, port })) {
      icon = 'fa-clone'
    }

    return `fa fa-fw ${icon}`
  }

  /**
   * Handles the display of a 404 page not found error
   * 
   * @param {string} pageRequest - The page request that could not be found
   */
  page_404(pageRequest) {
    this.setTitle(word.page.notFound)

    const p = document.createElement('p')
    p.innerHTML = this.#translate.replaceText({ text: word.page.notFound_desc, search: { '%1': pageRequest } })

    const icon = this.getIcon('fa-triangle-exclamation')
    icon.classList.add('text-warning')

    p.prepend(icon)

    this.#pageContent.append(p)
  }

  /**
   * Displays the home page with device information and optionally DMX input and merge tables
   */
  async page_home() {
    this.setTitle(word.page.home)
    const div = this.getRow()

    const infosTitle = this.getBlockTitle(word.page.home_InfoLink, `./?systemStatus`)

    const infosTable = this.getTable({
      vertical: true,
      config: [
        attr.DeviceType,
        attr.DeviceName,
        attr.ipaddress,
        attr.netmask
      ],
      content: { ...this.#device.setting, ...this.#device.IP }
    })

    infosTable.classList.add('col-sm')

    div.append(infosTitle, await this.getDeviceThumbnail(), infosTable)

    this.#pageContent.append(div)

    if (this.#device.setting.DeviceType === 'NETRON RDM10') {
      const DMXInputTitle = this.getBlockTitle(word.page.home_DMXInput, `./?dmxInputs`)

      const DMXInputTable = this.getTable({
        config: [
          { ...attr.ptPort, attr: 'indexSource' },
          attr.InputSource,
          attr.InputProtocol,
          attr.InputUniverse,
          attr.InputFrameRate,
          attr.InputRDM
        ],
        content: this.#device.dmxInputTab
      })

      const DMXMergeTitle = this.getBlockTitle(word.page.home_DMXMerge, `./?dmxMerge`)

      const DMXMergeTable = this.getTable({
        horizontal: true,
        config: [
          { ...attr.ptPort, attr: false, directValue: this.#translate.ptSource({ value: 2 }) },
          attr.MergerMode,
          attr.MergerFrameRate
        ],
        content: this.#device.dmxInputMerger
      })

      this.#pageContent.append(DMXInputTitle, DMXInputTable, DMXMergeTitle, DMXMergeTable)
    }
    const DMXPortsTitle = this.getBlockTitle(word.page.home_DMXPorts, `./?dmxPorts`)

    const DMXPortsTable = this.getTable({
      specific: 'dmxPorts',
      config: [
        { ...attr.ptPort, attr: 'index' },
        attr.ptMode,
        { ...attr.ptProtocol, alt: true },
        { ...attr.ptUniverse, alt: true },
        { ...attr.ptFramerate, alt: true },
        { ...attr.ptRDM, alt: true },
        { ...attr.ptMergeMode, alt: true }
      ],
      content: this.#device.dmxPorts
    })

    DMXPortsTable.classList.add('col-sm')

    const divPort = this.getRow()

    divPort.append(DMXPortsTitle, this.getNetronResumeTable(), DMXPortsTable)

    this.#pageContent.append(divPort)
  }

  /**
 * Handles the presets page for Netron, including loading and configuring presets
 */
  page_presetsNetron() {
    this.setTitle(word.page.netronPresets)

    const form = this.getForm({ label: word.page.netronPresets_Load, explanation: word.page.netronPresets_LoadExplanation })

    const Preset = this.getInput({
      label: config.presets.name.slice(0, -1),
      id: 'idx',
      icon: config.presets.icon,
      type: 'select',
      options: this.#device.presets,
      specific: 'universe',
      optgroup: [
        { index: new Set([7, 8, 9, 10, 11, 12]), label: word.sACN },
        { index: new Set([0, 1, 2, 3, 4, 5, 6]), label: word.ArtNet }
      ],
      hide: ['universe']
    })

    const startUniverse = this.getInput({
      attr: attr.startUniverse,
      id: 'universe',
      type: 'input',
      subtype: 'number',
      min: 1,
      max: 32767,
      defaultValue: this.#translate.ptUniverse({
        value: this.#device.presets[0].universe,
        line: {
          presetID: 0
        }
      })
    })

    form.fieldset.append(Preset, startUniverse)

    /* TODO manage universe A and B for RDM 10 and 12
    const universeA = this.getInput({
      label: 'Universe A',
      id: 'UniverseA',
      type: 'input',
      subtype: 'number',
      defaultValue: this.#translate.ptUniverse({
        value: this.#device.presets[0].universeA,
        line: this.#device.presets[0]
      })
    })
   
    const universeB = this.getInput({
      label: 'Universe B',
      id: 'UniverseB',
      type: 'input',
      subtype: 'number',
      defaultValue: this.#translate.ptUniverse({
        value: this.#device.presets[0].universeB,
        line: this.#device.presets[0]
      })
    })
   
    switch (this.#device.setting.DeviceType) {
      case 'NETRON RDM10':
        form.append(universeA, universeB)
        break
      case 'NETRON EN12':
        form.append(universeA, universeB)
        break
      default:
        break
    }
    */

    const button = this.getSubmit(word.page.netronPresets_LoadSubmit)

    form.fieldset.append(button)

    this.#pageContent.append(form.form)

    // Get universe from selected option
    Preset.querySelector('select').addEventListener('change', e => {
      if (this.#alert !== undefined && typeof this.#alert === 'function') {
        this.#alert()
      }
      const selectedOption = e.target.selectedOptions[0]
      if (selectedOption.dataset?.hide) {
        const toHide = JSON.parse(selectedOption.dataset.hide)
        toHide.forEach(elem => {
          const nodeToHide = document.getElementById(elem).parentNode
          this.disabledElem({ elem: nodeToHide, disabled: true })
        })
      } else {
        const nodeToReveal = form.form.querySelectorAll('.d-none')
        nodeToReveal.forEach(elem => {
          this.disabledElem({ elem: elem })
        })
      }
      if (selectedOption.dataset.universe !== undefined) {
        startUniverse.querySelector('input').value = selectedOption.dataset.universe
      }
    })

    const callback = formData => {
      if (formData.has('universe')) {
        this.#device.presets[formData.get('idx')]['universe'] = Number(formData.get('universe'))
        Preset.querySelector(`option[value="${formData.get('idx')}"]`).dataset.universe = Number(formData.get('universe'))
      }
    }

    const list = [
      { key: 'idx', elem: Preset },
      { key: 'PresetNum', elem: Preset },
      { key: 'universe', elem: startUniverse, precall: (value, formData) => this.#translate.ptUniverse({ device: true, value: value, line: { presetID: formData.get('idx') } }) }
    ]

    this.sendForm({ list: list, form: form.form, button: button, callback: callback, url: apis.savePresetNetron, success: word.page.netronPresets_LoadSuccess })
  }

  /**
   * Handles the user presets page, including loading and renaming user presets
   */
  page_presetsUser() {
    this.setTitle(word.page.userPresets)

    const formLoad = this.getForm({ label: word.page.userPresets_Load, explanation: word.page.userPresets_LoadExplanation })

    const Preset = this.getInput({
      label: config.presets.name.slice(0, -1),
      id: 'PresetNum',
      icon: config.presets.icon,
      type: 'select',
      specific: 'owner',
      options: this.#device.userPresets
    })

    const buttonLoad = this.getSubmit(word.page.userPresets_LoadSubmit)

    formLoad.fieldset.append(Preset, buttonLoad)

    const formUser = this.getForm({ label: word.page.userPresets_Rename, explanation: word.page.userPresets_RenameExplanation })

    const PresetRename = this.getInput({
      label: config.presets.name.slice(0, -1),
      id: 'idx',
      icon: config.presets.icon,
      type: 'select',
      specific: 'name',
      options: this.#device.userPresets
    })

    const PresetName = this.getInput({
      label: 'Name',
      id: 'name',
      type: 'input',
      subtype: 'text',
      minLength: 1,
      maxLength: 12,
      required: true,
      defaultValue: this.#device.userPresets[0].name
    })

    const buttonRename = this.getSubmit(word.page.userPresets_RenameSubmit)

    formUser.fieldset.append(PresetRename, PresetName, buttonRename)

    this.#pageContent.append(formLoad.form, formUser.form)

    // Get name from selected option
    PresetRename.querySelector('select').addEventListener('change', e => {
      if (this.#alert !== undefined && typeof this.#alert === 'function') {
        this.#alert()
      }
      const selectedOption = e.target.selectedOptions[0]
      if (selectedOption.dataset.name !== undefined) {
        PresetName.querySelector('input').value = selectedOption.dataset.name
      }
    })

    const list = [
      { key: 'PresetNum', elem: Preset, precall: val => Number(val) + 100 } // Change loading preset id by adding 100 to the current ID
    ]
    this.sendForm({ list: list, form: formLoad.form, button: buttonLoad, url: apis.loadPresetNetron, success: word.page.userPresets_LoadSuccess })

    const callback = formData => {
      const updatedID = Number(formData.get('idx')) - 101
      const newName = formData.get('name')
      this.#device.userPresets[updatedID].name = newName

      const updPreset = Preset.querySelector(`option[value="${updatedID}"]`)
      updPreset.innerText = `${updatedID + 1}: ${newName}`

      const updPresetRename = PresetRename.querySelector(`option[value="${updatedID}"]`)
      updPresetRename.innerText = `${updatedID + 1}: ${newName}`
      updPresetRename.dataset.name = newName
    }

    const listRename = [
      { key: 'idx', elem: PresetRename, precall: val => Number(val) + 101 }, // Change update user preset id by adding 101 to the current ID
      { key: 'name', elem: PresetName }
    ]
    this.sendForm({ list: listRename, form: formUser.form, button: buttonRename, url: apis.savePresetNetron, callback: callback, success: word.page.userPresets_RenameSuccess })
  }

  /**
 * Generates and displays a page of DMX port settings
 * This method creates tabs for each DMX port, allowing the user to configure various settings
 */
  page_dmxPorts() {
    // Helper function to create a tab
    const createTab = ({ port, index }) => {
      const li = document.createElement('li')
      li.className = 'nav-item'
      li.role = 'presentation'

      const portIcon = document.createElement('i')
      portIcon.className = this.#getPortIcon({ port: port, portID: index })

      const link = document.createElement('button')
      link.type = 'button'
      link.className = `nav-link${index === 0 ? ' active' : ''}`
      link.role = 'tab'
      link.dataset.bsToggle = 'tab'
      link.dataset.bsTarget = `#dmxPort${index}`
      link.ariaControls = link.dataset.bsTarget
      link.innerText = this.#translate.replaceText({ text: word.page.dmxPorts_Tab, search: { '%1': index + 1 } })
      link.id = `dmxPort${index}-tab`

      link.prepend(portIcon)
      li.append(link)

      return { li, link, portIcon }
    }
    // Helper function to create a form
    const createForm = ({ port, index, formID }) => {
      const form = this.getForm({ id: formID })
      form.form.className = `tab-pane fade pt-2${index === 0 ? ' show active' : ''}`
      form.form.dataset.idx = index + 1
      form.form.role = 'tabpanel'
      form.form.tabIndex = 0
      form.form.ariaLabelledby = formID

      return form
    }

    this.setTitle(word.page.dmxPorts)

    const ul = document.createElement('ul')
    ul.className = 'nav nav-tabs'
    ul.role = 'tablist'

    const div = document.createElement('div')
    div.className = 'tab-content'

    const nodes = {
      portIcon: []
    }

    this.#device.dmxPorts.forEach((port, i) => {
      // Generate Tab for navigation
      const { li, link, portIcon } = createTab({ port: port, index: i })
      ul.append(li)

      nodes.portIcon[i] = portIcon

      // Generate Pane
      const form = createForm({ port: port, index: i, formID: link.dataset.bsTarget.substring(1) })
      div.append(form.form)

      /** Settings */
      const PortSettingsTitle = this.getBlockTitle(word.page.dmxPorts_Setting)

      /**
       * Creates a select input for port cloning options
       * @param {number} a - The current port index
       * @param {string} formid - The form ID
       * @param {number} ptClonePort - The current clone port value
       * @returns {HTMLElement} The select input element for cloning options
       */
      const getPtClonePortInput = (a, formid, ptClonePort) => {
        return this.getInput({
          attr: attr.ptClonePort,
          id: `${formid}ptClonePort`,
          type: 'select',
          options: this.#translate.getPtClonePort(a),
          defaultValue: ptClonePort,
          disableIndexInLabel: true
        })
      }

      const ptClonePort = getPtClonePortInput(i, form.form.id, port.ptClonePort)

      const ptMode = this.getInput({
        attr: attr.ptMode,
        id: `${form.form.id}ptMode`,
        type: 'select',
        options: this.#translate.getPtMode(true),
        defaultValue: port.ptMode,
        disableIndexInLabel: true
      })

      const ptRDM = this.getInput({
        attr: attr.ptRDM,
        id: `${form.form.id}ptRDM`,
        type: 'input',
        subtype: 'checkbox',
        defaultValue: (port.ptRDM === 1)
      })

      /** Input/Output */
      const InputOuputTitle = this.getBlockTitle(word.page.dmxPorts_InOut)
      InputOuputTitle.classList.add('mt-2')

      const ptProtocol = this.getInput({
        attr: attr.ptProtocol,
        id: `${form.form.id}ptProtocol`,
        type: 'select',
        options: this.#translate.getPtProtocol(true),
        defaultValue: port.ptProtocol,
        disableIndexInLabel: true
      })

      const ptUniverse = this.getInput({
        attr: attr.ptUniverse,
        id: `${form.form.id}ptUniverse`,
        type: 'input',
        subtype: 'number',
        min: 1,
        max: 32767,
        defaultValue: this.#translate.ptUniverse({
          value: port.ptUniverse,
          line: port
        })
      })

      /** Merge */
      const MergeTitle = this.getBlockTitle(word.page.dmxPorts_Merge)
      MergeTitle.classList.add('mt-2')

      const ptMergeMode = this.getInput({
        attr: attr.ptMergeMode,
        id: `${form.form.id}ptMergeMode`,
        type: 'select',
        options: this.#translate.getPtMergeMode(true),
        defaultValue: port.ptMergeMode,
        disableIndexInLabel: true
      })

      const ptMergeUniverse = this.getInput({
        attr: attr.ptMergeUniverse,
        id: `${form.form.id}ptMergeUniverse`,
        type: 'input',
        subtype: 'number',
        min: 1,
        max: 32767,
        defaultValue: this.#translate.ptMergeUniverse({
          value: port.ptMergeUniverse,
          line: port
        })
      })

      const ptResendProtocol = this.getInput({
        attr: attr.ptResendProtocol,
        id: `${form.form.id}ptResendProtocol`,
        type: 'select',
        options: this.#translate.getPtProtocol(true),
        defaultValue: port.ptResendProtocol,
        disableIndexInLabel: true
      })

      const ptResendUniverse = this.getInput({
        attr: attr.ptResendUniverse,
        id: `${form.form.id}ptResendUniverse`,
        type: 'input',
        subtype: 'number',
        min: 1,
        max: 32767,
        defaultValue: this.#translate.ptResendUniverse({
          value: port.ptResendUniverse,
          line: { ...port, ptProtocol: undefined }
        })
      })

      /** DMX */
      const DMXRangeTitle = this.getBlockTitle(word.page.dmxPorts_DMX)
      DMXRangeTitle.classList.add('mt-2')

      const ptSendValue = this.getInput({
        attr: attr.ptSendValue,
        id: `${form.form.id}ptSendValue`,
        type: 'input',
        subtype: 'number',
        min: 0,
        max: 255,
        defaultValue: port.ptSendValue
      })

      const ptFramerate = this.getInput({
        attr: attr.ptFramerate,
        id: `${form.form.id}ptFramerate`,
        type: 'select',
        options: this.#translate.getPtFramerate(),
        defaultValue: port.ptFramerate,
        disableIndexInLabel: true
      })

      const ptRangeFrom = this.getInput({
        attr: attr.ptRangeFrom,
        id: `${form.form.id}ptRangeFrom`,
        type: 'input',
        subtype: 'number',
        min: 1,
        max: 512,
        defaultValue: port.ptRangeFrom
      })

      const ptRangeTo = this.getInput({
        attr: attr.ptRangeTo,
        id: `${form.form.id}ptRangeTo`,
        type: 'input',
        subtype: 'number',
        min: 1,
        max: 512,
        defaultValue: port.ptRangeTo
      })

      const ptOffsetAddr = this.getInput({
        attr: attr.ptOffsetAddr,
        id: `${form.form.id}ptOffsetAddr`,
        type: 'input',
        subtype: 'number',
        min: 0,
        max: 511,
        defaultValue: port.ptOffsetAddr
      })

      const button = this.getSubmit('Save')

      const allInputs = [
        PortSettingsTitle, ptClonePort, ptMode, ptRDM,
        InputOuputTitle, ptProtocol, ptUniverse,
        MergeTitle, ptMergeMode, ptMergeUniverse, ptResendProtocol, ptResendUniverse,
        DMXRangeTitle, ptSendValue, ptFramerate, ptRangeFrom, ptRangeTo, ptOffsetAddr
      ]

      form.fieldset.append(...allInputs, button)

      /**
       * Sets default values for various inputs
       */
      const defaultValues = () => {
        ptRDM.children[1].firstChild.checked = true
        ptProtocol.children[1].value = 0
        ptUniverse.children[1].value = i + 1
        ptMergeUniverse.children[1].value = i + 1 + this.#device.dmxPorts.length
        ptResendUniverse.children[1].value = i + 1 + this.#device.dmxPorts.length * 2
        ptMergeMode.children[1].value = 0
        ptFramerate.children[1].value = 5
        ptRangeFrom.children[1].value = 1
        ptRangeTo.children[1].value = 512
        ptOffsetAddr.children[1].value = 0
      }

      form.form.addEventListener('change', e => {
        switch (e.target.name) {
          case 'ptClonePort':
            const value = Number(e.target.value)
            if (value === i) {
              defaultValues()
            }
            updateVisibilityAndValues()
            break
          case 'ptMode':
            defaultValues()
            updateVisibilityAndValues()
            break
          case 'ptProtocol':
          case 'ptMergeMode':
          case 'ptResendProtocol':
            updateVisibilityAndValues()
            break
          default:
            break
        }
      })

      /**
       * The list of inputs for the form data
       * @type {Array<Object>}
       */
      const list = [
        { key: 'idx', directValue: form.form.dataset.idx },
        { key: 'ptClonePort', elem: ptClonePort },
        { key: 'ptMode', elem: ptMode },
        { key: 'ptRDM', elem: ptRDM },
        { key: 'ptProtocol', elem: ptProtocol },
        { key: 'ptUniverse', elem: ptUniverse, precall: (value, formData) => this.#translate.ptUniverse({ device: true, value: value, line: { ptProtocol: Number(formData.get('ptProtocol')) } }) },
        { key: 'ptMergeMode', elem: ptMergeMode },
        { key: 'ptMergeUniverse', elem: ptMergeUniverse, precall: (value, formData) => this.#translate.ptMergeUniverse({ device: true, value: value, line: { ptProtocol: Number(formData.get('ptProtocol')) } }) },
        { key: 'ptResendProtocol', elem: ptResendProtocol },
        { key: 'ptResendUniverse', elem: ptResendUniverse, precall: (value, formData) => this.#translate.ptResendUniverse({ device: true, value: value, line: { ptResendProtocol: Number(formData.get('ptResendProtocol')) } }) },
        { key: 'ptSendValue', elem: ptSendValue },
        { key: 'ptFramerate', elem: ptFramerate },
        { key: 'ptRangeFrom', elem: ptRangeFrom },
        { key: 'ptRangeTo', elem: ptRangeTo },
        { key: 'ptOffsetAddr', elem: ptOffsetAddr }
      ]

      /**
       * Handles the form submission callback
       * @param {FormData} formData - The form data to process
       * @returns {string|false} Error message if there is an error, otherwise false
       */
      const callback = formData => {
        // Manage Errors
        let error = false
        // Check if the ptMode change is not breaking other ports
        if (Number(formData.get('ptMode')) !== 2) { // !Output
          const listOfIndex = new Set()
          this.#device.dmxPorts.forEach((port, index) => {
            if (index !== i) { // Remove current port
              if (port.ptClonePort === i && port.ptMode === 2) { // = Output
                listOfIndex.add(index + 1)
              }
            }
          })
          if (listOfIndex.size > 0) {
            const listOfIndexArray = [...listOfIndex]
            error = this.#translate.replaceText({ text: word.page.dmxPorts_Submit_Error_Clone, search: { '%1': i + 1, '%2': listOfIndexArray > 1 ? 's' : '', '%3': listOfIndexArray.join(', ') } })
          }
        }

        if (error) { return error }

        for (const [key, val] of formData.entries()) {
          if (key !== 'idx' && key !== 'EndFlag') { // Do not try to update non existing thing
            this.#device.dmxPorts[i][key] = Number(val)
          }
        }

        nodes.portIcon[i].className = this.#getPortIcon({ port: port, portID: i }) // Update Port Icon

        this.#pageContent.querySelectorAll('form').forEach((form, index) => { // Update ptClonePort options description everywhere
          const subPtClonePort = form.querySelector(`#${form.id}ptClonePort`)
          const newSelect = getPtClonePortInput(index, form.id, subPtClonePort.value)

          Array.from(newSelect.children[1].children).forEach((option, indexCh) => {
            const currentOption = subPtClonePort.children[indexCh]
            if (Number(currentOption.value) === index) {
              currentOption.disabled = false
              currentOption.title = ''
              currentOption.innerText = word.page.dmxPorts_ClonePort_None
            } else {
              currentOption.disabled = option.disabled
              currentOption.title = option.title
              currentOption.innerText = option.innerText
            }
          })
        })

        return false
      }

      /**
       * Checks the validity of input values and returns error messages if needed
       * @returns {string|false} Error message if there is an error, otherwise false
       */
      const check = () => {
        if (ptMode.children[1].value !== 0 && !this.#translate.isClonedPort({ portID: i, port: { ptMode: ptMode.children[1].value, ptClonePort: ptClonePort.children[1].value } })) { // !Disable
          const values = {
            ptRangeFrom: Number(ptRangeFrom.children[1].value),
            ptRangeTo: Number(ptRangeTo.children[1].value),
            ptOffsetAddr: Number(ptOffsetAddr.children[1].value)
          }
          if (values.ptRangeFrom > values.ptRangeTo) { return word.page.dmxPorts_Error_Offset }
          if (values.ptRangeFrom + values.ptOffsetAddr > 512) { return word.page.dmxPorts_Error_OffsetFrom }
          if (values.ptRangeTo + values.ptOffsetAddr > 512) { return word.page.dmxPorts_Error_OffsetTo }
        } else {
          return false
        }
      }

      this.sendForm({
        list: list,
        form: form.form,
        button: button,
        url: apis.saveDMXPort,
        check: check,
        callback: callback,
        success: this.#translate.replaceText({
          text: word.page.dmxPorts_SubmitSuccess,
          search: { '%1': i + 1 }
        })
      })

      /**
       * Updates the visibility and enabled/disabled state of form inputs based on the current mode
       */
      const updateVisibilityAndValues = () => {
        this.disabledElem({ elem: allInputs, disabled: true })
        switch (Number(ptMode.children[1].value)) {
          case 0: // Disable
            this.disabledElem({
              elem: [
                PortSettingsTitle, ptMode
              ]
            })
            break
          case 1: // Input
            this.disabledElem({
              elem: [
                PortSettingsTitle, ptMode, ptUniverse,
                InputOuputTitle, ptProtocol,
                DMXRangeTitle, ptRangeFrom, ptRangeTo, ptOffsetAddr
              ]
            })
            break
          case 2: // Output
            if (Number(ptClonePort.children[1].value) !== i) { // Port is cloning another port
              this.disabledElem({
                elem: [
                  PortSettingsTitle, ptClonePort
                ]
              })
            } else {
              this.disabledElem({
                elem: [
                  PortSettingsTitle, ptClonePort, ptMode, ptUniverse,
                  InputOuputTitle, ptProtocol, ptFramerate, ptRDM,
                  MergeTitle, ptMergeMode,
                  DMXRangeTitle, ptRangeFrom, ptRangeTo, ptOffsetAddr
                ]
              })
              if (Number(ptMergeMode.children[1].value) !== 0) { // !Off
                this.disabledElem({ elem: [ptMergeUniverse, ptResendProtocol] })
                if (Number(ptResendProtocol.children[1].value) !== 2) { // !None
                  this.disabledElem({ elem: ptResendUniverse })
                }
              }
            }
            break
          case 3: // Send value
            this.disabledElem({
              elem: [
                PortSettingsTitle, ptMode,
                DMXRangeTitle, ptSendValue, ptFramerate, ptRangeFrom, ptRangeTo, ptOffsetAddr
              ]
            })
          default:
            break
        }
      }

      updateVisibilityAndValues()
    })
    this.#pageContent.append(ul, div)
  }

  /**
 * Initializes and renders the IP settings page.
 * Sets up the form with fields for IP settings, including address mode, IP address, and netmask.
 * Handles the visibility of fields based on the selected address mode and validates the input.
 */
  page_ipSettings() {
    this.setTitle(word.page.ipSettings)

    const form = this.getForm({
      label: word.page.ipSettings_Settings,
      explanation: word.page.ipSettings_SettingsExplanation
    })

    /**
     * @type {HTMLElement} The select element for choosing address mode.
     */
    const addressmode = this.getInput({
      attr: attr.addressmode,
      id: `addressmode`,
      type: 'select',
      options: this.#translate.getAddressmode(),
      defaultValue: this.#device.IP.addressmode,
      disableIndexInLabel: true,
      optgroup: [
        { index: new Set([1, 2, 4, 5]), label: word.automatic }
      ]
    })

    /**
     * @type {HTMLElement} The input element for entering IP address.
     */
    const ipaddress = this.getInput({
      attr: attr.ipaddress,
      id: `ipaddress`,
      type: 'input',
      subtype: 'text',
      defaultValue: this.#device.IP.ipaddress
    })

    /**
     * @type {HTMLElement} The input element for entering netmask.
     */
    const netmask = this.getInput({
      attr: attr.netmask,
      id: `netmask`,
      type: 'input',
      subtype: 'text',
      defaultValue: this.#device.IP.netmask
    })

    form.fieldset.append(addressmode, ipaddress, netmask)

    const button = this.getSubmit(word.page.ipSettings_SettingsSubmit)

    form.fieldset.append(button)

    /**
     * Updates the visibility of IP address and netmask fields based on the selected address mode.
     * Disables or enables fields based on whether the address mode is set to 'Custom IP'.
     */
    const updateVisibilityAndValues = () => {
      const nodeToHide = [ipaddress, netmask]
      if (Number(addressmode.children[1].value) === 3) { // Custom IP
        this.disabledElem({ elem: nodeToHide })
      } else {
        this.disabledElem({ elem: nodeToHide, disabled: true })
      }
    }

    addressmode.addEventListener('change', updateVisibilityAndValues)

    /**
     * List of form elements and their corresponding preprocessing functions.
     * @type {Array<{key: string, elem: HTMLElement, precall?: Function}>}
     */
    const list = [
      { key: 'addressmode', elem: addressmode },
      { key: 'ipaddress', elem: ipaddress, precall: this.#device.deIpAddress },
      { key: 'netmask', elem: netmask, precall: this.#device.deIpAddress }
    ]

    /**
     * Validates the input values and returns an error message if any values are invalid.
     * @returns {string|false} An error message if there is a validation error; otherwise, false.
     */
    const check = () => {
      const validIP = /^(?:(?:25[0-5]|(?:2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/
      if (Number(addressmode.children[1].value) === 3) { // Custom IP
        const values = {
          ipaddress: ipaddress.children[1].value,
          netmask: netmask.children[1].value
        }
        if (!validIP.test(values.ipaddress)) {
          return this.#translate.replaceText({
            text: word.page.ipSettings_Check_Ipaddress,
            search: { '%1': values.ipaddress }
          })
        }
        if (!validIP.test(values.netmask)) {
          return this.#translate.replaceText({
            text: word.page.ipSettings_Check_Netmask,
            search: { '%1': values.netmask }
          })
        }
      } else {
        return false
      }
    }

    const callback = formData => {
      for (const [key, val] of formData.entries()) {
        if (key !== 'EndFlag') {
          if(key === 'addressmode') {
          this.#device.IP[key] = Number(val)
          } else {
            this.#device.IP[key] = this.#device.reIpAddress(val)
          }
        }
      }
    }

    /**
     * Handles the response after form submission.
     * If a new IP address is provided, redirects to the new URL after a delay.
     * @param {Object} response - The response from the form submission.
     * @param {string} [response.ipaddress] - The new IP address to redirect to.
     */
    const after = response => {
      if (response.ipaddress && response.ipaddress !== window.location.host) {
        setTimeout(() => {
          const newUrl = `http://${response.ipaddress.split('.').map(input => String(Number(input))).join('.')}/${location.search}`
          if (!this.#devMode) {
            window.location.replace(newUrl)
          }
        }, 3000)
      }
    }

    this.sendForm({
      list: list,
      form: form.form,
      button: button,
      url: apis.saveInfo,
      check: check,
      callback: callback,
      after: after,
      success: word.page.ipSettings_SettingsSuccess
    })

    this.#pageContent.append(form.form)

    updateVisibilityAndValues()
  }


  /**
 * Asynchronously generates and displays the system status page
 * This method sets the page title, creates and displays device information,
 * IP address details, and firmware version information
 */
  async page_systemStatus() {
    this.setTitle(word.page.status)

    // Create a row for device information
    const div = this.getRow()

    const deviceTitle = this.getBlockTitle(word.page.status_Device)

    const deviceTable = this.getTable({
      vertical: true,
      config: [
        attr.DeviceType,
        attr.DeviceName,
        attr.MACAddress,
        attr.RDMUID,
        attr.OnTime
      ],
      content: { ...this.#device.setting, ...this.#device.index }
    })

    deviceTable.classList.add('col-sm')

    div.append(deviceTitle, await this.getDeviceThumbnail(), deviceTable)

    // Create a row for IP address details
    const divIP = this.getRow()

    const IPAddressTitle = this.getBlockTitle(word.page.status_IPAddress, `./?ipSettings`)

    const IPAddressTable = this.getTable({
      vertical: true,
      config: [
        attr.addressmode,
        attr.ipaddress,
        attr.netmask
      ],
      content: this.#device.IP
    })

    divIP.append(IPAddressTitle, IPAddressTable)

    // Create a row for firmware version information
    const divFirmware = this.getRow()

    const FirmwareTitle = this.getBlockTitle(word.page.status_SoftVersion, `./?systemMaintenance`)

    const FirmwareTable = this.getTable({
      vertical: true,
      config: [
        attr.FirmwareVer,
        attr.BootVer,
        attr.WebVer
      ],
      content: this.#device.index
    })

    divFirmware.append(FirmwareTitle, FirmwareTable)

    // Append all rows to the page content
    this.#pageContent.append(div, divIP, divFirmware)
  }
}
