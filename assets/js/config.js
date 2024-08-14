const activeDevMode = true // Set to false to go in production mode

const devModes = ['NETRON EP1', 'NETRON EP2', 'NETRON EP4', 'NETRON EN4', 'NETRON EN12']

const getRandomDevMode = () => {
  const randomIndex = Math.floor(Math.random() * devModes.length)
  return devModes[randomIndex]
}

export const devMode = activeDevMode ? getRandomDevMode() : ''

/**
 * Configuration for application pages and menu items.
 * Each entry represents a page or a menu item in the application.
 * Items with nested entries have sub-menu items.
 * 
 * Only the 'name' parameter can be translated.
 */
export const config = {
  home: {
    icon: 'fa-home', name: 'Home'
  },
  presets: {
    icon: 'fa-sliders', name: 'Presets',
    items: {
      netron: { name: 'Netron presets' },
      user: { name: 'User presets' }
    }
  },
  dmxInputs: {
    icon: 'fa-square-arrow-up-right', name: 'DMX inputs', restricted: ['NETRON RDM10']
  },
  dmxPorts: {
    icon: 'fa-circle-notch', name: 'DMX ports'
  },
  cues: {
    icon: 'fa-film', name: 'Cues',
    items: {
      run: { name: 'Run cue' },
      save: { name: 'Save cue' },
      options: { name: 'Cue options' }
    }
  },
  ipSettings: {
    icon: 'fa-laptop', name: 'IP settings'
  },
  inputs: {
    icon: 'fa-arrow-right-to-bracket', name: 'Inputs'
  },
  system: {
    icon: 'fa-cog', name: 'System',
    items: {
      deviceSettings: { name: 'Device settings' },
      status: { name: 'Status' },
      maintenance: { name: 'Maintenance' }
    }
  }
}

/**
 * Contains all wording used in the application.
 * 
 * All values can be translated.
 */
