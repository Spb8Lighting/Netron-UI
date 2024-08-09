import Keyboard from 'simple-keyboard'

export default class MobileKeyboard {
  #currentInput = undefined

  keyboardNode = document.getElementById('keyboard')

  constructor() {
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button),
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
    this.addEvents()
  }

  addEvents() {
    // Close keyboard
    document.addEventListener('click', e => {
      if (
        !this.keyboardNode.classList.contains('d-none')
        && !e.target.className.includes('fa-keyboard')
        && !e.target.className.includes('keyboard')
        && !e.target.isSameNode(this.#currentInput)
        && !e.target.className.includes('hg-button')
        && !e.target.className.includes('hg-row')
        && !e.target.className.includes('simple-keyboard')
      ) {
        this.hide()
      }
    })
  }

  toggle() {
    this.keyboardNode.classList.toggle('d-none')
    if (!this.keyboardNode.classList.contains('d-none')) {
      this.focus()
    }
  }

  focus() {
    this.#currentInput.focus()
  }

  show() {
    if (this.keyboardNode.classList.contains('d-none')) {
      this.keyboardNode.classList.remove('d-none')
    }
    this.focus()
  }

  hide() {
    if (!this.keyboardNode.classList.contains('d-none')) {
      this.keyboardNode.classList.add('d-none')
    }
  }

  onChange(input) {
    this.#currentInput.value = input
  }

  onKeyPress(button) {
    if (button === '{shift}' || button === '{lock}') { this.handleShift() }
    if (button === '{numbers}' || button === '{abc}') { this.handleNumbers() }
  }

  handleShift() {
    this.keyboard.setOptions({
      layoutName: this.keyboard.options.layoutName === 'default' ? 'shift' : 'default'
    })
  }

  handleNumbers() {
    this.keyboard.setOptions({
      layoutName: this.keyboard.options.layoutName !== 'numbers' ? 'numbers' : 'default'
    })
  }

  setInput(input) {
    this.#currentInput = input
    this.keyboard.replaceInput({ default: this.#currentInput.value, input2: this.#currentInput.id })

    if (this.#currentInput.type === 'number') {
      this.keyboard.setOptions({
        layoutName: 'numbers'
      })
    } else {
      this.keyboard.setOptions({
        layoutName: 'default'
      })
    }

    this.show()
  }
}

