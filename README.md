# Netron-UI

Netron UI is a standalone web application designed to replace the default Netron web application, used in network hardware from Obsidian Control Systems.

You can explore a demo of the Netron UI here: [Netron-UI Demo](https://spb8lighting.github.io/Netron-UI/).

In this demo, a simulated Netron device will be automatically generated each time the page is loaded or refreshed, showcasing different device configurations.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Development Documentation](#development-documentation)

## Introduction

This web application is designed for direct upload onto your Netron device, serving as a replacement for the default web application.

### Key Differences Compared to the Obsidian Solution:

- **Single-Page Application**
  - The application operates asynchronously from a single page, eliminating unnecessary network traffic and enabling instant page transitions.

- **Reduced Device Requests**
  - Upon the initial page load, all required information is retrieved from the device and kept up-to-date, significantly reducing the load on the device by minimizing requests for static and dynamic content.

- **On-board Virtual Keyboard**
  - For devices accessing this application without a physical or virtual keyboard, the Netron UI includes a compact yet fully functional on-screen keyboard.

- **Light/Dark Theme Options**
  - An embedded light/dark theme provides optimal comfort, with a light theme for daylight use and a dark theme for low-light environments.

- **Modern Design**
  - The overall design has been refreshed with Bootstrap, offering a more modern and user-friendly experience.

- **Lightweight Application**
  - The application is designed to be lightweight, with minimized dependencies to keep the size under 2 MB, ensuring fast load times and efficient performance.

- **Designed for Easy Maintenance and Future Evolution**
  - The codebase is structured to minimize maintenance efforts and is prepared for future hardware upgrades.

This web application needs to be uploaded to your Netron device, replacing the official web application.

**⚠ Disclaimer: This is unofficial software. Using it may risk bricking your hardware, and Obsidian will not provide support in case of issues. Use at your own risk.**

## Installation

As the package is not yet production-ready, installation documentation is not currently available.

# Development Documentation

## Adding a New Page

To add a new page to the application, follow these steps:

1. **Update the Menu Configuration:**

   In the `class.config.js` file, locate the `config` object and add an entry for your new page. This entry will define the page or menu item, including its Font-Awesome icon and name.

   - Each entry represents a page or a menu item in the application.
   - Entries can contain nested items, which will be displayed as sub-menu items in the application.

   Example configuration:
   ```javascript
   presets: {
      icon: 'fa-sliders', 
      name: 'Presets',
      items: {
        netron: { name: 'Netron presets' },
        user: { name: 'User presets' }
      }
    }
   ```
   - **Icon:** Define the Font-Awesome icon class to be displayed next to the menu item.
   - **Name:** Specify the name that will appear in the menu.
   - **Nested Items:** If your page includes sub-pages, list them within the `items` object, each with a unique name.

2. **Link the Menu Entry to a Page Method:**

   The entry name (e.g., `presets`) will be used by the menu event listener to load the associated method from `class.page.js`. For sub-menu items, the method name will be a concatenation of the main entry name and the sub-item name in CamelCase (e.g., `presetsNetron`).

3. **Create the Page Method:**

   In the `class.page.js` file, create a new method corresponding to your page. Prefix the method name with `page_` (e.g., `page_presetsUser`). This method should include at least the following two functions:

   ```javascript
   page_presetsUser() {
      // 1. Set the page title
      this.setTitle('User presets')

      // 2. Add your content
      const p = document.createElement('p')
      p.innerText = 'Hello World!'

      // 3. Append the content to the page
      this.#pageContent.append(p)
   }
   ```

   - **Set the Page Title:** Use `this.setTitle()` to set the title of the page.
   - **Add Content:** Create and customize your page content using standard DOM manipulation.
   - **Append Content:** Use `this.#pageContent.append()` to add your content to the page.

### Hardware to Human
The hardware is sending integers value, which needs to be translated into readable values.

To specify a specific attribute option for a device from the translate object of the config.js, you can add a restricted attribute containing **a Set** of DeviceType value(s).

```javascript
export const translate = {
myParam: [
    { name: 'option 1', desc: 'Option 1' },
    ...,
    { name: 'option x', desc: 'Option x', restricted: new Set(['NETRON EN12', 'NETRON RDM10']) }
  ]
}
```