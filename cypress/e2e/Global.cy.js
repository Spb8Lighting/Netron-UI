beforeEach(() => {
  cy.viewport(960, 700)
  cy.visit('http://127.0.0.1:5500/')
  cy.get('#pageTitle').as('pageTitle')
  cy.get('@pageTitle').should('have.text', 'General informations')
  cy.get('#pageContent').as('pageContent')
  cy.get('#menuToggle > .btn').as('menuToggle')
})

context('Main menu', () => {
  describe('Behaviors', () => {
    beforeEach(() => {
      cy.get('#main-menu>ul>li:first-child>a').as('linkFirst')
      cy.get('#main-menu>ul>li>a[href^="#"]').first().as('linkSubMenu')
      cy.get('#main-menu>ul>li>ul>li>a').first().as('linkSubMenuSub')
      cy.get('#main-menu>ul>li>a[href^="#"]').last().as('linkSubMenu2')

      cy.get('#main-menu>ul>li:nth-child(3)>a').as('pageDMXPorts')
    })

    it('set the first link to active on page load', () => {
      cy.get('@linkFirst').should('have.class', 'active')
    })

    it('expand the first sub-menu', () => {
      cy.get('@linkSubMenu').should('not.have.class', 'active')
      cy.get('@linkSubMenu').click()

      cy.get('@linkSubMenu').should('have.class', 'active')
      cy.get('@linkSubMenuSub').should('be.visible')
    })

    it('auto-collapse other sub-menu', () => {
      cy.get('@linkSubMenu').should('not.have.class', 'active')
      cy.get('@linkSubMenu').click()
      cy.wait(360)

      cy.get('@linkSubMenu').should('have.class', 'active')
      cy.get('@linkSubMenuSub').should('be.visible')

      cy.get('@linkSubMenu').click()

      cy.get('@linkSubMenuSub').should('not.be.visible')

      cy.get('@linkSubMenu').click()

      cy.get('@linkSubMenu2').click()

      cy.get('@linkSubMenu').should('not.have.class', 'active')
      cy.get('@linkSubMenu2').should('have.class', 'active')
    })

    it('load another page', () => {
      cy.get('@pageDMXPorts').click()
      cy.get('@pageTitle').should('have.text', 'DMX Ports configuration')
    })

    it('compact the menu', () => {
      cy.get('html').should('not.have.class', 'compact')
      cy.get('@menuToggle').click()
      cy.get('html').should('have.class', 'compact')
      cy.get('@menuToggle').click()
      cy.get('html').should('not.have.class', 'compact')
    })

    it('hide sub-menu when it compact the menu', () => {
      cy.get('html').should('not.have.class', 'compact')
      cy.get('@linkSubMenu').should('not.have.class', 'active')
      cy.get('@linkSubMenu').click()
      cy.wait(360)

      cy.get('@linkSubMenu').should('have.class', 'active')
      cy.get('@linkSubMenuSub').should('be.visible')

      cy.get('@menuToggle').click()
      cy.get('html').should('have.class', 'compact')
      cy.get('@linkSubMenuSub').should('not.be.visible')

      cy.get('@menuToggle').click()
      cy.get('html').should('not.have.class', 'compact')
    })
  })
  describe('Navigation', () => {
    it('load every pages', () => {
      cy.get('#main-menu a').each(($elem) => {
        cy.wrap($elem).click()
      })
    })
  })
})

