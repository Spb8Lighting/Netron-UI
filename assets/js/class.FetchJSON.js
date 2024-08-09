export default class FetchJSON {
  #devMode = ''

  constructor({ devMode = '' }) {
    this.#devMode = devMode ? `cypress/fixtures/${devMode}/` : ''
  }

  #headers = {
    get: {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    },
    post: {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
    }
  }

  /**
   * Check if a variable is set, if not, it throw an error with the variable name
   * @param {*} param variable MANDATORY
   * @param {String} paramName variable name displayed in the error MANDATORY
   * @throws {Error} if the variable is not set
   */
  #validatePresence(param, paramName) {
    if (!param) {
      throw new Error(`The '${paramName}' parameter is required.`)
    }
    if (paramName === 'arrayOfFile') {
      if (!(param instanceof Set) || param.size === 0) {
        throw new Error(`The '${paramName}' parameter must be a non-empty Set.`)
      }
    }
  }

  /**
   * This GET method download distant file and return its content as a JSON
   * @param {String} file file location MANDATORY
   * @param {Object} options headers options
   * @returns {Promise<[Object]>} returns the JSON content of the called file
   * @throws {Error} HTTP error if the response is not ok or if file is not present
   */
  async get({ file, options = {} }) {

    this.#validatePresence(file, 'file')

    try {
      const headers = { ...this.#headers.get, ...options }
      const response = await fetch(file, headers)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Fetch GET error:', error)
      throw error
    }
  }

  /**
  * This POST method send form data to a specific url
  * @param {String} url API where to send the information MANDATORY
  * @param {FormData} formData formData of the submitted form to transmit to the API MANDATORY
  * @param {Object} options headers options
  * @returns {Promise<[Object]>} returns the response in JSON
  */
  async post({ url, formData, options = {} }) {
    this.#validatePresence(url, 'url')
    this.#validatePresence(formData, 'formData')

    const headers = { ...this.#headers.post, ...options, body: new URLSearchParams(formData) }
    if (this.#devMode) {
      const fakeResponse = { url: url, headers: { ...this.#headers.post, ...options, body: Object.fromEntries(headers.body) } }

      console.clear()
      console.group('Fetch > Send')
      console.log(fakeResponse)
      console.table(fakeResponse.headers.body)
      console.groupEnd()

      // This fetch is to ensure the compatibility with Cypress during the automatise tests
      await fetch(`https://jsonplaceholder.typicode.com/posts?${url}`, headers)
      return Promise.resolve(fakeResponse)  // Returning the fakeResponse for consistency
    } else {
      const response = await fetch(url, headers)
      return await response.json()
    }
  }

  /**
   * This method will proceed with // GET API call request
   * @param {Set<String>} arrayOfFile list of file to download MANDATORY
   * @param {Object} options headers options
   * @returns {Promise<Object[]>} returns the response in JSON
   */
  async bulkGet({ arrayOfFile, options = {} }) {

    this.#validatePresence(arrayOfFile, 'arrayOfFile')

    if (this.#devMode) {
      console.clear()
      console.group('Fetch < Get')
      console.log(arrayOfFile)
    }

    const errors = new Set()
    const headers = { ...this.#headers.get, ...options }
    const fetchPromises = [...arrayOfFile].map(url =>
      fetch(this.#devMode + url, headers)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .catch(error => {
          console.error(`Error fetching ${url}:`, error)
          errors.add(error)
          return null
        })
    )
    const data = (await Promise.all(fetchPromises)).filter(item => item !== null) // Remove failed calls

    if (errors.size > 0) {
      throw new Error(`Errors occurred during fetch: ${[...errors].map(e => e.message).join(', ')}`)
    }

    return data
  }
}