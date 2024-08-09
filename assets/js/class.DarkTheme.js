export default class DarkTheme {

  #input = document.createElement('input')

  /**
   * Add a theme switcher for BootStrap
   * @param {documentElement} home 
   */
  constructor({ home }) {
    // Generate HTML switch
    const sun = document.createElement('i')
    sun.className = 'fa fa-fw fa-sun'

    const moon = document.createElement('i')
    moon.className = 'fa fa-fw fa-moon'

    const divInput = document.createElement('div')
    divInput.className = 'ms-2 form-switch fs-5'

    this.#input.className = 'form-check-input'
    this.#input.type = 'checkbox'
    this.#input.role = 'switch'
    this.#input.id = 'themeSwitcher'

    divInput.append(this.#input)

    home.append(sun, divInput, moon)

    // Add change events to the HTML switch
    this.addEvents()

    this.toggleTheme(this.getPreferredTheme())
  }

  /**
   * Return the stored theme
   * @returns {String} dark or light
   */
  getStoredTheme() { return localStorage.getItem('theme') }

  /**
   * Store the theme string value
   * @param {String} theme dark or light
   */
  setStoredTheme(theme) { localStorage.setItem('theme', theme) }

  /**
   * Return the current theme string value
   * @returns {String} dark or light
   */
  getPreferredTheme() {
    // Return stored theme if any, else return system theme
    const storedTheme = this.getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  /**
   * Store current selected them and applied it to HTML node
   * @param {boolean} toDark 
   */
  toggleTheme(toDark) {
    if (toDark && toDark !== 'light') {
      this.setStoredTheme('dark')
      document.documentElement.dataset.bsTheme = 'dark'
      this.#input.checked = true
      return
    }
    this.setStoredTheme('light')
    document.documentElement.dataset.bsTheme = 'light'
    this.#input.checked = false
  }

  /**
   * Set the different event listener to make the theme switch working as expected
   */
  addEvents() {
    // HTML switch change
    this.#input.addEventListener('change', e => {
      this.toggleTheme(e.target.checked)
    })

    // System them change
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ({ matches }) => {
      this.toggleTheme(matches)
    })
  }
}