import { emptyAttr, translate, word } from 'config'

export default class Translate {
  #device = undefined
  #empty = emptyAttr

  constructor({ _DEVICE_ }) {
    this.#device = _DEVICE_
    this.createTranslateMethod()
  }

  /* Translate values */
  createTranslateMethod() {
    for (const attr in translate) {
      const name = `get${attr.charAt(0).toUpperCase()}${attr.slice(1)}`
      Translate.prototype[name] = Object.defineProperty(function (desc = false) {
        if (desc) {
          return translate[attr]
        }
        return this[name](true).map(elem => elem.name)
      }, 'name', { value: name })
    }
  }

  replaceText({ text, search }) {
    for (const val in search) {
      text = text.replace(new RegExp(val, 'g'), search[val])
    }
    return text
  }

  isPresetArtnet({ presetID }) {
    // Artnet mode ID per device
    const isArtnet = {
      default: new Set([0, 1, 2, 3, 4, 5, 6, 15]),
      RDM10: new Set([6, 7])
    }
    let artNetCheck = isArtnet.default
    if (this.#device.setting.DeviceType === 'NETRON RDM10') {
      artNetCheck = isArtnet.RDM10
    }
    return artNetCheck.has(Number(presetID))
  }

  isProtocolArtnet(protocol) {
    return Number(protocol) === translate.ptProtocol.map(e => e.name).indexOf(word.ArtNet)
  }