export const word = {
  sACN: 'sACN',
  ArtNet: 'Art-Net',
  locked: '🛇', // Think to update other parameter below using the same icon
  automatic: 'Automatic',
  timing: 'Timing',
  link: 'Next cue',
  page: {
    notFound: 'Page not found',
    notFound_desc: 'The page <em class="text-primary">%1</em> can not be found.',
    home: 'General informations',
    home_InfoLink: 'Info',
    home_DMXInput: 'DMX inputs',
    home_DMXMerge: 'DMX merge',
    home_DMXPorts: 'DMX ports',
    home_DMXPorts_ClonedPort: 'Cloning P%1', // Context: Used to be displayed on General Informations table, in the DMX Port table to provide port protocol (%1 = port ID)
    netronPresets: 'Netron presets',
    netronPresets_Load: 'Load',
    netronPresets_LoadExplanation: 'A reboot will be performed after loading the Netron preset (note: the IP can change)',
    netronPresets_LoadSubmit: 'Load Netron preset',
    netronPresets_LoadSuccess: 'Netron preset loaded successfully!',
    userPresets: 'User presets',
    userPresets_Load: 'Load',
    userPresets_LoadExplanation: 'A reboot will be performed after loading the user preset',
    userPresets_LoadSubmit: 'Load user preset',
    userPresets_LoadSuccess: 'Netron preset loaded successfully!',
    userPresets_Rename: 'Rename user presets',
    userPresets_RenameExplanation: 'User preset rename does not require a reboot',
    userPresets_RenameSubmit: 'Rename user preset',
    userPresets_RenameSuccess: 'User preset renamed successfully!',
    dmxPorts: 'DMX Ports configuration',
    dmxPorts_Tab: 'Port %1', // %1 = port ID
    dmxPorts_Setting: 'Settings',
    dmxPorts_InOut: 'In/Out',
    dmxPorts_Merge: 'Merge',
    dmxPorts_DMX: 'DMX',
    dmxPorts_Error_Offset: 'The From/To DMX is incorrect (From DMX > To DMX or To DMX < From DMX)',
    dmxPorts_Error_OffsetFrom: 'The Offset DMX is exceeding the From DMX limit of 512',
    dmxPorts_Error_OffsetTo: 'The Offset DMX is exceeding the To DMX limit of 512',
    dmxPorts_ClonePort_None: 'None',
    dmxPorts_ClonePort_Free: 'Port %1', // %1 = port ID
    dmxPorts_ClonePort_Free_desc: 'The port %1 can be cloned', // %1 = port ID
    dmxPorts_ClonePort_PortNotOutputting: '🛇 Port %1 mode is: %2', // %1 = port ID, %2 = mode
    dmxPorts_ClonePort_PortNotOutputting_desc: 'The port %1 mode is set to %1, it can not be cloned', // %1 = port ID, %2 = mode
    dmxPorts_ClonePort_PortIsCloningDistant: '🛇 Port %1 clones: Port %2', // %1 = port ID distant, %2 = port ID distant
    dmxPorts_ClonePort_PortIsCloningDistant_desc: 'The port %1 is cloning the Port %2 (dependancy loop)', // %1 = port ID distant, %2 = port ID distant
    dmxPorts_ClonePort_PortIsCloningLocal: '🛇 Port %1 clones: Port %2', // %1 = port ID distant, %2 = port ID local
    dmxPorts_ClonePort_PortIsCloningLocal_desc: 'The port %1 is cloning the current Port %2 (dependancy loop)', // %1 = port ID distant, %2 = port ID local
    dmxPorts_SubmitSuccess: 'Port %1 updated successfully!', // %1 = port ID
    dmxPorts_Submit_Error_Clone: 'Port %1 is cloned by Port%2: %3', // %1 = port ID, %2 = plurial if several port are using this port, %3 is the list of port cloning current port
    ipSettings: 'IP address',
    ipSettings_Settings: 'Settings',
    ipSettings_SettingsExplanation: 'After IP change, you will be redirected to the new address.',
    ipSettings_SettingsSubmit: 'Save',
    ipSettings_SettingsSuccess: 'IP settings have been successfully updated!',
    ipSettings_Check_Ipaddress: 'The IP address %1 is incorrect', // %1 = user ip address
    ipSettings_Check_Netmask: 'The Net mask %1 is incorrect', // %1 = user net mask
    cuesRun: 'Run cue',
    cuesRun_Run: 'Run',
    cuesRun_Explanation: 'Select a cue to be runned, or select "Disabled" to stop cue runs\nThe Resend Ethernet option change is live',
    cuesRun_Select: 'Select cue',
    cuesRun_CurrentCue: 'Current cue',
    cuesRun_ResendEthernet: 'Resend Ethernet',
    cuesRun_Submit: 'Run',
    cuesRun_Success: 'Run cues set successfully!',
    cuesSave: 'Save cue',
    cuesSave_Save: 'Save',
    cuesSave_Explanation: 'Save all values on all ports to a cue slot',
    cuesSave_Submit: 'Save',
    cuesSave_Success: 'Cue successfully saved!',
    cuesOptions: 'Cue options',
    cuesOptions_Options: 'Options',
    cuesOptions_Explanation: 'Select a cue to access its prorperties',
    cuesOptions_Select: 'Select cue',
    cuesOptions_Timing: 'Time format is HH:MM:SS',
    cuesOptions_Submit: 'Load',
    cuesOptions_Success: 'Cue options modified successfully!',
    status: 'Status',
    status_Device: 'Device',
    status_IPAddress: 'IP address',
    status_SoftVersion: 'Software versions',
    status_OnTime: `%1h <em class="text-muted">(%2 week%3, or %4 day%5)</em>` // %1 = Original time value, %2 = time converted to week, %3 = plurial for week, %4 = time converted to day, %5 = plurial for day
  }
}

/**
 * Provides attribute names, icons, and descriptions used in forms.
 * 
 * Only the 'label' and 'desc' parameters can be translated.
 */