context('Interface features', () => {

  describe('Identify', () => {
    beforeEach(() => {
      cy.get('#identifySwitch').as('switch')
      cy.get('#main-menu>ul>li:last-child').as('identify')

      cy.get('@switch').then(($el) => {
        if($el.is(':checked')) {
          cy.get('@switch').uncheck()
        }
      })
    })

    it('activate/deactivate identify', () => {
      const color = { default: 'rgb(42, 63, 84)', invert: 'rgb(255, 193, 7)' }
      cy.get('@identify').should('have.css', 'background-color', color.default)
      cy.get('@switch').click()
      cy.get('@identify').should('have.css', 'background-color', color.invert)
      cy.get('@switch').click()
      cy.get('@identify').should('have.css', 'background-color', color.default)
    })

    it('sends the correct value at on/off', () => {
      cy.intercept('POST', '**?set_identify').as('set_identify')

      cy.get('@switch').click()

      cy.checkRequest({
        alias: '@set_identify',
        attrList: {
          IdentifyStatus: '2',
          EndFlag: '1'
        }
      })

      cy.get('@switch').click()

      cy.checkRequest({
        alias: '@set_identify',
        attrList: {
          IdentifyStatus: '0',
          EndFlag: '1'
        }
      })
    })
  })

  describe('Dark mode', () => {
    beforeEach(() => {
      cy.get('#themeSwitcher').as('switch')
    })

    it('activate/deactivate the dark mode', () => {
      const defaultColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      const invertColor = defaultColor === 'dark' ? 'light' : 'dark'

      const backgroundColor = {
        light: 'rgb(255, 255, 255)',
        dark: 'rgb(33, 37, 41)'
      }
      cy.get('html').should('have.attr', 'data-bs-theme', defaultColor)
      cy.get('body').should('have.css', 'background-color', backgroundColor[defaultColor])

      cy.get('@switch').click()

      cy.get('html').should('have.attr', 'data-bs-theme', invertColor)
      cy.get('body').should('have.css', 'background-color', backgroundColor[invertColor])
    })
  })
})

