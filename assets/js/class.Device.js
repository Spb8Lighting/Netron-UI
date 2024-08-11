import { apis } from 'config'

export default class Device {

  #fetch = undefined
  #EventName = undefined

  constructor({ EventName, _FETCH_ }) {
    this.#validatePresence(EventName, 'EventName')
    this.#validatePresence(_FETCH_, '_FETCH_')

    this.#EventName = EventName
    this.#fetch = _FETCH_

    // Initialize files and data
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

  /**
   * Checks if a parameter is present; if not, throws an error with the parameter name.
   * @param {*} param Parameter to check.
   * @param {String} paramName Parameter name used in the error message.
   * @throws {Error} If the parameter is missing.
   */
  #validatePresence(param, paramName) {
    if (param === undefined || param === null) {
      throw new Error(`The '${paramName}' parameter is required.`)
    }
  }

  /**
   * Downloads all necessary files for the device and additional files if Netron RDM 10 is detected.
   * @returns {Boolean} True if all files were downloaded successfully, otherwise false.
   */
  async bulkUpdate() {
    try {
      const data = await this.#fetch.bulkGet({ arrayOfFile: this.#getFiles() })

      let i = 0
      for (const key in this) {
        if (this[key]?.file) {
          this[key.substring(1)] = data[i]
          i++
        }
      }

      this.#setNetronRDM10()
      if (this._setting.data.DeviceType === 'NETRON RDM10') {
        const dataRDM10 = await this.#fetch.bulkGet({ arrayOfFile: this.#getNetronRDM10Files() })
        this.dmxInputTab = dataRDM10[0]
        this.dmxInputMerger = dataRDM10[1]
      }

      return true
    } catch (error) {
      console.error('Error during bulkUpdate:', error)
      return false  // Feedback on the error
    }
  }

  /**
   * Prepares the list of files to be downloaded for all devices.
   * @returns {Set} List of files to be downloaded.
   */
  #getFiles() {
    const feedback = new Set()
    for (const key in this) {
      if (this[key]?.file) {
        feedback.add(this[key].file)
      }
    }
    return feedback
  }

  /**
   * Prepares the list of additional files to be downloaded for the Netron RDM10 device.
   * @returns {Set} List of additional files to be downloaded.
   */
  #getNetronRDM10Files() {
    const feedback = new Set()
    feedback.add(this._dmxInputTab.file)
    feedback.add(this._dmxInputMerger.file)
    return feedback
  }

  /**
   * Sets additional attributes for the Netron RDM10 device.
   */
  #setNetronRDM10() {
    this._dmxInputTab = { file: apis.dmxInputTab, data: {} }
    this._dmxInputMerger = { file: apis.dmxInputMerger, data: {} }
  }

  /**
   * Normalizes an IP address or netmask by converting each octet to a number.
   * Example: "192.168.001.001" becomes "192.168.1.1".
   * @param {string} val - The IP address or netmask as a string.
   * @returns {string} - The normalized IP address or netmask.
   */
  reIpAddress(val) {
    return val.split('.').map(input => String(Number(input))).join('.')
  }

  /**
   * Formats an IP address to ensure each octet is padded to three digits.
   * @param {string} value - The IP address value to format.
   * @returns {string} The formatted IP address.
   */
  deIpAddress(val) {
    return val.split('.').map(input => String(input).padStart(3, '0')).join('.')
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
    console.log('IP from DEVICE', value)
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
    if (Number(value.IdentifyStatus) > 0) {
      document.dispatchEvent(new Event(this.#EventName.identifyIsOn))
    }
    this._identify.data = value
  }
  set presets(value) {
    this._presets.data = this.#_processPresets(value)
  }
  set userPresets(value) {
    this._userPresets.data = this.#_processPresets(value)
  }

  /**
   * Removes whitespace around the name attribute of each preset.
   * @param {[Object]} presets List of presets.
   * @returns {[Object]} List of presets with normalized names.
   */
  #_processPresets(presets) {
    return presets.map(preset => ({
      ...preset,
      name: preset.name.trim()
    }))
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

  /* Identify Methods */

  /**
   * Sends the identify function to the device.
   * @param {Integer} IdentifyStatus Status to set (default 2).
   */
  async setIdentify(IdentifyStatus = 2) {
    if (this._identify.data.IdentifyStatus === IdentifyStatus) {
      return // Do nothing if the state is already the same
    }

    const formData = new FormData()
    formData.append('IdentifyStatus', IdentifyStatus)
    formData.append('EndFlag', 1)

    try {
      await this.#fetch.post({ url: apis.setIdentify, formData: formData })
      this._identify.data.IdentifyStatus = IdentifyStatus
    } catch (error) {
      console.error('Error setting identify status:', error)
    }
  }

  /**
   * Deactivates the identify function by sending 0 to setIdentify.
   */
  async unsetIdentify() {
    await this.setIdentify(0)
  }

  /**
   * Toggles between the two states of setIdentify.
   */
  async toggleIdentify() {
    try {
      if (this.isIdentified()) {
        await this.unsetIdentify()
      } else {
        await this.setIdentify()
      }
    } catch (error) {
      console.error('Error toggling identify status:', error)
    }
  }

  /**
   * Returns the current status of the identify function.
   * @returns {Boolean} True if identify is active, otherwise false.
   */
  isIdentified() {
    return Number(this._identify.data.IdentifyStatus) > 0
  }
}