export const attr = {
  DeviceType: {
    label: 'Device type', icon: 'fa-server', attr: 'DeviceType',
    desc: 'It provides the device internal name'
  },
  DeviceName: {
    label: 'Device name', icon: 'fa-id-card', attr: 'DeviceName',
    desc: 'It allows to change the device name'
  },
  addressmode: {
    label: 'Address mode', icon: 'fa-network-wired', attr: 'addressmode',
    desc: 'It is the address mode'
  },
  ipaddress: {
    label: 'IP address', icon: 'fa-ethernet', attr: 'ipaddress',
    desc: 'It is the IP address'
  },
  netmask: {
    label: 'Net mask', icon: 'fa-arrows-to-dot', attr: 'netmask',
    desc: 'It is the Net Mask'
  },
  MACAddress: {
    label: 'MAC address', icon: 'fa-at', attr: 'MACAddress',
    desc: 'It is the MAC address'
  },
  RDMUID: {
    label: 'RDM UID', icon: 'fa-barcode', attr: 'RDMUID',
    desc: 'It is the RDM identifier'
  },
  OnTime: {
    label: 'On time', icon: 'fa-clock', attr: 'OnTime',
    desc: 'It is the power on time count'
  },
  ptPort: {
    label: 'Port#', icon: 'fa-arrow-right-from-bracket', attr: 'ptPort',
    desc: 'It provides the device port number'
  },
  ptClonePort: {
    label: 'Clone port', icon: 'fa-clone', attr: 'ptClonePort',
    desc: 'It allows to clone another existing port'
  },
  InputSource: {
    label: 'Mode', icon: 'fa-arrow-right-arrow-left', attr: 'InputSource',
    desc: 'TODO'
  },
  InputProtocol: {
    label: 'Protocol', icon: 'fa-route', attr: 'InputProtocol',
    desc: 'It is the EtherDMX protocol used for input port'
  },
  InputUniverse: {
    label: 'Universe', icon: 'fa-infinity', attr: 'InputUniverse',
    desc: 'It is the DMX Universe used for input port'
  },
  InputFrameRate: {
    label: 'Frame rate', icon: 'fa-wave-square', attr: 'InputFrameRate',
    desc: 'It is the DMX framerate used for input port'
  },
  InputRDM: {
    label: 'RDM', icon: 'fa-list-check', attr: 'InputRDM',
    desc: 'It is the RDM state for input port'
  },
  MergerMode: {
    label: 'Mode', icon: 'fa-arrow-right-arrow-left', attr: 'MergerMode',
    desc: 'TODO'
  },
  MergerFrameRate: {
    label: 'Frame rate', icon: 'fa-wave-square', attr: 'MergerFrameRate',
    desc: 'It is the DMX framerate used for merging'
  },
  ptMode: {
    label: 'Mode', icon: 'fa-arrow-right-arrow-left', attr: 'ptMode',
    desc: 'It allows to change the port behavior'
  },
  ptProtocol: {
    label: 'Protocol', icon: 'fa-route', attr: 'ptProtocol',
    desc: 'It allows to set the EtherDMX protocol of the port'
  },
  ptUniverse: {
    label: 'Universe', icon: 'fa-infinity', attr: 'ptUniverse',
    desc: 'It allows to set the EtherDMX Universe of the port'
  },
  startUniverse: {
    label: 'Start Universe', icon: 'fa-infinity', attr: 'startUniverse',
    desc: 'It allows to offset incoming start DMX Universe'
  },
  ptRangeFrom: {
    label: 'From DMX', icon: 'fa-location-dot', attr: 'ptRangeFrom',
    desc: 'It allows to limit the DMX range by setting the first address of the DMX port'
  },
  ptRangeTo: {
    label: 'To DMX', icon: 'fa-location-dot', attr: 'ptRangeTo',
    desc: 'It allows to limit the DMX range by setting the last address of the DMX port'
  },
  ptOffsetAddr: {
    label: 'Offset DMX', icon: 'fa-plus', attr: 'ptOffsetAddr',
    desc: 'It allows to offset incoming start DMX address'
  },
  ptSendValue: {
    label: 'Send value', icon: 'fa-paper-plane', attr: 'ptSendValue',
    desc: 'It allows to send a static DMX value'
  },
  ptFramerate: {
    label: 'Frame rate', icon: 'fa-wave-square', attr: 'ptFramerate',
    desc: 'It allows to set the DMX framerate of the port'
  },
  ptRDM: {
    label: 'RDM', icon: 'fa-list-check', attr: 'ptRDM',
    desc: 'It allows to enable or disable the RDM traffic of the port'
  },
  ptMergeMode: {
    label: 'Merge', icon: 'fa-code-merge', attr: 'ptMergeMode',
    desc: 'It allows to enable or disable merging feature of the port'
  },
  ptMergeUniverse: {
    label: 'Merge Universe', icon: 'fa-infinity', attr: 'ptMergeUniverse',
    desc: 'It allows to set the EtherDMX Universe of the port to be merged'
  },
  ptResendProtocol: {
    label: 'Resend protocol', icon: 'fa-route', attr: 'ptResendProtocol',
    desc: 'It allows to set the EtherDMX protocol of the port to be sent when merging'
  },
  ptResendUniverse: {
    label: 'Resend Universe', icon: 'fa-infinity', attr: 'ptResendUniverse',
    desc: 'It allows to set the EtherDMX Universe of the port to be send when merging'
  },
  runCue: {
    label: 'Run cue', icon: 'fa-clipboard-list', attr: 'RunCue',
    desc: 'It allows to run a cue'
  },
  saveCue: {
    label: 'Save as', icon: 'fa-floppy-disk', attr: 'NumCue',
    desc: 'It allows to save all values on all ports to a cue slot'
  },
  optionCue: {
    label: 'Edit', icon: 'fa-pen-to-square', attr: 'idx',
    desc: 'It allows modify a cue properties'
  },
  linkedCue: {
    label: 'Link to', icon: 'fa-link', attr: 'linkCue',
    desc: 'It allows to link a cue to another one'
  },
  nameCue: {
    label: 'Name', icon: 'fa-font', attr: 'name',
    desc: 'It is the name of the cue'
  },
  fadeTimeCue: {
    label: 'Fade time', icon: 'fa-arrow-up-wide-short', attr: 'fadeTime',
    desc: 'Set the fade time of the cue'
  },
  holdTimeCue: {
    label: 'Hold time', icon: 'fa-clock', attr: 'holdTime',
    desc: 'Set the time to hold the cue until the next (linked) cue is started'
  },
  cuesResendEth: {
    label: 'Resend Ethernet', icon: 'fa-repeat', attr: 'CuesResendEth',
    desc: 'Cue data is sent on the Universe number and protocol assigned to the port'
  },
  currentCue: {
    label: 'Current cue', icon: 'fa-play', attr: 'CurrentCueName',
    desc: 'It is the current running cue'
  },
  FirmwareVer: {
    label: 'Firmware', icon: 'fa-microchip', attr: 'FirmwareVer',
    desc: 'It is the firmware version'
  },
  BootVer: {
    label: 'Boot', icon: 'fa-circle-play', attr: 'BootVer',
    desc: 'It is the boot software version'
  },
  WebVer: {
    label: 'WEB', icon: 'fa-globe', attr: 'WebVer',
    desc: 'It is the web software version'
  }
}

