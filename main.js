const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { google } = require('googleapis');
const path = require('path')
const fs = require('fs')
const isDev = require('electron-is-dev')

const Store = require('electron-store');
const store = new Store();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let authWin

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 720,
        height: 960,
        webPreferences: {
            nodeIntegration: false,
            preload: path.resolve(`${__dirname}/public/renderer.js`),
        },
    })

    win.center()

    // and load the index.html of the app.
    win.loadURL(
        isDev ? "http://localhost:3000" : `file://${path.join(__dirname, '/build/index.html')}`
    )

    // Open the DevTools.
    win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

function createAuthWin(url) {
    // Create the browser window.
    authWin = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            preload: path.resolve(`${__dirname}/public/renderer.js`),
        },
    })

    authWin.center()

    // and load the index.html of the app.
    authWin.loadURL(url)

    // Emitted when the window is closed.
    authWin.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        authWin = null
    })
} 

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('open-auth-window', (event, url) => {
	createAuthWin(url)
})

ipcMain.on('download-file', (event, id, name, mimeType) => {
    dialog.showSaveDialog({defaultPath: name, properties: 'openDirectory'}).then(response => {
        const filePath = response.filePath

        console.log(`path: ${filePath}, name: ${name}, mimeType: ${mimeType}`)

        fs.readFile(path.resolve(`${__dirname}/src/credentials.json`), (err, content) => {
            if(err) {
                return console.log('Error loading client secret file:', err)
            } else {
                // Authorize a client with credentials, then call the Google Drive API.
                content = JSON.parse(content)          
                const { client_secret, client_id, redirect_uris } = content.installed
                const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

                fs.readFile(path.resolve(`token.json`), (err, token) => {
                    oAuth2Client.setCredentials(JSON.parse(token));

                    const dest = fs.createWriteStream(filePath);
                    const drive = google.drive({version: 'v3', oAuth2Client})

                    let progress = 0;

                    // drive.files.get({
                    //     fileId: id,
                    //     alt: 'media'
                    // }, {responseType: 'stream'}, function(error, response) {
                    //     console.log(`response: ${response}`)
                    //     response.data
                    //         .on('end', () => {
                    //             console.log('Done');
                    //         })
                    //         .on('error', err => {
                    //             console.log('Error', err);
                    //         })
                    //         .pipe(dest);
                    // })

                    drive.files.get({
                        fileId: id,
                        alt: 'media'
                    }, {responseType: 'stream'}).then(response => {
                        return new Promise((resolve, reject) => {
                            console.log(response.data)

                            response.data
                                .on('end', () => {
                                    console.log('Done downloading file.');
                                    resolve(filePath);
                                })
                                .on('error', err => {
                                    console.error('Error downloading file.');
                                    reject(err);
                                })
                                .on('data', d => {
                                    progress += d.length;
                                    
                                    console.log(progress)
                                })
                                .pipe(dest);
                        })
                    }).catch(error => console.log(error))
                });
            }
        });
    })
})