export default class FetchJSON {
  #devMode = ''

  constructor({ devMode }) {
    if (devMode) {
      this.#devMode = `cypress/fixtures/${devMode}/`
    }
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
  async get({ file }) {
    return fetch(file, this.#headers.get)
      .then(async response => await response.json())
  }

  async post({ url, formData }) {
    const headers = { ...this.#headers.post, body: new URLSearchParams(formData) }
    if (this.#devMode) {
      const fakeResponse = { url: url, headers: { ...this.#headers.post, body: Object.fromEntries(headers.body) } }
      console.clear()
      console.group('Fetch > Send')
      console.log(fakeResponse)
      console.table(fakeResponse.headers.body)
      console.groupEnd()
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts?${url}`, headers)
      return
    } else {
      const response = await fetch(url, headers)
      return await response.json()
    }
  }

  async bulkGet({ arrayOfFile }) {
    if (this.#devMode) {
      console.clear()
      console.group('Fetch < Get')
      console.log([...arrayOfFile])
    }

    const fetchPromises = [...arrayOfFile].map(url => fetch(this.#devMode + url, this.#headers.get))
    const fetchResolved = await Promise.all(fetchPromises)

    const fetchJSON = fetchResolved.map(response => response.json())
    const data = await Promise.all(fetchJSON)
    if (this.#devMode) {
      console.log(data)
      console.groupEnd()
    }
    return data
  }
}