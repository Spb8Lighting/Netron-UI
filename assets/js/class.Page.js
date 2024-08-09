import MobileKeyboard from 'MobileKeyboard'
import Translate from 'Translate'
import { EventName, config, attr, word, apis, translate } from 'config'

export default class Page {

  #device = undefined
  #fetch = undefined
  #alert = undefined
  #menu = undefined
  #translate = undefined

  #keyboard = undefined

  #class = {
    pageTitle: 'fs-6 me-0 ms-0 mt-0 mb-2 pe-0 ps-0 pt-0 pb-2 border-bottom border-primary border-2 fw-bold'
  }

  #alertTimeOut = undefined

  #pageTitle = document.getElementById('pageTitle')
  #pageContent = document.getElementById('pageContent')

  constructor({ _DEVICE_, _FETCH_, _ALERT_, _MENU_ }) {
    this.#device = _DEVICE_
    this.#fetch = _FETCH_
    this.#alert = _ALERT_
    this.#menu = _MENU_
    this.#translate = new Translate({ _DEVICE_: _DEVICE_ })

    this.#keyboard = new MobileKeyboard()

    this.addEvents()
  }

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

  setAlert({ elem, value, type }) {
    const originalText = elem.innerText
    elem.innerText = value
    if (!elem.classList.contains('show')) {
      elem.classList.add('show', 'fade', `btn-${type}`)
      elem.type = 'button'
    }
    this.#alert = () => {
      clearTimeout(this.#alertTimeOut)
      elem.classList.remove('show', 'fade', `btn-${type}`)
      elem.innerText = originalText
      elem.type = 'submit'
    }
    this.#alertTimeOut = setTimeout(() => this.#alert(), 2000)
  }

  setTitle(title) {
    this.reset()
    document.title = `${this.#device.setting.DeviceName} - ${title}`
    this.#pageTitle.innerText = title
  }

  getIcon(icon) {
    const i = document.createElement('i')
    i.className = `fa fa-fw ${icon}`
    return i
  }

  getBlockTitle(value, link = false) {
    const p = document.createElement(link ? 'a' : 'p')
    p.className = this.#class.pageTitle + ' w-100'
    p.innerText = value
    if (link) {
      p.href = link
    }
    return p
  }

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
        tdLabel.className = 'w-auto'
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

  reset() {
    this.#pageTitle.innerText = ''
    this.#pageContent.innerHTML = ''
  }

  getNetronResumeTable() {
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

  async getDeviceThumbnail() {
    const img = document.createElement('img')
    img.className = 'img-fix-150'
    img.width = '150'
    img.height = '150'

    try {
      const response = await fetch(`./assets/img/${this.#device.setting.DeviceType}.png`, { method: 'HEAD' })
      if (response.ok) {
        img.src = `./assets/img/${this.#device.setting.DeviceType}.png`
      } else {
        img.src = `./assets/img/netron.svg`
      }
    } catch (error) { }

    return img
  }

  getRow() {
    const div = document.createElement('div')
    div.className = 'row m-0 p-0'
    return div
  }

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

    let input = undefined
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

          // Specific option to hide other inputs
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

        // Additional rework to add optgroup
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

  getSubmit(action) {
    const button = document.createElement('button')
    button.type = 'submit'
    button.className = 'btn btn-primary mt-4'
    button.innerText = action
    return button
  }

  getForm({ id, label, explanation }) {
    const form = document.createElement('form')
    form.className = 'm-0 p-0 mb-5'
    if (id) { form.id = id }

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
          if (input.type === 'checkbox') { // Rework value for checkbox
            value = input.checked ? 1 : 0
          }
          map.set(elem.key, value)
        }
      }
    }
    return map
  }

  sendForm({ list, form, button, url, check, success, callback }) {
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

      let error = undefined
      if (callback && typeof callback === 'function') {
        error = callback(formData)
      }
      if (check && typeof check === 'function') {
        error = error ? error : check()
      }

      if (!error) {
        await this.#fetch.post({ url: url, formData: formData })
      }

      this.setAlert({ elem: button, value: error ? error : success, type: error ? 'danger' : 'success' })
    })
  }

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

  page_404(pageRequest) {
    this.setTitle(word.page.notFound)

    const p = document.createElement('p')
    p.innerHTML = this.#translate.replaceText({ text: word.page.notFound_desc, search: { '%1': pageRequest } })

    const icon = this.getIcon('fa-triangle-exclamation')
    icon.classList.add('text-warning')

    p.prepend(icon)

    this.#pageContent.append(p)
  }

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
        attr.netmask,
      ],
      content: { ...this.#device.setting, ...this.#device.IP }
    })

    infosTable.classList.add('col')

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

    DMXPortsTable.classList.add('col')

    const divPort = this.getRow()

    divPort.append(DMXPortsTitle, this.getNetronResumeTable(), DMXPortsTable)

    this.#pageContent.append(divPort)
  }

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

  page_presetsUser() {
    this.setTitle(word.page.userPresets)

    const formLoad = this.getForm({ label: word.page.userPresets_Load, explanation: word.page.userPresets_LoadExplanation })

    const Preset = this.getInput({
      label: config.presets.name.slice(0, -1),
      id: 'PresetNum',
      icon: config.presets.icon,
      type: 'select',
      specific: 'owner',
      options: this.#device.userPresets,
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
      options: this.#device.userPresets,
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

    const callback = (formData) => {
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

  page_dmxPorts() {
    const getPortIcon = ({ port, portID }) => {
      let icon = undefined
      switch (port.ptMode) {
        case 0: // Disable
          icon = 'fa-ban'
          break
        case 1: // Input
          icon = 'fa-arrow-right-to-bracket'
          break
        case 2: // Ouput
          icon = 'fa-arrow-right-from-bracket'
          break
        case 3: // Send value
          icon = 'fa-volume-high'
          break
      }
      if (this.#translate.isClonedPort({ portID: portID, port: port })) {
        icon = 'fa-clone'
      }
      return `fa fa-fw ${icon}`
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
      const li = document.createElement('li')
      li.className = 'nav-item'
      li.role = 'presentation'

      ul.append(li)

      nodes.portIcon[i] = document.createElement('i')
      nodes.portIcon[i].className = getPortIcon({ port: port, portID: i })

      const link = document.createElement('button')
      link.type = 'button'
      link.className = 'nav-link'
      if (i === 0) {
        link.classList.add('active')
      }
      link.role = 'tab'
      link.dataset.bsToggle = 'tab'
      link.dataset.bsTarget = `#dmxPort${i}`
      link.ariaControls = link.dataset.bsTarget
      link.innerText = this.#translate.replaceText({ text: word.page.dmxPorts_Tab, search: { '%1': i + 1 } })
      link.id = `dmxPort${i}-tab`

      link.prepend(nodes.portIcon[i])

      li.append(link)

      // Generate Pane

      const form = this.getForm({ id: link.dataset.bsTarget.substring(1) })
      form.form.className = 'tab-pane fade pt-2'
      if (i === 0) {
        form.form.classList.add('show', 'active')
      }
      form.form.dataset.idx = i + 1
      form.form.role = 'tabpanel'
      form.form.tabIndex = 0
      form.form.ariaLabelledby = link.id

      div.append(form.form)

      /** Settings */
      const PortSettingsTitle = this.getBlockTitle(word.page.dmxPorts_Setting)

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
        defaultValue: port.ptRDM === 1
      })

      /** Input/Ouput */
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

      ptClonePort.addEventListener('change', e => {
        const value = Number(e.target.value)
        if (value === i) {
          defaultValues()
        }
        updateVisibilityAndValues()
      })
      ptMode.addEventListener('change', e => {
        defaultValues()
        updateVisibilityAndValues()
      })
      ptProtocol.addEventListener('change', e => updateVisibilityAndValues())
      ptMergeMode.addEventListener('change', e => updateVisibilityAndValues())
      ptResendProtocol.addEventListener('change', e => updateVisibilityAndValues())

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

      const callback = formData => {
        /* Manage Errors */
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

        if (error) {
          return error
        }
        for (const [key, val] of formData.entries()) {
          if (key !== 'idx') { // Do not try to update non existing thing
            this.#device.dmxPorts[i][key] = Number(val)
          }
        }

        nodes.portIcon[i].className = getPortIcon({ port: port, portID: i }) // Update Port Icon

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

      const check = () => {
        if (ptMode.children[1].value !== 0) { // !Disable
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

      this.sendForm({ list: list, form: form.form, button: button, url: apis.saveDMXPort, check: check, callback: callback, success: word.page.dmxPorts_SubmitSuccess })

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
  async page_systemStatus() {
    this.setTitle(word.page.status)
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

    deviceTable.classList.add('col')

    div.append(deviceTitle, await this.getDeviceThumbnail(), deviceTable)

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


    this.#pageContent.append(div, divIP, divFirmware)
  }
}