context('Check pages', () => {
  describe('Home', () => {
    it('access the page and check its default content', () => {
      cy.get('@pageTitle').should('have.text', 'General informations')
      cy.get('@pageContent').within(() => {
        cy.get('div').eq(0).within(() => { // First Row Info
          cy.get('a').as('infosLink')
            .should('have.text', 'Info')

          const columnsName = ['Device type', 'Device name', 'IP address', 'Net mask']
          cy.get('tr')
            .should('have.length', 4)
            .each(($el, index) => {
              cy.wrap($el).find('td').eq(0)
                .should('have.text', columnsName[index])
                .find('i').should('have.length', 1)
              cy.wrap($el).find('td').eq(1)
                .should('not.be.empty')
            })
        })

        cy.get('div').eq(1).within(() => {
          cy.get('a').should('have.text', 'DMX ports')

          cy.get('table').its('length').should('be.gte', 2)
          cy.get('table').last().within(() => { // DMX Port resume table
            const columnsName = ['Port#', 'Mode', 'Protocol', 'Universe', 'Frame rate', 'RDM', 'Merge']
            cy.get('thead th')
              .should('have.length', 7)
              .each(($el, index) => {
                cy.wrap($el)
                  .should('have.text', columnsName[index])
                  .find('i').should('have.length', 1)
              })
          })
        })
      })
      cy.get('@infosLink').click()
      cy.get('@pageTitle').should('have.text', 'Status')

      cy.get('#main-menu>ul>li:first-child>a').click()
      cy.get('@pageTitle').should('have.text', 'General informations')

      cy.get('@pageContent').within(() => {
        cy.get('a').eq(1).click()
        cy.get('@pageTitle').should('have.text', 'DMX Ports configuration')
      })
    })
  })
  describe('Presets > Netron presets', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('[href="#presets"]').click()
      cy.get('#presets > :nth-child(1) > .nav-link').click()

      cy.get('@pageContent').within(() => {
        cy.get('form').as('form')
          .should('have.length', 1)
          .within(() => {
            cy.get('div.input-group').eq(0).find('select').as('preset')

            cy.get('div.input-group').eq(1).find('input').as('universe')
            cy.get('div.input-group').eq(1).find('button[type="button"]').as('keyboard')

            cy.get('button[type="submit"]').as('submit')
          })
      })

      cy.intercept('POST', '**?save_preset_netron').as('save_preset_netron')

      cy.get('@preset').select(0) // Artnet Preset
      cy.get('@universe').clear().type(1)

      cy.get('@submit').click()

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '0',
          PresetNum: '0',
          universe: '0',
          EndFlag: '1'
        }
      })

      cy.get('@preset').select(7)  // SACN Preset

      cy.checkMinMax({
        alias: '@universe',
        min: 1,
        max: 32767,
        value: 32
      })

      cy.get('@submit').click()

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '7',
          PresetNum: '7',
          universe: '32',
          EndFlag: '1'
        }
      })

      cy.get('@preset').select(13)  // Splitter Preset
      cy.get('@universe').should('not.be.visible')

      cy.get('@submit').click()

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '13',
          PresetNum: '13',
          EndFlag: '1'
        }
      })

      cy.get('@preset').select(7)  // SACN Preset
      cy.get('@submit').click()

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '7',
          PresetNum: '7',
          universe: '32',
          EndFlag: '1'
        }
      })
    })

    it('keyboard is displayed in number mode', () => {
      specify('display Keyboard through the keyboard button', () => {
        cy.get('[href="#presets"]').click()
        cy.get('#presets > :nth-child(1) > .nav-link').click()
        cy.get('button[type="button"]').as('keyboard')
        cy.get('@keyboard').click()
      })
      specify('Keyboard is displayed', () => {
        cy.get('@pageContent').within(() => {
          cy.get('#keyboard').should('have.length', 1)
        })
      })
    })
  })
  describe('Presets > User presets', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('[href="#presets"]').click()
      cy.get('#presets > :nth-child(2) > .nav-link').click()

      cy.get('@pageContent').within(() => {
        cy.get('form').as('form')
          .should('have.length', 2)

        cy.get('@form').eq(0)
          .within(() => {
            cy.get('div.input-group').find('select').as('LoadPreset')
            cy.get('button[type="submit"]').as('LoadSubmit')
          })

        cy.get('@form').eq(1)
          .within(() => {
            cy.get('div.input-group').eq(0).find('select').as('RenamePreset')
            cy.get('div.input-group').eq(1).find('input').as('RenamePresetName')
            cy.get('button[type="submit"]').as('RenameSubmit')
          })
      })

      cy.intercept('POST', '**?load_preset_netron').as('load_preset_netron')

      cy.get('@LoadPreset').select(1)
      cy.get('@LoadSubmit').click()

      cy.checkRequest({
        alias: '@load_preset_netron',
        attrList: {
          PresetNum: '101',
          EndFlag: '1'
        }
      })

      cy.get('@LoadPreset').select(0)
      cy.get('@LoadSubmit').click()

      cy.checkRequest({
        alias: '@load_preset_netron',
        attrList: {
          PresetNum: '100',
          EndFlag: '1'
        }
      })

      cy.intercept('POST', '**?save_preset_netron').as('save_preset_netron')

      cy.get('@RenamePreset').select(1)
      cy.get('@RenamePresetName').should('have.value', 'Preset 2')
      cy.get('@RenameSubmit').click()

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '102',
          name: 'Preset 2',
          EndFlag: '1'
        }
      })

      cy.wait(2001)

      cy.get('@RenamePreset').select(0)
      cy.get('@RenamePresetName')
        .should('have.value', 'Splitter')
        .clear().type('{enter}')
        .should('match', ':invalid')
        .type('Preset 1{enter}')
        .should('match', ':valid')

      cy.checkRequest({
        alias: '@save_preset_netron',
        attrList: {
          idx: '101',
          name: 'Preset 1',
          EndFlag: '1'
        }
      })

      cy.get('@LoadPreset').find(':selected').should('have.text', '1: Preset 1')
    })
  })
  describe('DMX ports', () => {
    it('access the page, check its default content and check API calls', () => {
      const inputList = ['ptClonePort', 'ptMode', 'ptRDM', 'ptProtocol', 'ptUniverse', 'ptMergeMode', 'ptMergeUniverse', 'ptResendProtocol', 'ptResendUniverse', 'ptSendValue', 'ptFramerate', 'ptRangeFrom', 'ptRangeTo', 'ptOffsetAddr']

      cy.get('@menuToggle').click()

      cy.intercept('POST', '**?save_dmx_port').as('save_dmx_port')

      cy.get('#main-menu>ul>li:nth-child(3) a').click()

      cy.get('@pageContent').within(() => {
        cy.get('ul')
          .should('have.length', 1)
          .within(() => {
            cy.get('li').as('links')
              .each(($el, index) => {
                cy.wrap($el)
                  .find('button').as(`port${index}`)
                  .should('have.text', `Port ${index + 1}${index + 1}`)
              })
          })
        cy.get('>div')
          .should('have.length', 1)
          .within(() => {
            cy.get('form')
              .each(($el, index) => {
                inputList.forEach(name => {
                  cy.wrap($el).as(`form${index}`)
                    .find(`[name="${name}"]`).as(`port${index}-${name}`)
                })

                cy.wrap($el).find('button[type="submit"]').as(`port${index}-Submit`)
              })
          })
      })

      cy.get('@links')
        .each(($el, index) => {
          if (index > 0) {
            cy.get(`@port${index}`).click()

            cy.get(`@port${index}-ptClonePort`).select(`${index}`)
            cy.get(`@port${index}-ptMode`).select(2) // Reset to default value
            cy.get(`@port${index}-ptMode`).select(0) // Disable
            cy.get(`@port${index}-Submit`).click()

            cy.get(`@form${index - 1}`).should('not.be.visible')
            cy.get(`@form${index}`).should('be.visible')

            cy.checkRequest({
              alias: '@save_dmx_port',
              attrList: {
                idx: `${index + 1}`,
                ptMode: '0',
                EndFlag: '1'
              }
            })
          }
        })

      cy.get(`@port0`).click()

      cy.get(`@port0-ptMode`).select(0) // Disable
      cy.get(`@port0-ptMode`).select(2) // Reset to default value
      cy.get(`@port0-ptMode`).select(0) // Disable
      const visibleDisable = new Set(['ptMode'])
      const hiddenDisable = inputList.filter(name => !visibleDisable.has(name))
      hiddenDisable.forEach(name => {
        cy.get(`@port0-${name}`).should('not.be.visible')
      })
      cy.get(`@port0-Submit`).click()

      cy.checkRequest({
        alias: '@save_dmx_port',
        attrList: {
          idx: '1',
          ptMode: '0',
          EndFlag: '1'
        }
      })
      // All DMX port are disabled
      const visibleInput = new Set(['ptMode', 'ptProtocol', 'ptUniverse', 'ptRangeFrom', 'ptRangeTo', 'ptOffsetAddr'])
      const hiddenInput = inputList.filter(name => !visibleInput.has(name))

      const visibleOutput = new Set(['ptClonePort', 'ptMode', 'ptRDM', 'ptProtocol', 'ptUniverse', 'ptMergeMode', 'ptFramerate', 'ptRangeFrom', 'ptRangeTo', 'ptOffsetAddr'])
      const hiddenOutput = inputList.filter(name => !visibleOutput.has(name))

      const visibleOutputMerge = new Set([...visibleOutput, 'ptMergeUniverse', 'ptResendProtocol', 'ptResendUniverse'])
      const hiddenOutputMerge = inputList.filter(name => !visibleOutputMerge.has(name))

      let numberOfPorts = 0
      cy.get('@links')
        .each(($el, index) => {
          numberOfPorts++
          cy.get(`@port${index}`).click()

          cy.get(`@port${index}-ptMode`).select(1) // Input

          hiddenInput.forEach(name => {
            cy.get(`@port${index}-${name}`).should('not.be.visible')
          })
          cy.get(`@port${index}-ptProtocol`).select(0)
            .find(':selected')
            .should('have.text', 'Art-Net')
            .should('have.value', '0')

          cy.get(`@port${index}-ptUniverse`).should('have.value', `${index + 1}`)
          cy.get(`@port${index}-ptRangeFrom`).should('have.value', '1')
          cy.get(`@port${index}-ptRangeTo`).should('have.value', '512')
          cy.get(`@port${index}-ptOffsetAddr`).should('have.value', '0')

          cy.get(`@port${index}-Submit`).click()

          cy.checkRequest({
            alias: '@save_dmx_port',
            attrList: {
              idx: `${index + 1}`,
              ptMode: '1',
              ptProtocol: '0',
              ptUniverse: `${index}`, // Artnet universe value -1
              ptRangeFrom: '1',
              ptRangeTo: '512',
              ptOffsetAddr: '0',
              EndFlag: '1'
            }
          })

          cy.get(`@port${index}-ptProtocol`).select(1)
            .find(':selected')
            .should('have.text', 'sACN')
            .should('have.value', '1')

          cy.checkMinMax({
            alias: `@port${index}-ptUniverse`,
            min: 1,
            max: 32767,
            value: index + 1
          })

          cy.checkMinMax({
            alias: `@port${index}-ptRangeFrom`,
            min: 1,
            max: 512,
            value: 1
          })

          cy.checkMinMax({
            alias: `@port${index}-ptRangeTo`,
            min: 1,
            max: 512,
            value: 512
          })

          cy.checkMinMax({
            alias: `@port${index}-ptOffsetAddr`,
            min: 0,
            max: 511,
            value: 0
          })

          cy.get(`@port${index}-Submit`).click()

          cy.checkRequest({
            alias: '@save_dmx_port',
            attrList: {
              idx: `${index + 1}`,
              ptMode: '1',
              ptProtocol: '1', // sACN mode
              ptUniverse: `${index + 1}`, // sACN universe value -0
              ptRangeFrom: '1',
              ptRangeTo: '512',
              ptOffsetAddr: '0',
              EndFlag: '1'
            }
          })

          cy.get(`@port${index}-ptMode`).select(2) // Output

          hiddenOutput.forEach(name => {
            cy.get(`@port${index}-${name}`).should('not.be.visible')
          })

          cy.get(`@port${index}-ptClonePort`).find(':selected')
            .should('have.text', 'None')
            .should('have.value', `${index}`)

          cy.get(`@port${index}-ptRDM`).should('be.checked')
          cy.get(`@port${index}-ptMergeMode`).find(':selected')
            .should('have.text', 'OFF')
            .should('have.value', '0')
          cy.get(`@port${index}-ptFramerate`).find(':selected')
            .should('have.text', '35Hz')
            .should('have.value', '5')
          cy.get(`@port${index}-ptUniverse`).should('have.value', `${index + 1}`)
          cy.get(`@port${index}-ptRangeFrom`).should('have.value', '1')
          cy.get(`@port${index}-ptRangeTo`).should('have.value', '512')
          cy.get(`@port${index}-ptOffsetAddr`).should('have.value', '0')

          for (let i = 1; i < 5; i++) {
            cy.get(`@port${index}-ptMergeMode`).select(i)
            hiddenOutputMerge.forEach(name => {
              cy.get(`@port${index}-${name}`).should('not.be.visible')
            })
          }

          cy.get(`@port${index}-ptMergeMode`).select(0) // Off
          hiddenOutput.forEach(name => {
            cy.get(`@port${index}-${name}`).should('not.be.visible')
          })

          cy.get(`@port${index}-ptMergeMode`).select(1) // HTP

          cy.checkMinMax({
            alias: `@port${index}-ptMergeUniverse`,
            min: 1,
            max: 32767,
            value: index + 1 + numberOfPorts
          })

          cy.checkMinMax({
            alias: `@port${index}-ptResendUniverse`,
            min: 1,
            max: 32767,
            value: index + 1 + numberOfPorts + index + 1 + numberOfPorts
          })

          cy.get(`@port${index}-ptMergeMode`).select(0) // HTP

          cy.get(`@port${index}-Submit`).click()

          cy.checkRequest({
            alias: '@save_dmx_port',
            attrList: {
              idx: `${index + 1}`,
              ptClonePort: `${index}`,
              ptRDM: '1',
              ptMode: '2',
              ptProtocol: '0', // Artnet mode
              ptUniverse: `${index}`, // Artnet universe value -1
              ptMergeMode: '0',
              ptFramerate: '5',
              ptRangeFrom: '1',
              ptRangeTo: '512',
              ptOffsetAddr: '0',
              EndFlag: '1'
            }
          })

          cy.get(`@port${index}-ptProtocol`).select(1) // sACN

          cy.get(`@port${index}-ptRDM`).uncheck()

          cy.get(`@port${index}-Submit`).click()

          cy.checkRequest({
            alias: '@save_dmx_port',
            attrList: {
              idx: `${index + 1}`,
              ptClonePort: `${index}`,
              ptRDM: '0',
              ptMode: '2',
              ptProtocol: '1', // sACN mode
              ptUniverse: `${index + 1}`, // sACN universe value -0
              ptMergeMode: '0',
              ptFramerate: '5',
              ptRangeFrom: '1',
              ptRangeTo: '512',
              ptOffsetAddr: '0',
              EndFlag: '1'
            }
          })
        })

    })
  })

  describe('Cues > Run cue', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('[href="#cues"]').click()
      cy.get('#cues > :nth-child(1) > .nav-link').click()

      cy.intercept('POST', '**?run_cues').as('run_cues')

      cy.get('#runCue').as('runCue')
      cy.get('#currentCue').as('currentCue')
      cy.get('#cuesResendEth').as('resendEthernet')
      cy.get('button[type="submit"]').as('Submit')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          RunCue: '0',
          CuesResendEth: '0',
          EndFlag: '1'
        }
      })

      cy.get('@runCue').select(1)
      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          RunCue: '1',
          CuesResendEth: '0',
          EndFlag: '1'
        }
      })
      cy.get('@currentCue').should('have.value', 'Cue 1')

      cy.get('@runCue').select(0)
      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          RunCue: '0',
          CuesResendEth: '0',
          EndFlag: '1'
        }
      })
      cy.get('@currentCue').should('have.value', 'No Cue')

      cy.get('@resendEthernet').check()
      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          CuesResendEth: '1',
          EndFlag: '1'
        }
      })

      cy.get('@runCue').select(10)
      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          RunCue: '10',
          CuesResendEth: '1',
          EndFlag: '1'
        }
      })

      cy.get('@currentCue').should('have.value')

      cy.get('@resendEthernet').uncheck()
      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          CuesResendEth: '0',
          EndFlag: '1'
        }
      })

      cy.get('@runCue').select(50)
      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@run_cues',
        attrList: {
          RunCue: '50',
          CuesResendEth: '0',
          EndFlag: '1'
        }
      })
      cy.get('@currentCue').should('have.value')

    })
  })

  describe('Cues > Save cue', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('[href="#cues"]').click()
      cy.get('#cues > :nth-child(2) > .nav-link').click()

      cy.intercept('POST', '**?save_cues').as('save_cues')

      cy.get('#CueNum').as('cueNum')
      cy.get('button[type="submit"]').as('Submit')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@save_cues',
        attrList: {
          CueNum: '1',
          EndFlag: '1'
        }
      })

      cy.get('@cueNum').select(49)
      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@save_cues',
        attrList: {
          CueNum: '50',
          EndFlag: '1'
        }
      })
    })
  })

  describe('Cues > Cue options', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('[href="#cues"]').click()
      cy.get('#cues > :nth-child(3) > .nav-link').click()

      cy.intercept('POST', '**?edit_cues').as('editCues')

      cy.get('#idx').as('cueNum')
      cy.get('#name').as('cueName')
      cy.get('#fadeTime').as('fadeTime')
      cy.get('#holdTime').as('holdTime')
      cy.get('#linkCue').as('linkCue')

      cy.get('button[type="submit"]').as('Submit')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@editCues',
        attrList: {
          idx: '1',
          Name: 'Cue 1',
          fadeTime: '0',
          linkCue: '0',
          EndFlag: '1'
        }
      })

      cy.get('@cueNum').select(49)
      cy.get('@cueName')
        .should('have.value', 'Cue 50')
        .clear().type('New cue name for Cue 50')
        .should('have.value', 'New cue name')
      cy.get('@fadeTime').clear().type('00:00:05')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@editCues',
        attrList: {
          idx: '50',
          Name: 'New cue name',
          fadeTime: '5',
          linkCue: '0',
          EndFlag: '1'
        }
      })

      cy.get('@cueNum').select(0)
      cy.get('@linkCue').select(2)

      cy.get('@holdTime')
        .should('be.visible')
        .clear().type('00:00:10')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@editCues',
        attrList: {
          idx: '1',
          Name: 'Cue 1',
          fadeTime: '0',
          holdTime: '10',
          linkCue: '2',
          EndFlag: '1'
        }
      })
    })
  })

  describe('IP Settings', () => {
    it('access the page, check its default content and check API calls', () => {
      cy.get('@menuToggle').click()

      cy.intercept('POST', '**?save_info').as('save_info')

      cy.get('#main-menu>ul>li:nth-child(5) a').click()

      cy.get('#addressmode').as('addressMode')
      cy.get('#ipaddress').as('ipAddress')
      cy.get('#netmask').as('netMask')
      cy.get('.btn-primary').as('Submit')

      cy.get('@ipAddress').should('not.be.visible')
      cy.get('@netMask').should('not.be.visible')

      cy.get('@addressMode').select(5)
      cy.get('@ipAddress').should('be.visible')
      cy.get('@netMask').should('be.visible')

      cy.get('@addressMode').select(2)
      cy.get('@ipAddress').should('not.be.visible')
      cy.get('@netMask').should('not.be.visible')

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@save_info',
        attrList: {
          addressmode: '4',
          EndFlag: '1'
        }
      })

      cy.get('@addressMode').select(5)

      cy.get('@Submit').click()

      cy.checkRequest({
        alias: '@save_info',
        attrList: {
          addressmode: '3',
          ipaddress: '002.143.056.006',
          netmask: '255.000.000.000',
          EndFlag: '1'
        }
      })
    })
  })
})

