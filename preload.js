const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
})

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  checkVastgoedmarkt: () => ipcRenderer.invoke('checkVastgoedmarkt'),
  checkPropertyNL: () => ipcRenderer.invoke('checkPropertyNL'),
  checkLogistiek: () => ipcRenderer.invoke('checkLogistiek'), 
  checkVastgoedjournaal: () => ipcRenderer.invoke('checkVastgoedjournaal'), 
});

const fs = require('fs');
contextBridge.exposeInMainWorld('electronFs', {
  readFileSync: fs.readFileSync,
  existsSync: fs.existsSync,
  readdirSync: fs.readdirSync,
  statSync: fs.statSync,
  isDirectory: (url) => fs.statSync(url).isDirectory(),
})

const os = require('os');
contextBridge.exposeInMainWorld('electronOs', {
  homedir: os.homedir,
})

const path = require('path');
contextBridge.exposeInMainWorld('electronPath', {
  join: path.join,
})

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, value) => callback(value)),
  statusValue: (value) => ipcRenderer.send('status-value', value),
  onResults: (callback) => ipcRenderer.on('update-results', (_event, value) => callback(value)),
  resultValue: (value) => ipcRenderer.send('results-value', value),
  onGetDataComplete: (callback) => ipcRenderer.on('update-complete', (_event, value) => callback(value)),
})
