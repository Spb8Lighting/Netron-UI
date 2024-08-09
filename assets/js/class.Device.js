import { apis } from 'config'

export default class Device {

  #fetch = undefined

  #EventName = undefined

  constructor({ EventName, _FETCH_ }) {
    this.#EventName = EventName

    this.#fetch = _FETCH_
    this._setting = { file: apis.setting, data: {} }
    this._IP = { file: apis.IP, data: {} }
    this._index = { file: apis.index, data: {} }
    this._dmxPorts = { file: apis.dmxPorts, data: {}, display: {} }
    this._identify = { file: apis.identify, data: {} }
    this._presets = { file: apis.presets, data: {} }
    this._userPresets = { file: apis.userPresets, data: {} }
    this._cues = { file: apis.cues, data: {} }
    this._cuesSetting = { file: apis.cuesSetting, data: {} }
    this._cuesStatus = { file: apis.cuesStatus, data: {} }
    this._remoteInputs = { file: apis.remoteInputs, data: {} }
  }

  async bulkUpdate() {
    return new Promise(async resolve => {
      const data = await this.#fetch.bulkGet({ arrayOfFile: this.getFiles() })
      let i = 0
      for (const key in this) {
        this[key.substring(1)] = data[i]
        i++
      }
      // Add additional properties related to Netron RDM10
      this.setNetronRDM10()
      if (this._setting.data.DeviceType === 'NETRON RDM10') {
        const dataRDM10 = await this.#fetch.bulkGet({ arrayOfFile: this.getNetronRDM10Files() })
        this.dmxInputTab = dataRDM10[0]
        this.dmxInputMerger = dataRDM10[1]
      }
      resolve(true)
    })
  }

  getFiles() {
    const feedback = new Set()
    for (const key in this) {
      feedback.add(this[key].file)
    }
    return feedback
  }

  getNetronRDM10Files() {
    const feedback = new Set()
    feedback.add(this._dmxInputTab.file)
    feedback.add(this._dmxInputMerger.file)
    return feedback
  }

  setNetronRDM10() {
    this._dmxInputTab = { file: apis.dmxInputTab, data: {} }
    this._dmxInputMerger = { file: apis.dmxInputMerger, data: {} }
  }

  reIpAddress(val) {
    return val.split('.').map(input => Number(input)).join('.')
  }

  /* Getters */
  get setting() { return this._setting.data }
  get IP() { return this._IP.data }
  get index() { return this._index.data }
  get dmxPorts() { return this._dmxPorts.data }
  get dmxPortsDisplay() { return this._dmxPorts.display }
  get identify() { return this._identify.data }
  get presets() { return this._presets.data }
  get userPresets() { return this._userPresets.data }
  get cues() { return this._cues.data }
  get cuesSetting() { return this._cuesSetting.data }
  get cuesStatus() { return this._cuesStatus.data }
  get remoteInputs() { return this._remoteInputs.data }
  get dmxInputTab() { return this._dmxInputTab.data }
  get dmxInputMerger() { return this._dmxInputMerger.data }

  /* Setters */
  set setting(value) {
    this._setting.data = value
  }
  set IP(value) {
    this._IP.data = {
      ...value,
      ipaddress: this.reIpAddress(value.ipaddress),
      netmask: this.reIpAddress(value.netmask)
    }
  }
  set index(value) {
    this._index.data = {
      ...value,
      BootVer: value.BootVer.toLowerCase(),
      FirmwareVer: value.FirmwareVer.toLowerCase(),
      WebVer: value.WebVer.toLowerCase()
    }
  }
  set dmxPorts(value) {
    this._dmxPorts.data = value
  }
  set identify(value) {
    if (Number(value.IdentifyStatus) > 0) { // Sent event to activate the notify feedback when on
      document.dispatchEvent(new Event(this.#EventName.identifyIsOn))
    }
    this._identify.data = value
  }
  set presets(value) {
    this._presets.data = value.map(preset => {
      return {
        ...preset,
        name: preset.name.trim()
      }
    })
  }
  set userPresets(value) {
    this._userPresets.data = value.map(preset => {
      return {
        ...preset,
        name: preset.name.trim()
      }
    })
  }
  set cues(value) {
    this._cues.data = value
  }
  set cuesSetting(value) {
    this._cuesSetting.data = value
  }
  set cuesStatus(value) {
    this._cuesStatus.data = value
  }
  set remoteInputs(value) {
    this._remoteInputs.data = value
  }
  set dmxInputTab(value) {
    this._dmxInputTab.data = value
  }
  set dmxInputMerger(value) {
    this._dmxInputMerger.data = value
  }

  /* Identify methods */

  isIdentified() { return Number(value.IdentifyStatus) > 0 }

  async setIdentify(IdentifyStatus = 2) {
    const formData = new FormData()
    formData.append('IdentifyStatus', IdentifyStatus)
    formData.append('EndFlag', 1)

    await this.#fetch.post({ url: apis.setIdentify, formData: formData })

    this._identify.data.IdentifyStatus = IdentifyStatus
  }

  async unsetIdentify() {
    await this.setIdentify(0)
  }

  async toggleIdentify() {
    if (this.isIdentified()) {
      return await this.unsetIdentify()
    }
    return await this.setIdentify()
  }
}