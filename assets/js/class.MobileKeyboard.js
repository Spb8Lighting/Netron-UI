import Keyboard from 'simple-keyboard'

/**
 * Class representing a mobile virtual keyboard
 */
export default class MobileKeyboard {
  /**
   * @private
   * @type {HTMLElement | undefined}
   */
  #currentInput = undefined

  /**
   * Reference to the DOM node where the keyboard is displayed
   * @type {HTMLElement}
   */
  keyboardNode = document.getElementById('keyboard')

  /**
   * Creates an instance of MobileKeyboard and initializes the virtual keyboard
   */
  constructor() {
    this.keyboard = new Keyboard({
      onChange: input => this.#onChange(input),
      onKeyPress: button => this.#onKeyPress(button),
      mergeDisplay: true,
      preventMouseDownDefault: true,
      disableCaretPositioning: false,
      stopMouseDownPropagation: true,
      layoutName: 'default',
      layout: {
        default: [
          '1 2 3 4 5 6 7 8 9 0',
          'q w e r t y u i o p',
          'a s d f g h j k l',
          '{shift} z x c v b n m {backspace}',
          '{numbers} {space} {ent}'
        ],
        shift: [
          '1 2 3 4 5 6 7 8 9 0',
          'Q W E R T Y U I O P',
          'A S D F G H J K L',
          '{shift} Z X C V B N M {backspace}',
          '{numbers} {space} {ent}'
        ],
        numbers: ['1 2 3', '4 5 6', '7 8 9', '{abc} 0 {backspace}']
      },
      display: {
        '{numbers}': '123',
        '{ent}': '⏎',
        '{escape}': 'esc ⎋',
        '{tab}': 'tab ⇥',
        '{backspace}': '⌫',
        '{capslock}': 'caps lock ⇪',
        '{shift}': '⇧',
        '{controlleft}': 'ctrl ⌃',
        '{controlright}': 'ctrl ⌃',
        '{altleft}': 'alt ⌥',
        '{altright}': 'alt ⌥',
        '{metaleft}': 'cmd ⌘',
        '{metaright}': 'cmd ⌘',
        '{abc}': 'ABC'
      }
    })
    this.#addEvents()
  }

  /**
   * Adds event listeners to handle user interactions
   */
  #addEvents() {
    document.addEventListener('click', e => {
      const target = e.target
      if (
        !this.keyboardNode.classList.contains('d-none')
        && !target.matches('.fa-keyboard, .keyboard, .hg-button, .hg-row, .hg-rows, .simple-keyboard')
        && !target.isSameNode(this.#currentInput)
      ) {
        this.hide()
      }
    })
  }

  /**
   * Toggles the visibility of the virtual keyboard
   * Shows the keyboard if it is hidden, otherwise hides it
   */
  toggle() {
    const isVisible = !this.keyboardNode.classList.contains('d-none')
    this.keyboardNode.classList.toggle('d-none', isVisible)
    if (!isVisible) {
      this.#focus()
    }
  }

  /**
   * Sets focus on the current input field
   */
  #focus() {
    this.#currentInput?.focus()
  }

  /**
   * Shows the virtual keyboard and focuses on the current input field
   */
  show() {
    this.keyboardNode.classList.remove('d-none')
    this.#focus()
  }

  /**
   * Hides the virtual keyboard
   */
  hide() {
    this.keyboardNode.classList.add('d-none')
  }

  /**
   * Updates the value of the current input field with the current keyboard input
   * @param {string} input - The string representing the keyboard input
   */
  #onChange(input) {
    if (this.#currentInput) {
      this.#currentInput.value = input
    }
  }

  /**
   * Handles actions when a key is pressed on the virtual keyboard
   * @param {string} button - The key that was pressed
   */
  #onKeyPress(button) {
    if (button === '{shift}' || button === '{lock}') {
      this.#handleShift()
    }
    if (button === '{numbers}' || button === '{abc}') {
      this.#handleNumbers()
    }
  }

  /**
   * Changes the keyboard layout between 'default' and 'shift'
   */
  #handleShift() {
    this.keyboard.setOptions({
      layoutName: this.keyboard.options.layoutName === 'default' ? 'shift' : 'default'
    })
  }

  /**
   * Changes the keyboard layout between 'numbers' and 'default'
   */
  #handleNumbers() {
    this.keyboard.setOptions({
      layoutName: this.keyboard.options.layoutName !== 'numbers' ? 'numbers' : 'default'
    })
  }

  /**
   * Sets the current input field and adjusts the keyboard layout based on the input type
   * @param {HTMLInputElement | HTMLTextAreaElement} input - The input field to associate with the virtual keyboard
   */
  setInput(input) {
    this.#currentInput = input
    this.keyboard.replaceInput({ default: this.#currentInput.value, input2: this.#currentInput.id })

    this.keyboard.setOptions({
      layoutName: this.#currentInput.type === 'number' ? 'numbers' : 'default'
    })

    this.show()
  }
  /**
   * Update current keyboard value
   * @param {String} value 
   */
  updateValue(value) {
    this.keyboard.setInput(value)
  }
}