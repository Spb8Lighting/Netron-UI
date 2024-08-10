import { emptyAttr, translate, word } from 'config'

/**
 * Class representing a translation utility for device configurations.
 */
export default class Translate {
  #device = undefined
  #empty = emptyAttr

  /**
   * Creates an instance of Translate.
   * @param {Object} params - The parameters for initialization.
   * @param {Object} params._DEVICE_ - The device object containing configuration settings.
   */
  constructor({ _DEVICE_ }) {
    this.#device = _DEVICE_
    this.#createTranslateMethods()
  }

  /**
   * Dynamically creates translation methods based on the `translate` configuration.
   */
  #createTranslateMethods() {
    for (const attr in translate) {
      const methodName = `get${attr.charAt(0).toUpperCase()}${attr.slice(1)}`
      Translate.prototype[methodName] = Object.defineProperty(
        function (desc = false) {
          if (desc) {
            return translate[attr]
          }
          return this[methodName](true).map(elem => elem.name)
        },
        'name',
        { value: methodName }
      )
    }
  }

  /**
   * Replaces occurrences of search values in the text with replacement values.
   * @param {Object} params - The parameters for text replacement.
   * @param {string} params.text - The text to perform replacements on.
   * @param {Object} params.search - An object where keys are substrings to search for and values are their replacements.
   * @returns {string} - The text with replacements applied.
   */
  replaceText({ text, search }) {
    for (const val in search) {
      text = text.replace(new RegExp(val, 'g'), search[val])
    }
    return text
  }

  /**
   * Determines if a given preset ID corresponds to Artnet protocol based on device type.
   * @param {Object} params - The parameters for checking the preset.
   * @param {number} params.presetID - The preset ID to check.
   * @returns {boolean} - True if the preset ID is for Artnet, otherwise false.
   */
  isPresetArtnet({ presetID }) {
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

  /**
   * Checks if the given protocol corresponds to Artnet.
   * @param {number|string} protocol - The protocol value to check.
   * @returns {boolean} - True if the protocol is Artnet, otherwise false.
   */
  isProtocolArtnet(protocol) {
    return Number(protocol) === translate.ptProtocol.map(e => e.name).indexOf(word.ArtNet)
  }

  /**
   * Adjusts the universe value based on the protocol and device settings.
   * @param {Object} params - The parameters for adjusting the universe.
   * @param {number|string} params.value - The universe value to adjust.
   * @param {Object} [params.device] - Optional device object to consider.
   * @param {Object} [params.line] - Optional line object containing protocol and mode info.
   * @returns {number} - The adjusted universe value.
   */
  ptUniverse({ value, device, line }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, universe: true })) {
      return this.#empty
    }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, InputUniverse: true })) {
      return this.#empty
    }

    const valueNumber = Number(value)
    const isArtnet = this.#determineArtnetProtocol(line)

    if (this.#device.setting.UniverseMode === 0 && isArtnet) {
      return device ? valueNumber - 1 : valueNumber + 1
    }
    return valueNumber
  }
  InputUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }
  ptMergeUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }
  ptResendUniverse({ value, device, line }) { return this.ptUniverse({ value: value, device: device, line: line }) }

  /**
   * Determines if the protocol is Artnet based on the provided line object.
   * @param {Object} line - The line object containing protocol information.
   * @returns {boolean} - True if the protocol is Artnet, otherwise false.
   */
  #determineArtnetProtocol(line) {
    if (line?.ptProtocol !== undefined) {
      return this.isProtocolArtnet(line.ptProtocol)
    } else if (line?.ptResendProtocol !== undefined) {
      return this.isProtocolArtnet(line.ptResendProtocol)
    } else if (line?.InputProtocol !== undefined) {
      return this.isProtocolArtnet(line.InputProtocol)
    } else if (line?.presetID !== undefined) {
      return this.isPresetArtnet(line)
    }
    return false
  }

  /**
   * Formats an "OnTime" value into a human-readable string.
   * @param {Object} params - The parameters for formatting the time value.
   * @param {string} params.value - The time value to format (e.g., "1200h").
   * @returns {string} - The formatted time string.
   */
  OnTime({ value }) {
    const realValue = Number(value.slice(0, -1))
    const days = Math.floor(realValue / 24)
    const weeks = Math.floor(days / 7)
    return this.replaceText({
      text: word.page.status_OnTime,
      search: {
        '%1': realValue,
        '%2': weeks,
        '%3': weeks > 1 ? 's' : '',
        '%4': days,
        '%5': days > 1 ? 's' : ''
      }
    })
  }

  /**
   * Retrieves a real value from an array by index, defaulting to the index if the value is not found.
   * @param {number} index - The index to use for retrieval.
   * @param {Array} array - The array to retrieve the value from.
   * @returns {*} - The value at the index or the index itself if the value is not found.
   */
  #getRealValue(index, array) {
    const value = array[index]
    return value !== undefined ? value : index
  }

  /**
   * Gets the address mode based on value and description.
   * @param {Object} params - The parameters for getting the address mode.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {boolean} [params.desc] - Optional description flag.
   * @returns {*} - The address mode value.
   */
  addressmode({ value, desc }) {
    return this.#getRealValue(value, this.getAddressmode(desc))
  }

  /**
   * Gets the merge mode based on value and description.
   * @param {Object} params - The parameters for getting the merge mode.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {boolean} [params.desc] - Optional description flag.
   * @returns {*} - The merge mode value.
   */
  ptMergeMode({ value, desc }) {
    return this.#getRealValue(value, this.getPtMergeMode(desc))
  }
  MergerMode({ value, desc }) { return this.ptMergeMode({ value: value, desc: desc }) }

  /**
   * Gets the source value based on value and description.
   * @param {Object} params - The parameters for getting the source value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {boolean} [params.desc] - Optional description flag.
   * @returns {*} - The source value.
   */
  ptSource({ value, desc }) {
    return this.#getRealValue(value, this.getPtSource(desc))
  }

  /**
   * Gets the RDM (Remote Device Management) value based on value, line, and description.
   * @param {Object} params - The parameters for getting the RDM value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {Object} [params.line] - Optional line object containing mode and source info.
   * @param {boolean} [params.desc] - Optional description flag.
   * @returns {*} - The RDM value.
   */
  ptRDM({ value, line, desc }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, rdm: true })) {
      return this.#empty
    }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, rdm: true })) {
      return this.#empty
    }
    return this.#getRealValue(value, this.getPtRDM(desc))
  }
  InputRDM({ value, line, desc }) { return this.ptRDM({ value: value, line: line, desc: desc }) }

  /**
   * Handles protocol-specific logic for getting the value.
   * @param {Object} params - The parameters for getting the protocol value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {Object} [params.line] - Optional line object.
   * @returns {*} - The protocol value.
   */
  ptProtocol({ value, line }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, protocol: true })) {
      return this.#empty
    }
    if (line?.InputSource !== undefined && !this.InputSource({ value: line.InputSource, inputProtocol: true })) {
      return this.#empty
    }
    return this.#getRealValue(value, this.getPtProtocol())
  }
  InputProtocol({ value, line }) { return this.ptProtocol({ value: value, line: line }) }
  ptResendProtocol({ value, line }) { return this.ptProtocol({ value: value, line: line }) }


  /**
   * Gets the frame rate value based on value, line, and description.
   * @param {Object} params - The parameters for getting the frame rate value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {Object} [params.line] - Optional line object.
   * @param {boolean} [params.desc] - Optional description flag.
   * @returns {*} - The frame rate value.
   */
  ptFramerate({ value, line, desc }) {
    if (line?.ptMode !== undefined && !this.ptMode({ value: line.ptMode, framerate: true })) {
      return this.#empty
    }
    return this.#getRealValue(value, this.getPtFramerate(desc))
  }
  InputFrameRate({ value, line, desc }) { return this.ptFramerate({ value: value, line: line, desc: desc }) }
  MergerFrameRate({ value, line, desc }) { return this.ptFramerate({ value: value, line: line, desc: desc }) }

  /**
   * Gets the input source value based on value, description, and other flags.
   * @param {Object} params - The parameters for getting the input source value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {boolean} [params.desc] - Optional description flag.
   * @param {boolean} [params.inputProtocol] - Optional flag for input protocol.
   * @param {boolean} [params.rdm] - Optional flag for RDM.
   * @param {boolean} [params.InputUniverse] - Optional flag for input universe.
   * @returns {*} - The input source value.
   */
  InputSource({ value, desc, inputProtocol, rdm, InputUniverse }) {
    const realValue = this.#getRealValue(value, this.getInputSource(desc))
    switch (Number(value)) {
      case 0: // DMX
        return inputProtocol || InputUniverse ? false : realValue
      case 2: // Send value
        return inputProtocol || InputUniverse || rdm ? false : realValue
      default:
        return realValue
    }
  }

  /**
   * Generates a list of DMX ports with feedback about cloning status.
   * @param {number} currentPort - The current port to use as a reference.
   * @returns {Array} - An array of feedback objects about port cloning status.
   */
  getPtClonePort(currentPort) {
    const list = new Set()
    this.#device.dmxPorts.forEach((currentDMXPort, i) => {
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
        feedback = this.#generateClonePortFeedback(currentPort, currentDMXPort, i, portNumber)
      }
      list.add(feedback)
    })

    const arrayList = [...list]
    arrayList.unshift(arrayList.splice(currentPort, 1)[0])
    return arrayList
  }

  /**
   * Generates feedback about cloning status for a specific port.
   * @param {number} currentPort - The current port to use as a reference.
   * @param {Object} currentDMXPort - The DMX port object being checked.
   * @param {number} i - The index of the port.
   * @param {number} portNumber - The port number.
   * @returns {Object} - Feedback object about the port's cloning status.
   */
  #generateClonePortFeedback(currentPort, currentDMXPort, i, portNumber) {
    if (!this.isClonedPort({ portID: i, port: { ...currentDMXPort, ptClonePort: currentPort } })) {
      return {
        name: i === currentPort ? word.page.dmxPorts_ClonePort_None
          : this.replaceText({ text: word.page.dmxPorts_ClonePort_Free, search: { '%1': portNumber } }),
        value: i,
        desc: i === currentPort ? ''
          : this.replaceText({ text: word.page.dmxPorts_ClonePort_Free_desc, search: { '%1': portNumber } })
      }
    }

    if (!this.isClonedPort({ portID: currentPort, port: currentDMXPort })) {
      return {
        name: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningLocal, search: { '%1': portNumber, '%2': currentPort + 1 } }),
        desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningLocal_desc, search: { '%1': portNumber, '%2': currentPort + 1 } }),
        value: i,
        disabled: true
      }
    }

    if (this.isClonedPort({ portID: i, port: currentDMXPort })) {
      return {
        name: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningDistant, search: { '%1': portNumber, '%2': currentDMXPort.ptClonePort + 1 } }),
        desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_PortIsCloningDistant_desc, search: { '%1': portNumber, '%2': currentDMXPort.ptClonePort + 1 } }),
        value: i,
        disabled: true
      }
    }

    return {
      name: this.replaceText({ text: word.page.dmxPorts_ClonePort_Free, search: { '%1': portNumber } }),
      value: i,
      desc: this.replaceText({ text: word.page.dmxPorts_ClonePort_Free_desc, search: { '%1': portNumber } })
    }
  }

  /**
   * Checks if a port is cloned.
   * @param {Object} params - The parameters for checking cloning status.
   * @param {number} params.portID - The port ID to check against.
   * @param {Object} params.port - The port object to check.
   * @returns {boolean} - True if the port is cloned, otherwise false.
   */
  isClonedPort({ portID, port }) {
    return Number(port.ptMode) === 2 && Number(port.ptClonePort) !== portID
  }

  /**
   * Gets the ptMode value based on the value and description.
   * @param {Object} params - The parameters for getting the ptMode value.
   * @param {number|string} params.value - The value to use for lookup.
   * @param {boolean} [params.desc] - Optional description flag.
   * @param {boolean} [params.universe] - Optional flag for universe.
   * @param {boolean} [params.rdm] - Optional flag for RDM.
   * @param {boolean} [params.protocol] - Optional flag for protocol.
   * @param {boolean} [params.framerate] - Optional flag for frame rate.
   * @returns {*} - The ptMode value.
   */
  ptMode({ value, desc, universe, rdm, protocol, framerate }) {
    const ptModeDesc = this.getPtMode(desc)
    if (universe || rdm || protocol || framerate) {
      return this.#getRealValue(value, ptModeDesc)
    }
    return this.#getRealValue(value, ptModeDesc)
  }

  /**
   * Gets the ptMode description based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of ptMode descriptions or names.
   */
  getPtMode(desc) {
    return desc ? translate.ptMode : translate.ptMode.map(e => e.name)
  }

  /**
   * Gets the address mode descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of address mode descriptions or names.
   */
  getAddressmode(desc) {
    return desc ? translate.addressmode : translate.addressmode.map(e => e.name)
  }

  /**
   * Gets the merge mode descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of merge mode descriptions or names.
   */
  getPtMergeMode(desc) {
    return desc ? translate.ptMergeMode : translate.ptMergeMode.map(e => e.name)
  }

  /**
   * Gets the source descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of source descriptions or names.
   */
  getPtSource(desc) {
    return desc ? translate.ptSource : translate.ptSource.map(e => e.name)
  }

  /**
   * Gets the RDM descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of RDM descriptions or names.
   */
  getPtRDM(desc) {
    return desc ? translate.ptRDM : translate.ptRDM.map(e => e.name)
  }

  /**
   * Gets the protocol descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of protocol descriptions or names.
   */
  getPtProtocol(desc) {
    return desc ? translate.ptProtocol : translate.ptProtocol.map(e => e.name)
  }

  /**
   * Gets the frame rate descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of frame rate descriptions or names.
   */
  getPtFramerate(desc) {
    return desc ? translate.ptFramerate : translate.ptFramerate.map(e => e.name)
  }

  /**
   * Gets the input source descriptions based on the description flag.
   * @param {boolean} desc - The description flag.
   * @returns {Array} - The list of input source descriptions or names.
   */
  getInputSource(desc) {
    return desc ? translate.InputSource : translate.InputSource.map(e => e.name)
  }
}