/**
 * This table translate technical value into readable value. It also have associated description display at hover with the mouse
 * 
 * All values can be translated.
 */
export const translate = {
  inputSource: [
    { name: 'DMX', desc: 'TODO' },
    { name: 'Network', desc: 'TODO' },
    { name: 'Send value', desc: 'TODO' }
  ],
  addressmode: [
    { name: 'DHCP IP', desc: 'The device waits for a DHCP server address.\n\nAfter 30s, it assigns itself a unique 169.254.x.x address but continues to monitor DHCP server requests.' },
    { name: 'Automatic 2.X', desc: 'The device is set to a unique 2.x.x.x address, subnet 255.0.0.0' },
    { name: 'Automatic 10.X', desc: 'The device is set to a unique 10.x.x.x address, subnet 255.0.0.0' },
    { name: 'Custom IP', desc: 'Assign any desired numbers.\n\nThe device does not check the validity of address and subnet values' },
    { name: 'Automatic 192.X', desc: 'The device is set to a unique 192.x.x.x address, subnet 255.0.0.0' },
    { name: 'Automatic 172.X', desc: 'The device is set to a unique 172.x.x.x address, subnet 255.0.0.0' }
  ],
  ptSource: [
    { name: 'A', desc: 'Input A' },
    { name: 'B', desc: 'Input B' },
    { name: 'Merge', desc: 'TODO' },
    { name: 'Disabled', desc: 'TODO' }
  ],
  ptRDM: [
    { name: 'Disable', desc: 'RDM traffic is disable' },
    { name: 'Enable', desc: 'RDM traffic is enable' }
  ],
  ptMergeMode: [
    { name: 'OFF', desc: 'The merger is disabled' },
    { name: 'HTP', desc: 'The sources are merged by Highest Takes Precedence' },
    { name: 'LTP', desc: 'The sources are merged by Last Takes Precedence' },
    { name: 'Toggle', desc: 'The complete source Universe is switched as soon as a single value changes' },
    { name: 'Backup', desc: 'The merge Universe is activated if the main Universe has no valid traffic' }
  ],
  ptMode: [
    { name: 'Disable', desc: 'The port is disabled' },
    { name: 'Input', desc: 'The port receives DMX values and assigns them to the selected Universe' },
    { name: 'Output', desc: 'The port sends out DMX values on the selected Universe' },
    { name: 'Send value', desc: 'Send a static DMX value' }
  ],
  ptProtocol: [
    { name: word.ArtNet, desc: 'EtherDMX uses Art-Net protocol' },
    { name: word.sACN, desc: 'EtherDMX uses sACN protocol' },
    { name: 'None', desc: 'EtherDMX does not use any protocol' }
  ],
  ptFramerate: [
    { name: '10Hz', desc: 'TODO' },
    { name: '15Hz', desc: 'TODO' },
    { name: '20Hz', desc: 'TODO' },
    { name: '25Hz', desc: 'TODO' },
    { name: '30Hz', desc: 'TODO' },
    { name: '35Hz', desc: 'TODO' },
    { name: '40Hz', desc: 'TODO' }
  ]
}

