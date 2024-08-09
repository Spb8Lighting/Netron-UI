Cypress.Commands.add('checkRequest', ({ alias, attrList }) => {
  cy.wait(alias).then(($data) => {
    const body = Object.fromEntries(new URLSearchParams($data.request.body))
    cy.wrap(body).as('body')
    for (const attr in body) {
      if (attrList[attr] !== undefined) {
        cy.get('@body').its(attr).should('eq', attrList[attr])
      } else {
        cy.get('@body').its(attr).should('not.exists')
      }
    }
  })
})

Cypress.Commands.add('checkMinMax', ({ alias, min, max, value }) => {
  cy.get(alias).clear()
    .type(min - 1).should('match', ':invalid')
    .clear()
    .type(min).should('match', ':valid')
    .clear()
    .type(max + 1).should('match', ':invalid')
    .clear()
    .type(max).should('match', ':valid')
    .clear()
    .type(value).should('match', ':valid')
})