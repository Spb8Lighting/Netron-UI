export default class DarkTheme {

  #input = document.createElement('input')
  #localStorage = undefined

  /**
   * Add a theme switcher for BootStrap
   * @param {documentElement} home 
   */
  constructor({ home = document.body }) {
    if (!home) { throw new Error('The "home" element is required!') }

    // Check is localStorage is enable
    this.#localStorage = this.checkLocalStorageAvailability()

    // Check if 'home' can be used to add our theme switcher
    if (home instanceof Element) {
      try {
        // Generate HTML switch and add it to 'home' element
        home.append(...this.generateThemeSwitcherDOM())

        // Add change events to the HTML switch and OS change
        this.addEvents()

        // Apply OS theme or the one stored in localStorage
        this.toggleTheme(this.getPreferredTheme())
      } catch (e) {
        console.error('For unknown reason, the DOM modification was rejected', e)
      }
    } else { throw new Error('The "home" element is not a DOM Element!') }
  }

  /**
   * Generate the DOM for the theme switcher
   * @return {[Element|Element|Element]}
   */
  generateThemeSwitcherDOM() {
    const divInput = document.createElement('div')
    divInput.className = 'ms-2 form-switch fs-5'

    this.#input.className = 'form-check-input'
    this.#input.type = 'checkbox'
    this.#input.role = 'switch'
    this.#input.id = 'themeSwitcher'
    this.#input.ariaLabel = 'Change color theme'

    divInput.append(this.#input)
    
    const sun = document.createElement('i')
    sun.className = 'fa fa-fw fa-sun'
    sun.ariaHidden = true

    const moon = document.createElement('i')
    moon.className = 'fa fa-fw fa-moon'
    moon.ariaHidden = true

    return [sun, divInput, moon]
  }

  /**
   * Detect if localStorage is available
   * @returns {Boolean} true if localStorage is available, else false
   */
  checkLocalStorageAvailability() {
    try {
      const key = '_storage_test'
      window.localStorage.setItem(key, null)
      window.localStorage.removeItem(key)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Return the stored theme from localStorage (if available)
   * @returns {String} dark or light
   */
  getStoredTheme() {
    if (this.#localStorage) {
      return localStorage.getItem('theme')
    }
    return undefined
  }

  /**
   * Store the theme string value in localStorage (if available)
   * @param {String} theme dark or light
   */
  setStoredTheme(theme) {
    if (this.#localStorage) {
      localStorage.setItem('theme', theme)
    }
  }

  /**
   * Return if the value is an valid value for Theme (light or dark)
   * @param {string} value 
   * @returns 
   */
  hasValidTheme(value) { return ['light', 'dark'].includes(value) }

  /**
   * Return the current theme string value from OS if not already stored in localStorage 
   * @returns {String} dark or light
   */
  getPreferredTheme() {
    const storedTheme = this.getStoredTheme()
    if (storedTheme && this.hasValidTheme(storedTheme)) { // If a localStorage value exists, return it
      return storedTheme
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  /**
   * Store current selected theme and applied it to the HTML node
   * @param {boolean} toDark 
   */
  toggleTheme(toDark) {
    // If `toDark` isn't a boolean, then determine from the theme name if it true (dark) or false (light)
    const theme = (typeof toDark === 'boolean')
      ? (toDark ? 'dark' : 'light')
      : (toDark && toDark !== 'light') ? 'dark' : 'light'

    this.setStoredTheme(theme) // Store the current theme value in the localStorage to keep user choice in memore for next visit

    document.documentElement.dataset.bsTheme = theme // Apply the theme on the HTML node (bootstrap)
    this.#input.checked = (theme === 'dark') // Set the input to false = Light theme or true = Dark theme to provide an additional user feedback
  }

  /**
   * Set the different event listener to make the theme switch working as expected (directly from Input or OS)
   */
  addEvents() {
    // HTML switch change
    this.#input.addEventListener('change', this.inputChangeHandler.bind(this))

    // System theme change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', this.windowChangeHandler.bind(this))
  }
  /**
   * Input change handler to change theme based on input checked state
   * @param {event} e 
   */
  inputChangeHandler(e) { this.toggleTheme(e.target.checked) }

  /**
   * OS theme change handler, to change theme when the OS theme is changing
   * @param {Object} matches matchMedia return
   */
  windowChangeHandler({ matches }) { this.toggleTheme(matches) }
}