  ptUniverse({ value, device, line }) {
    // For artnet preset, auto increment value by 1, or remove 1 from user input based on user input

    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, universe: true })) { return this.#empty }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, InputUniverse: true })) { return this.#empty }

    const valueNumber = Number(value)

    let isArtnet = false

    // Information coming from DMXPort.json
    if (line?.ptProtocol !== undefined) {
      isArtnet = this.isProtocolArtnet(line.ptProtocol)
    } else if (line?.ptResendProtocol !== undefined) { // ptProtocol removed for merge from DMXPort.json
      isArtnet = this.isProtocolArtnet(line.ptResendProtocol)
    } else if (line?.InputProtocol !== undefined) { // Coming from DMXInputab.json
      isArtnet = this.isProtocolArtnet(line.InputProtocol)
    } else if (line?.presetID !== undefined) { // Coming from FORM
      isArtnet = this.isPresetArtnet(line)
    }

    if (this.#device.setting.UniverseMode === 0 && isArtnet) {
      return device ? valueNumber - 1 : valueNumber + 1
    }
    return valueNumber
  }
  InputUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }
  ptMergeUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }
  ptResendUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }

  OnTime({ value }) {
    const realValue = Number(value.slice(0, -1))
    const days = Math.floor(realValue / 24)
    const weeks = Math.floor(days / 7)
    return this.replaceText({ text: word.page.status_OnTime, search: { '%1': realValue, '%2': weeks, '%3': weeks > 1 ? 's' : '', '%4': days, '%5': days > 1 ? 's' : '' } })
  }

  getRealValue(index, array) {
    const value = array[index]
    return value ? value : index
  }

  addressmode({ value, desc }) { return this.getRealValue(value, this.getAddressmode(desc)) }

  ptMergeMode({ value, desc }) { return this.getRealValue(value, this.getPtMergeMode(desc)) }
  MergerMode({ value, desc }) { return this.ptMergeMode({ value: value, desc: desc }) }

  ptSource({ value, desc }) { return this.getRealValue(value, this.getPtSource(desc)) }

  ptRDM({ value, line, desc }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, rdm: true })) { return this.#empty }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, rdm: true })) { return this.#empty }
    return this.getRealValue(value, this.getPtRDM(desc))
  }
  InputRDM({ value, line }) { return this.ptRDM({ value: value, line: line, desc: desc }) }

  ptMode({ value, universe, protocol, framerate, rdm, desc }) {
    const realValue = this.getRealValue(value, this.getPtMode(desc))
    switch (Number(value)) {
      case 0: // Disable
        return universe || protocol || framerate || rdm ? false : realValue
      case 3: // Send value
        return universe || protocol || rdm ? false : realValue
      default:
        return realValue
    }
  }

  ptProtocol({ value, line }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, protocol: true })) { return this.#empty }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, inputProtocol: true })) { return this.#empty }
    return this.getRealValue(value, this.getPtProtocol())
  }
  InputProtocol({ value, line }) { return this.ptProtocol({ value: value, line: line }) }
  ptResendProtocol({ value, line }) { return this.ptProtocol({ value: value, line: line }) }

  ptFramerate({ value, line, desc }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, framerate: true })) { return this.#empty }
    return this.getRealValue(value, this.getPtFramerate(desc))
  }
  InputFrameRate({ value, line, desc }) { return this.ptFramerate({ value: value, line: line, desc: desc }) }
  MergerFrameRate({ value, line, desc }) { return this.ptFramerate({ value: value, line: line, desc: desc }) }

  InputSource({ value, desc, inputProtocol, rdm, InputUniverse }) {
    const realValue = this.getRealValue(value, this.getInputSource(desc))
    switch (Number(value)) {
      case 0: // DMX
        return inputProtocol || InputUniverse ? false : realValue
      case 2: // Send value
        return inputProtocol || InputUniverse || rdm ? false : realValue
      default:
        return realValue
    }
  }

  getPtClonePort(currentPort) {
    const list = new Set()
    for (let i = 0; i < this.#device.dmxPorts.length; i++) {
      const currentDMXPort = this.#device.dmxPorts[i]
      const portNumber = i + 1
      let feedback = {}
      const ptModeString = this.ptMode({ value: currentDMXPort.ptMode })
      if (Number(currentDMXPort.ptMode) !== 2) {
        feedback = {
          name: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortNotOutputting, search: { '%1': portNumber, '%2': ptModeString } }),
          value: i,
          desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortNotOutputting_desc, search: { '%1': portNumber, '%2': ptModeString } }),
          disabled: true
        }
      } else {
        if (!this.isClonedPort({ portID: i, port: { ...currentDMXPort, ptClonePort: currentPort } })) {
          feedback = {
            name: i === currentPort ? word.page.dmxPorts_ClonePort_None
              : this.replaceText({ text: word.page.word.page.dmxPorts_ClonePort_Free, search: { '%1': portNumber } }),
            value: i,
            desc: i === currentPort ? ''
              : this.replaceText({ text: word.page.dmxPorts_ClonePort_Free_desc, search: { '%1': portNumber } })
          }
        } else {
          if (!this.isClonedPort({ portID: currentPort, port: currentDMXPort })) {
            feedback = {
              name: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningLocal, search: { '%1': portNumber, '%2': currentPort + 1 } }),
              desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningLocal_desc, search: { '%1': portNumber, '%2': currentPort + 1 } }),
              value: i,
              disabled: true
            }
          } else if (this.isClonedPort({ portID: i, port: currentDMXPort })) {
            feedback = {
              name: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningDistant, search: { '%1': portNumber, '%2': currentDMXPort.ptClonePort + 1 } }),
              desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningDistant_desc, search: { '%1': portNumber, '%2': currentDMXPort.ptClonePort + 1 } }),
              value: i,
              disabled: true
            }
          } else {
            feedback = {
              name: this.replaceText({ text: word.page.dmxPorts_ClonePort_Free, search: { '%1': portNumber } }),
              value: i,
              desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_Free_desc, search: { '%1': portNumber } })
            }
          }
        }
      }
      list.add(feedback)
    }
    const arrayList = [...list]
    arrayList.unshift(arrayList.splice(currentPort, 1)[0])
    return arrayList
  }

  isClonedPort({ portID, port }) {
    if (Number(port.ptMode) !== 2) { return false }  // Only Output mode can handle cloning
    if (Number(port.ptClonePort) === portID) { return false } // Clone itself is not cloning
    return true
  }

}