export const timing = {
  runCues: 1000
}

/**
 * This is display value for empty parameter
 * 
 * All values can be modified.
 */
export const emptyAttr = '---'

/**
 * This table provide api file name
 * 
 * (DO NOT TRANSLATE)
 * (DO NOT MODIFIED)
 */
export const apis = {
  // Get
  setting: 'Setting.json',
  IP: 'IP.json',
  index: 'index.json',
  dmxPorts: 'DMXPorts.json',
  identify: 'Identify.json',
  presets: 'Presets.json',
  userPresets: 'UserPresets.json',
  cues: 'Cues.json',
  cuesSetting: 'CuesSetting.json',
  cuesStatus: 'CuesStatus.json',
  remoteInputs: 'RemoteInputs.json',
  dmxInputTab: 'DMXInputab.json',
  dmxInputMerger: 'DMXInputmerger.json',
  // Post
  setIdentify: 'set_identify',
  savePresetNetron: 'save_preset_netron',
  loadPresetNetron: 'load_preset_netron',
  saveDMXPort: 'save_dmx_port',
  saveInfo: 'save_info',
  runCues: 'run_cues',
  saveCues: 'save_cues',
  editCues: 'edit_cues'
}

/**
 * This table provide Events Name 
 * 
 * (DO NOT TRANSLATE)
 * (DO NOT MODIFIED)
 */
export const EventName = {
  deviceReady: 'deviceReady',
  pageChange: 'pageChange',
  identifyIsOn: 'identifyIsOn'
}