import DarkTheme from 'DarkTheme'
import FetchJSON from 'FetchJSON'
import Device from 'Device'
import Menu from 'Menu'
import Page from 'Page'
import { devMode, EventName, config, attr } from 'config'


// Add DarkThem switcher and associated events
new DarkTheme({ home: document.getElementById('themeSwitcher') })

const _FETCH_ = new FetchJSON({ devMode: devMode })

// Initialize Device handler
const _DEVICE_ = new Device({
  EventName: EventName,
  _FETCH_: _FETCH_
})

// Add menu and toggle switch
const _MENU_ = new Menu({
  EventName: EventName,
  _DEVICE_: _DEVICE_,
  config: config,
  toggle: document.getElementById('menuToggle'),
  menu: document.getElementById('main-menu')
})

// Initialize page handler
const _PAGE_ = new Page({
  _ALERT_: document.getElementById('alert'),
  _FETCH_: _FETCH_,
  _DEVICE_: _DEVICE_,
  _MENU_: _MENU_
})

// Initialize DEVICE (call to apis)
await _DEVICE_.bulkUpdate({ arrayOfFile: false })
document.dispatchEvent(new Event(EventName.deviceReady))

// Display default homepage or display the called page
const checkPageCall = () => {
  const searchPage = document.location.search.substring(1)
  if(devMode) {
    console.group('Device is up')
    console.dir(_DEVICE_)
    console.groupEnd() 
  }
  if (searchPage) {
    if(devMode) {
      console.group('Searched page')
      console.dir(searchPage)
      console.groupEnd() 
    }
    return _MENU_.navigate(searchPage)
  }
  return _MENU_.navigate('home')
}

document.addEventListener(EventName.deviceReady, checkPageCall())