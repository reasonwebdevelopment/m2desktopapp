// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const Vastgoedmarkt = require('./modules/vastgoedmarkt');
const propertynl = require('./modules/propertynl'); // if you have this module too
const fs = require('fs');

let windows = new Set();

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'dist', 'preload.bundle.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            sandbox: false,
        }
    });

    windows.add(win);
    win.loadFile('index.html');

    // IPC handler for Vastgoedmarkt scraper
    ipcMain.handle('checkVastgoedmarkt', async () => {
        return await Vastgoedmarkt.scrapeVastgoedmarkt(win);
    });

    // IPC handler for PropertyNL scraper (if applicable)
    ipcMain.handle('checkPropertyNL', async () => {
        return await propertynl.scrapePropertyNL();
    });
    win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
