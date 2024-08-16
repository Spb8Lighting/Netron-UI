const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  optimization: {
    minimize: false
  },
  entry: {
  },
  output: {
    path: path.resolve(__dirname, 'build')
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'index.html', to: 'index.html' },
        { from: 'assets/css', to: 'assets/css' },
        { from: 'assets/js', to: 'assets/js' },
        { from: 'assets/img', to: 'assets/img' },
        { from: 'vendors', to: 'vendors' }
      ]
    })
  ],
  resolve: {
    alias: {
      config: path.resolve(__dirname, 'assets/js/config.js'),
      DarkTheme: path.resolve(__dirname, 'assets/js/class.DarkTheme.js'),
      Menu: path.resolve(__dirname, 'assets/js/class.Menu.js'),
      Page: path.resolve(__dirname, 'assets/js/class.Page.js'),
      Translate: path.resolve(__dirname, 'assets/js/class.Translate.js'),
      Device: path.resolve(__dirname, 'assets/js/class.Device.js'),
      FetchJSON: path.resolve(__dirname, 'assets/js/class.FetchJSON.js'),
      'simple-keyboard': path.resolve(__dirname, 'vendors/simple-keyboard/js/index.modern.esm.js'),
      MobileKeyboard: path.resolve(__dirname, 'assets/js/class.MobileKeyboard.js')
    }
  }
}