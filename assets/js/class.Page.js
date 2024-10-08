import MobileKeyboard from 'MobileKeyboard'
import Translate from 'Translate'
import { EventName, config, attr, word, apis, timing, regex } from 'config'

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

  #optGroup = {
    dmxProtocol: [
      { regex: regex.sACN, label: word.sACN },
      { regex: regex.ArtNet, label: word.ArtNet }
    ],
    ipMode: [
      { regex: regex.automatic, label: word.automatic },
    ]
  }

  #input = {
    universe: {
      type: 'input',
      subtype: 'number',
      required: true,
      min: 1,
      max: 32767
    },
    dmx: {
      type: 'input',
      subtype: 'number',
      required: true,
      min: 1,
      max: 512
    },
    send: {
      type: 'input',
      subtype: 'number',
      required: true,
      min: 0,
      max: 255
    }
  }

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
   * Creates a block text element
   *
   * @param {string} value - The text to display in the block title.
   * @returns {HTMLElement} The created `<p>` element with the specified text.
   */
  #getBlockText(value) {
    const p = document.createElement('p')
    p.className = 'text-muted'
    p.innerText = value
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
                    td.className = 'text-muted fst-italic fw-light'
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
    const globalDiv = document.createElement('div')
    globalDiv.className = 'netron-table p-0 m-0 ms-auto me-auto'

    // Check if there are more than 4 ports to display, if true, split the table in multiple tables
    const portPerTable = this.#device.dmxPorts.length >= 4 ? 4 : this.#device.dmxPorts.length

    for (let t = 0; t < this.#device.dmxPorts.length; t += portPerTable) {
      const div = document.createElement('div')
      div.className = 'netron-table'

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

      for (let i = t; i < portPerTable + t; i++) {
        const port = this.#device.dmxPorts[i]
        const th = document.createElement('th')
        th.innerText = i + 1
        trHead.append(th)

        const td = document.createElement('td')
        switch (port.ptMode) {
          case 0: // Disable
            td.innerText = 'X'
            td.className = 'text-red'
            break
          case 1: // Input
            td.innerText = 'i' + this.#translate.ptUniverse({ value: port.ptUniverse, line: port }).toString().padStart(3, '0')
            td.className = 'background-green'
            break
          case 2: // Output
            td.className = 'background-blue'
            if (this.#translate.isClonedPort({ portID: i, port: port })) {
              td.innerText = `P${port.ptClonePort + 1}`
            } else {
              td.innerText = this.#translate.ptUniverse({ value: port.ptUniverse, line: port }).toString().padStart(3, '0')
            }
            break
          case 3: // Send value
            td.innerText = 'v' + port.ptSendValue.toString().padStart(3, '0')
            td.className = 'background-purple'
            break
        }
        trBody.append(td)
      }

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

      globalDiv.append(div)
    }

    return globalDiv
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
 * @param {string} [params.disabled] - Disabled the input/select
 * @param {string} [params.attr] - Attribute object containing label and description
 * @param {boolean} [params.disableIndexInLabel] - Whether to disable index in option labels
 * @param {string} [params.label] - Label text for the input
 * @param {string} [params.icon] - Icon class to be added to the label
 * @param {string} [params.id] - ID for the input element
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
  getInput({ disabled, attr, disableIndexInLabel, label, icon, id, type, subtype, minLength, maxLength, min, max, defaultValue, options, optgroup, required, hide, specific }) {
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

        if (subtype === 'time') {
          input.step = 1
        }

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
          if (subtype === 'time') {
            input.value = defaultValue ? this.#translate.secondsToTimeInput(defaultValue) : '00:00:00'
          } else {
            input.value = defaultValue
          }
          if (min !== undefined) { input.min = min }
          if (max !== undefined) { input.max = max }
          if (minLength !== undefined) { input.minLength = minLength }
          if (maxLength !== undefined) { input.maxLength = maxLength }
          if (required) { input.required = true }

          if (!disabled && subtype !== 'time') {
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
          if (defaultValue === undefined) { // If no default value, select the first option
            if (i === 0) {
              opt.selected = true
            }
          } else if (defaultValue === option.value || (!option.value && defaultValue === i)) {
            opt.selected = true
          }
          listOption.set(i, opt)
          input.append(opt)
        })

        if (optgroup) { // If there are optgroups, create them and append the options
          for (const groupLabel of optgroup) {
            const opt = document.createElement('optgroup')
            opt.label = groupLabel.label

            listOption.forEach(option => {
              if (option.innerText.match(groupLabel.regex)) { // If the option matches the regex
                option.innerText = option.innerText.replace(groupLabel.regex, groupLabel.label) // Replace the regex with nothing
                opt.append(option)
              }
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

    if (disabled) {
      input.disabled = true
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
   * @param {string} [params.explanation] - Explanation text to be displayed below the label. \n will be replaced with a line break
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
        // Check if explanation contains newline characters
        if (explanation.includes('\n')) {
          p.innerHTML = explanation.replace(/\n/g, '<br/>')
        } else {
          p.innerText = explanation
        }
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
   * Sets the form data based on the provided list.
   * 
   * @param {Object[]} list - The list of elements to set the form data.
   * @returns {FormData} The FormData object containing the form data.
   */
  #setFormData({ list }) {
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

    return formData
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

      const formData = this.#setFormData({ list: list })

      let error
      if (check && typeof check === 'function') {
        error = check()
      }
      if (callback && typeof callback === 'function') {
        error = error ? error : callback(formData)
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
  #disabledElem({ elem, disabled = false }) {
    if (Array.isArray(elem)) {
      elem.forEach(el => this.#disabledElem({ elem: el, disabled: disabled }))
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

    let icon = iconMap[port.ptMode] || iconMap[0] // Default to 'Disable' icon

    if (this.#translate.isClonedPort({ portID, port })) {
      icon = 'fa-clone'
    }

    return `fa fa-fw ${icon}`
  }

  /**
   * Gets the appropriate icon class for a given input port based on its Event Type
   * @param {Object} params - The parameters for determining the port icon
   * @param {Object} params.port - The port object
   * @returns {string} The Font Awesome icon class for the port
   */
  #getInputPortIcon({ port }) {
    const iconMap = {
      0: 'fa-ban', // Disable DMX
      1: config.cues.icon, // Cue
      2: config.presets.icon, // Netron preset
      3: config.presets.icon, // User preset
      4: 'fa-volume-high', // Send value
    }

    let icon = iconMap[port.rmActionEvent] || iconMap[0] // Default to 'Disable' icon

    return `fa fa-fw ${icon}`
  }

  /**
   * Generates a tab element for the navigation menu.
   *
   * @param {Object} options - The options for the tab.
   * @param {number} options.index - The index of the tab.
   * @param {string} options.id - The ID of the tab.
   * @param {string} options.icon - The CSS class for the tab icon.
   * @param {string} options.text - The text content of the tab with %1 as a placeholder for the index.
   * @returns {Object} - An object containing the generated elements.
   */
  #getTab({ index, id, icon, text }) {
    const li = document.createElement('li')
    li.className = 'nav-item align-self-stretch flex-fill'
    li.role = 'presentation'

    const iconElement = document.createElement('i')
    iconElement.className = icon

    const link = document.createElement('button')
    link.type = 'button'
    link.className = `nav-link${index === 0 ? ' active' : ''}`
    link.role = 'tab'
    link.dataset.bsToggle = 'tab'
    link.dataset.bsTarget = `#${id}${index}`
    link.ariaControls = link.dataset.bsTarget
    link.id = `${id}${index}-tab`

    const spanFull = document.createElement('span')
    spanFull.className = 'full'
    spanFull.innerText = this.#translate.replaceText({ text: text, search: { '%1': index + 1 } })

    const spanSmall = document.createElement('span')
    spanSmall.className = 'break'
    spanSmall.innerText = index + 1

    link.append(spanFull, spanSmall)

    link.prepend(iconElement)
    li.append(link)

    return { li, link, iconElement }
  }

  /**
   * Generates the tab pane element based on the provided index and id.
   * 
   * @param {Object} options - The options for retrieving the tab pane.
   * @param {number} options.index - The index of the tab pane.
   * @param {string} options.id - The id of the tab pane.
   * @returns {HTMLElement} The tab pane element.
   */
  #getTabPane({ index, id }) {
    const form = this.getForm({ id: id })
    form.form.className = `tab-pane fade pt-2${index === 0 ? ' show active' : ''}`
    form.form.dataset.idx = index + 1
    form.form.role = 'tabpanel'
    form.form.tabIndex = 0
    form.form.ariaLabelledby = id

    return form
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
      optgroup: this.#optGroup.dmxProtocol,
      hide: ['universe']
    })

    const startUniverse = this.getInput({
      attr: attr.startUniverse,
      id: 'universe',
      ...this.#input.universe,
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
          this.#disabledElem({ elem: nodeToHide, disabled: true })
        })
      } else {
        const nodeToReveal = form.form.querySelectorAll('.d-none')
        nodeToReveal.forEach(elem => {
          this.#disabledElem({ elem: elem })
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
      disabled: (this.#device.userPresets[0].Owner !== 0),
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
        PresetName.children[1].value = selectedOption.dataset.name
        if (selectedOption.disabled) {
          this.#disabledElem({ elem: PresetName, disabled: true })
        } else {
          this.#disabledElem({ elem: PresetName })
        }
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
      const { li, link, iconElement } = this.#getTab({
        index: i,
        id: 'dmxPort',
        icon: this.#getPortIcon({ port: port, portID: i }),
        text: word.page.dmxPorts_Tab
      })
      ul.append(li)

      nodes.portIcon[i] = iconElement

      // Generate Pane
      const form = this.#getTabPane({
        index: i,
        id: link.dataset.bsTarget.substring(1)
      })
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
        ...this.#input.universe,
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
        ...this.#input.universe,
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
        ...this.#input.universe,
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
        ...this.#input.send,
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
        ...this.#input.dmx,
        defaultValue: port.ptRangeFrom
      })

      const ptRangeTo = this.getInput({
        attr: attr.ptRangeTo,
        id: `${form.form.id}ptRangeTo`,
        ...this.#input.dmx,
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
        ptMode,
        PortSettingsTitle, ptClonePort, ptRDM, ptProtocol, ptUniverse,
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
        ptClonePort.children[1].value = i
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
        this.#disabledElem({ elem: allInputs, disabled: true })
        switch (Number(ptMode.children[1].value)) {
          case 0: // Disable
            this.#disabledElem({
              elem: [
                ptMode
              ]
            })
            break
          case 1: // Input
            this.#disabledElem({
              elem: [
                PortSettingsTitle, ptMode, ptUniverse, ptProtocol,
                DMXRangeTitle, ptRangeFrom, ptRangeTo, ptOffsetAddr
              ]
            })
            break
          case 2: // Output
            if (Number(ptClonePort.children[1].value) !== i) { // Port is cloning another port
              this.#disabledElem({
                elem: [
                  ptMode,
                  PortSettingsTitle, ptClonePort
                ]
              })
            } else {
              this.#disabledElem({
                elem: [
                  ptMode,
                  PortSettingsTitle, ptClonePort, ptUniverse, ptProtocol, ptRDM,
                  MergeTitle, ptMergeMode,
                  DMXRangeTitle, ptFramerate, ptRangeFrom, ptRangeTo, ptOffsetAddr
                ]
              })
              if (Number(ptMergeMode.children[1].value) !== 0) { // !Off
                this.#disabledElem({ elem: [ptMergeUniverse, ptResendProtocol] })
                if (Number(ptResendProtocol.children[1].value) !== 2) { // !None
                  this.#disabledElem({ elem: ptResendUniverse })
                }
              }
            }
            break
          case 3: // Send value
            this.#disabledElem({
              elem: [
                ptMode,
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
      optgroup: this.#optGroup.ipMode
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
        this.#disabledElem({ elem: nodeToHide })
      } else {
        this.#disabledElem({ elem: nodeToHide, disabled: true })
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
          if (key === 'addressmode') {
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
   * Executes the cues run functionality on the page.
   * 
   * @returns {void}
   */
  page_cuesRun() {
    this.setTitle(word.page.cuesRun)

    const form = this.getForm({ label: word.page.cuesRun_Run, explanation: word.page.cuesRun_Explanation })

    const runCue = this.getInput({
      attr: attr.runCue,
      id: 'runCue',
      type: 'select',
      disableIndexInLabel: true,
      options: [
        { name: 'Disabled' },
        ...this.#device.cues.map((cue, index) => ({ name: `${index + 1}: ${cue.name}` }))
      ]
    })

    const currentCue = this.getInput({
      disabled: true,
      attr: attr.currentCue,
      id: 'currentCue',
      type: 'input',
      defaultValue: this.#device.cuesStatus.CueRunningName
    })

    const cuesResendEth = this.getInput({
      attr: attr.cuesResendEth,
      id: 'cuesResendEth',
      type: 'input',
      subtype: 'checkbox',
      defaultValue: (this.#device.cuesSetting.CuesResendEth === 1)
    })

    form.fieldset.append(runCue, currentCue, cuesResendEth)

    const button = this.getSubmit(word.page.cuesRun_Submit)

    form.fieldset.append(button)

    this.#pageContent.append(form.form)

    /**
    * List of form elements and their corresponding preprocessing functions.
    * @type {Array<{key: string, elem: HTMLElement, precall?: Function}>}
    */
    const list = [
      { key: 'RunCue', elem: runCue },
      { key: 'CuesResendEth', elem: cuesResendEth }
    ]

    /**
     * Callback function that updates the cue status and cues settings.
     * 
     * @param {FormData} formData - The form data containing the updated values.
     * @returns {void}
     */
    const callback = formData => {
      const cueIndex = Number(formData.get('RunCue')) - 1
      this.#device.cuesStatus.CueRunningName = cueIndex >= 0 ? this.#device.cues[cueIndex].name : 'No Cue'
      currentCue.children[1].value = this.#device.cuesStatus.CueRunningName

      this.#device.cuesSetting.CuesResendEth = Number(formData.get('CuesResendEth'))
    }

    this.sendForm({
      list: list,
      form: form.form,
      button: button,
      url: apis.runCues,
      callback: callback,
      success: word.page.cuesRun_Success
    })

    cuesResendEth.addEventListener('change', async e => {
      const formData = this.#setFormData({ list: [list[1]] })
      const response = await this.#fetch.post({ url: apis.runCues, formData: formData })
      this.#device.cuesSetting.CuesResendEth = Number(formData.get('CuesResendEth'))
    })

    // Refresh the current cue status every few seconds (deactivated in dev mode)
    if (!this.#devMode) {
      const updateCurrentCue = async () => {
        const response = await this.#fetch.get({ file: apis.cuesStatus })
        if (response.CueRunningName !== this.#device.cuesStatus.CueRunningName) {
          this.#device.cuesStatus.CueRunningName = response.CueRunningName
          currentCue.children[1].value = response.CueRunningName
        }
      }

      const refreshCurrentCue = setInterval(() => updateCurrentCue(), timing.runCues)
    }
  }

  /**
   * Request device to saves all ports value to the selected cue
   * 
   * @returns {void}
   */
  page_cuesSave() {
    this.setTitle(word.page.cuesSave)

    const form = this.getForm({ label: word.page.cuesSave_Save, explanation: word.page.cuesSave_Explanation })

    const cueNum = this.getInput({
      attr: attr.saveCue,
      id: 'CueNum',
      type: 'select',
      options: this.#device.cues.map((cue, index) => ({ value: index + 1, name: cue.name }))
    })

    const button = this.getSubmit(word.page.cuesSave_Submit)

    form.fieldset.append(cueNum, button)

    this.#pageContent.append(form.form)

    /**
    * List of form elements and their corresponding preprocessing functions.
    * @type {Array<{key: string, elem: HTMLElement, precall?: Function}>}
    */
    const list = [
      { key: 'CueNum', elem: cueNum }
    ]

    this.sendForm({
      list: list,
      form: form.form,
      button: button,
      url: apis.saveCues,
      success: word.page.cuesSave_Success
    })
  }

  page_cuesOptions() {
    this.setTitle(word.page.cuesOptions)

    const form = this.getForm({ label: word.page.cuesOptions_Options, explanation: word.page.cuesOptions_Explanation })

    const idx = this.getInput({
      attr: attr.optionCue,
      id: 'idx',
      type: 'select',
      options: this.#device.cues.map((cue, index) => ({ value: index + 1, name: cue.name }))
    })

    const name = this.getInput({
      attr: attr.nameCue,
      id: 'name',
      type: 'input',
      minLength: 1,
      maxLength: 12,
      required: true,
      defaultValue: this.#device.cues[0].name
    })

    const timingTitle = this.getBlockTitle(word.timing)
    timingTitle.classList.add('mt-2')

    const timingText = this.#getBlockText(word.page.cuesOptions_Timing)

    const fadeTime = this.getInput({
      attr: attr.fadeTimeCue,
      id: 'fadeTime',
      type: 'input',
      subtype: 'time',
      defaultValue: this.#device.cues[0].fadeTime
    })

    const holdTime = this.getInput({
      attr: attr.holdTimeCue,
      id: 'holdTime',
      type: 'input',
      subtype: 'time',
      defaultValue: this.#device.cues[0].holdTime
    })

    const linkingTitle = this.getBlockTitle(word.link)
    linkingTitle.classList.add('mt-2')

    const linkCue = this.getInput({
      attr: attr.linkedCue,
      id: 'linkCue',
      type: 'select',
      disableIndexInLabel: true,
      defaultValue: this.#device.cues[0].linkCue,
      options: [
        { name: 'None' },
        ...this.#device.cues.map((cue, index) => ({ name: `${index + 1}: ${cue.name}` }))
      ]
    })

    const button = this.getSubmit(word.page.cuesOptions_Submit)

    form.fieldset.append(idx, name, timingTitle, timingText, fadeTime, holdTime, linkingTitle, linkCue, button)

    this.#pageContent.append(form.form)

    /**
    * List of form elements and their corresponding preprocessing functions.
    * @type {Array<{key: string, elem: HTMLElement, precall?: Function}>}
    */
    const list = [
      { key: 'idx', elem: idx },
      { key: 'Name', elem: name },
      { key: 'fadeTime', elem: fadeTime, precall: this.#translate.timeInputToSeconds },
      { key: 'holdTime', elem: holdTime, precall: this.#translate.timeInputToSeconds },
      { key: 'linkCue', elem: linkCue }
    ]

    /**
     * Updates the visibility and values of elements based on selected options.
     */
    const updateVisibilityAndValues = () => {
      const selectedIdxValue = Number(idx.children[1].selectedOptions[0].value)
      const selectedLinkCueValue = Number(linkCue.children[1].selectedOptions[0].value)
      const prefix = `${word.locked} `

      // Iterate through the options in linkCue and disable the matching option
      Array.from(linkCue.children[1].options).forEach(option => {
        const isPrefixed = option.text.startsWith(prefix)
        if (Number(option.value) === selectedIdxValue) {
          if (!isPrefixed) {
            option.text = `${prefix}${option.text}`
          }
          option.disabled = true
        } else {
          if (isPrefixed) {
            option.text = option.text.replace(prefix, '')
          }
          option.disabled = false
        }
      })

      if (selectedLinkCueValue === 0 || selectedLinkCueValue === selectedIdxValue) {
        this.#disabledElem({
          elem: holdTime,
          disabled: true
        })
      } else {
        this.#disabledElem({
          elem: holdTime
        })
      }
    }

    /**
     * Renders the cues options page.
     * 
     * @returns {void}
     */
    form.form.addEventListener('change', e => {
      if (e.target.name === 'linkCue') {
        updateVisibilityAndValues()
      } else if (e.target.name === 'idx') {
        const cueIndex = Number(e.target.value) - 1
        name.children[1].value = this.#device.cues[cueIndex].name
        fadeTime.children[1].value = this.#translate.secondsToTimeInput(this.#device.cues[cueIndex].fadeTime)
        holdTime.children[1].value = this.#translate.secondsToTimeInput(this.#device.cues[cueIndex].holdTime)
        linkCue.children[1].value = this.#device.cues[cueIndex].linkCue
        updateVisibilityAndValues()
      }
    })

    updateVisibilityAndValues()

    /**
     * Callback function that updates the cue status and cues settings.
     * 
     * @param {FormData} formData - The form data containing the updated values.
     * @returns {void}
     */
    const callback = formData => {
      const cueIndex = Number(formData.get('idx')) - 1

      if (this.#device.cues[cueIndex].name !== formData.get('Name')) {
        this.#device.cues[cueIndex].name = formData.get('Name')
        idx.children[1].options[cueIndex].innerText = `${cueIndex + 1}: ${formData.get('Name')}`
        linkCue.children[1].options[cueIndex + 1].innerText = `${cueIndex + 1}: ${formData.get('Name')}`
      }
      this.#device.cues[cueIndex].fadeTime = Number(formData.get('fadeTime'))
      this.#device.cues[cueIndex].linkCue = Number(formData.get('linkCue'))

      if (formData.has('holdTime')) {
        this.#device.cues[cueIndex].holdTime = Number(formData.get('holdTime'))
      }
      updateVisibilityAndValues()
    }

    this.sendForm({
      list: list,
      form: form.form,
      button: button,
      url: apis.editCues,
      callback: callback,
      success: word.page.cuesOptions_Success
    })
  }

  /**
   * Retrieves the cuelists from the device.
   * 
   * @returns {Array<Array<Object>>} An array of cuelists, where each cuelist is an array of cues.
   */
  #cuelists() {
    const linkCuesID = new Set(this.#device.cues.map(cue => cue.linkCue))
    const cues = this.#device.cues
      .map((cue, index) => ({ ...cue, idx: index + 1 }))
      .filter(cue => cue.linkCue !== 0 || linkCuesID.has(cue.idx))

    const cueMap = new Map()
    const linkCues = new Set()
    const groupedCues = new Set()
    const cuelists = []

    // Create a map from index to cue and collect all linkCues
    cues.forEach(cue => {
      cueMap.set(cue.idx, cue)
      if (cue.linkCue !== 0) {
        linkCues.add(cue.linkCue)
      }
    })

    // Identify starting cues and group them
    cues.forEach(cue => {
      if (!linkCues.has(cue.idx) && !groupedCues.has(cue.idx)) {
        const cuelist = []
        let currentCue = cue

        // Keep linking cues based on linkCue
        while (currentCue) {
          cuelist.push(currentCue)
          groupedCues.add(currentCue.idx)

          // Check if the next cue exists in the map
          if (!cueMap.has(currentCue.linkCue)) {
            break
          }

          // Move to the next cue
          currentCue = cueMap.get(currentCue.linkCue)

          // Prevent infinite loop by checking if the cue is already grouped
          if (groupedCues.has(currentCue.idx)) {
            break
          }
        }

        cuelists.push(cuelist)
      }
    })

    return cuelists
  }

  /**
   * Renders the cues list page.
   * 
   * @returns {void}
   */
  page_cuesList() {
    this.setTitle(word.page.cuesList)

    const explanation = this.#getBlockText(word.page.cuesList_Explanation)

    this.#pageContent.append(explanation)

    const cuelists = this.#cuelists()

    cuelists.forEach((cuelist, index) => {

      const cuelistTitle = this.getBlockTitle(this.#translate.replaceText({ text: word.page.cuesList_Cuelist, search: { '%1': index + 1 } }))

      const cuelistTable = this.getTable({
        config: [
          { ...attr.cueCuelist, attr: 'index' },
          attr.idCue,
          attr.nameCue,
          attr.fadeTimeCue,
          attr.holdTimeCue,
          attr.linkedCue
        ],
        content: cuelist
      })

      this.#pageContent.append(cuelistTitle, cuelistTable)
    })
  }

  page_inputs() {
    this.setTitle(word.page.inputs)

    const ul = document.createElement('ul')
    ul.className = 'nav nav-tabs'
    ul.role = 'tablist'

    const div = document.createElement('div')
    div.className = 'tab-content'

    const nodes = {
      portIcon: []
    }

    this.#device.remoteInputs.forEach((port, i) => {
      // Generate Tab for navigation
      const { li, link, iconElement } = this.#getTab({
        index: i,
        id: 'inputPort',
        icon: this.#getInputPortIcon({ port: port }),
        text: word.page.inputs_Tab
      })
      ul.append(li)

      nodes.portIcon[i] = iconElement

      // Generate Pane
      const form = this.#getTabPane({
        index: i,
        id: link.dataset.bsTarget.substring(1)
      })

      div.append(form.form)

      const rmActionEvent = this.getInput({
        attr: attr.rmActionEvent,
        id: `${form.form.id}rmActionEvent`,
        type: 'select',
        options: this.#translate.getRmActionEvent(true),
        defaultValue: port.rmActionEvent,
        disableIndexInLabel: true
      })

      const TriggerTitle = this.getBlockTitle(word.page.inputs_Trigger)
      TriggerTitle.classList.add('mt-2')

      const rmTriggerSource = this.getInput({
        attr: attr.rmTriggerSource,
        id: `${form.form.id}rmTriggerSource`,
        type: 'select',
        options: this.#translate.getRmTriggerSource(true),
        defaultValue: port.rmTriggerSource,
        disableIndexInLabel: true
      })

      const getPorts = () => {
        return this.#device.dmxPorts.map((port, index) => {
          const name = this.#translate.replaceText({ text: word.page.inputs_Port, search: { '%1': index + 1 } })
          // Deactivate the port if not in input mode
          if (port.ptMode !== 1) {
            return { name: `${word.warning} ${name}`, desc: this.#translate.replaceText({ text: word.page.inputs_PortModeWarning, search: { '%1': index + 1 } }) }
          }
          return { name: name }
        })
      }

      const rmSourcePort = this.getInput({
        attr: attr.rmSourcePort,
        id: `${form.form.id}rmSourcePort`,
        type: 'select',
        defaultValue: port.rmSourcePort,
        options: getPorts(),
        disableIndexInLabel: true
      })

      const rmSourceUniverse = this.getInput({
        attr: attr.rmSourceUniverse,
        id: `${form.form.id}rmSourceUniverse`,
        ...this.#input.universe,
        defaultValue: this.#translate.rmSourceUniverse({
          value: port.rmSourceUniverse,
          line: port
        })
      })

      const rmSourceAddress = this.getInput({
        attr: attr.rmSourceAddress,
        id: `${form.form.id}rmSourceaddress`,
        ...this.#input.dmx,
        defaultValue: port.rmSourceaddress,
        disableIndexInLabel: true
      })

      const TypeTitle = this.getBlockTitle(word.page.inputs_Type)
      TypeTitle.classList.add('mt-2')

      const rmActSendValue = this.getInput({
        attr: attr.rmActSendValue,
        id: `${form.form.id}rmActSendValue`,
        ...this.#input.send,
        defaultValue: port.rmActSendValue,
        disableIndexInLabel: true
      })

      const rmActCueNum = this.getInput({
        attr: attr.rmActCueNum,
        id: `${form.form.id}rmActCueNum`,
        type: 'select',
        options: [
          { name: 'No cue' },
          ...this.#device.cues.map((cue, index) => ({ name: `${index + 1}: ${cue.name}` }))
        ],
        defaultValue: port.rmActCueNum,
        disableIndexInLabel: true
      })

      const rmActCueMode = this.getInput({
        attr: attr.rmActCueMode,
        id: `${form.form.id}rmActCueMode`,
        type: 'select',
        options: this.#translate.getRmActCueMode(true),
        defaultValue: port.rmActCueMode,
        disableIndexInLabel: true
      })

      const rmActPresetNum = this.getInput({
        attr: attr.rmActPresetNum,
        id: `${form.form.id}rmActPresetNum`,
        type: 'select',
        options: this.#device.presets,
        optgroup: this.#optGroup.dmxProtocol,
        defaultValue: port.rmActPresetNum,
      })

      const rmActUserPresetNum = this.getInput({
        attr: attr.rmActUserPresetNum,
        id: `${form.form.id}rmActUserPresetNum`,
        type: 'select',
        options: this.#device.userPresets,
        defaultValue: port.rmActUserPresetNum
      })

      const button = this.getSubmit('Save')

      const allInputs = [
        rmActionEvent,
        TypeTitle, rmActCueNum, rmActCueMode, rmActSendValue, rmActPresetNum, rmActUserPresetNum,
        TriggerTitle, rmTriggerSource, rmSourcePort, rmSourceUniverse, rmSourceAddress
      ]

      form.fieldset.append(...allInputs, button)

      /**
       * Sets default values for various inputs
       */
      const defaultValues = e => {
        switch (e.target.name) {
          case 'rmActionEvent':
            rmActUserPresetNum.children[1].value = 0
            rmActPresetNum.children[1].value = 0
            rmActCueMode.children[1].value = 0
            rmActCueNum.children[1].value = 0
            rmActSendValue.children[1].value = 0
            break
          case 'rmTriggerSource':
            rmSourcePort.children[1].value = 0
            rmSourceAddress.children[1].value = 1
            rmSourceUniverse.children[1].value = 1
            break
        }
      }

      /**
      * Updates the visibility and values of elements based on selected options.
      */
      const updateVisibility = () => {
        this.#disabledElem({ elem: allInputs, disabled: true })
        this.#disabledElem({ elem: [rmActionEvent, TriggerTitle, rmTriggerSource] })
        switch (Number(rmTriggerSource.children[1].value)) { // Trigger Source
          case 0: // Disable
            break
          case 1: // DMX Port
            this.#disabledElem({ elem: [rmSourcePort, rmSourceAddress] })
            break
          case 2: //Artnet
          case 3: //sACN
            this.#disabledElem({ elem: [rmSourceUniverse, rmSourceAddress] })
            break
        }
        switch (Number(rmActionEvent.children[1].value)) { // Event Type
          case 0: // Disable DMX
            break
          case 1: // Cue
            this.#disabledElem({ elem: [TypeTitle, rmActCueNum, rmActCueMode] })
            break
          case 2: // Netron preset
            this.#disabledElem({ elem: [TypeTitle, rmActPresetNum] })
            break
          case 3: // User preset
            this.#disabledElem({ elem: [TypeTitle, rmActUserPresetNum] })
            break
          case 4: // Send value
            this.#disabledElem({ elem: [TypeTitle, rmActSendValue] })
            break
        }
      }

      updateVisibility()

      form.form.addEventListener('change', e => {
        switch (e.target.name) {
          case 'rmTriggerSource':
          case 'rmActionEvent':
            defaultValues(e)
            updateVisibility()
            break
          default:
            break
        }
      })

      /**
       * Handles the form submission callback
       * @param {FormData} formData - The form data to process
       * @returns {string|false} Error message if there is an error, otherwise false
       */
      const callback = formData => {
        for (const [key, val] of formData.entries()) {
          if (key !== 'idx' && key !== 'EndFlag') { // Do not try to update non existing thing
            this.#device.remoteInputs[i][key] = Number(val)
          }
        }
        nodes.portIcon[i].className = this.#getInputPortIcon({ port: port }) // Update Port Icon
      }

      /**
      * List of form elements and their corresponding preprocessing functions.
      * @type {Array<{key: string, elem: HTMLElement, precall?: Function}>}
      */
      const list = [
        { key: 'idx', directValue: form.form.dataset.idx },
        { key: 'rmActionEvent', elem: rmActionEvent },
        { key: 'rmActCueNum', elem: rmActCueNum },
        { key: 'rmActCueMode', elem: rmActCueMode },
        { key: 'rmActPresetNum', elem: rmActPresetNum },
        { key: 'rmActUserPresetNum', elem: rmActUserPresetNum },
        { key: 'rmActSendValue', elem: rmActSendValue },
        { key: 'rmTriggerSource', elem: rmTriggerSource },
        { key: 'rmSourcePort', elem: rmSourcePort },
        { key: 'rmSourceaddress', elem: rmSourceAddress },
        { key: 'rmSourceUniverse', elem: rmSourceUniverse, precall: (value, formData) => this.#translate.rmSourceUniverse({ device: true, value: value, line: { rmTriggerSource: formData.get('rmTriggerSource') } }) }
      ]

      this.sendForm({
        list: list,
        form: form.form,
        button: button,
        url: apis.saveInput,
        callback: callback,
        success: this.#translate.replaceText({
          text: word.page.inputs_Success,
          search: { '%1': i + 1 }
        })
      })
    })
    this.#pageContent.append(ul, div)
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
