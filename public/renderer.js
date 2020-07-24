const path = require('path')

window.electron = {}
window.Store = require('electron').remote.require('electron-store')
window.electronObject = require('electron').electronObject
window.isDev = require('electron-is-dev')
window.ipcRenderer = require('electron').ipcRenderer
window.fs = require('fs')
window.google = require('googleapis')
window.shell = require('electron').shell
window.dialog = require('electron').dialog