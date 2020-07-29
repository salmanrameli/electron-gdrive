import React from 'react';

import Folders from './Folders';
import Pictures from './Pictures';
import Files from './Files';

const { google } = window.google;
const fs = window.fs;
const ipcRenderer = window.ipcRenderer;
const Store = window.Store;

const store = new Store();

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = [
    'https://www.googleapis.com/auth/drive',
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            authCode: "",
            oAuth2Client: {},
            needToken: "",
            folders: [],
            files: [],
            pictures: [],
            previousDirectories: [],
            previousDirectoriesName: [],
            currentDirectory: "",
            previousDirectory: ""
        }

        this.init = this.init.bind(this)
        this.authorize = this.authorize.bind(this)
        this.getAccessToken = this.getAccessToken.bind(this)
        this.onSubmitAuthCodeHandler = this.onSubmitAuthCodeHandler.bind(this)
        this.listDirectoryContent = this.listDirectoryContent.bind(this)
        this.handleFolderOnClick = this.handleFolderOnClick.bind(this)
        this.handleDownloadButtonOnClick = this.handleDownloadButtonOnClick.bind(this)
    }

    componentDidMount() {
        this.setState({
            needToken: true,
        })
        
        this.init()
    }

    init() {
        fs.readFile('credentials.json', (err, content) => {
            if(err) {
                return console.log('Error loading client secret file:', err)
            } else {
                // Authorize a client with credentials, then call the Google Drive API.                
                this.authorize(JSON.parse(content))
            }
        });
    }

    authorize(credentials) {
        const { client_secret, client_id, redirect_uris } = credentials.installed
        
        this.setState({
            oAuth2Client: new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
        })
    
        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if(err) {
                return this.getAccessToken(this.state.oAuth2Client)
            } else {
                this.state.oAuth2Client.setCredentials(JSON.parse(token))

                this.setState({
                    needToken: false
                })

                this.listDirectoryContent()   
            }     
        });
    }

    getAccessToken(oAuth2Client) {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        ipcRenderer.send('open-auth-window', authUrl)
    }

    onSubmitAuthCodeHandler(e) {
        e.preventDefault();

        let authCode = e.target.code.value

        this.state.oAuth2Client.getToken(authCode, (err, token) => {
            if(err) {
                return console.error('Error retrieving access token', err)
            } else {
                this.state.oAuth2Client.setCredentials(token);

                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if(err) {
                        return console.error(err)
                    } else {
                        console.log('Token stored to', TOKEN_PATH)
                    }
                });

                this.listDirectoryContent()
            }
        });
    }

    listDirectoryContent(directory = 'root') {
        const auth = this.state.oAuth2Client
        const drive = google.drive({version: 'v3', auth})

        drive.files.list({
            corpora: 'user',
            orderBy: 'folder, name',
            fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink)',
            spaces: 'drive',
            q: `'${directory}' in parents`
        }, (err, res) => {
            if(err) {
                return console.log('The API returned an error: ' + err)
            } else {
                const files = res.data.files
                
                if(files.length) {
                    let arrayOfFolders = []
                    let arrayOfFiles = []
                    let arrayOfPictures = []
        
                    files.map((file) => {
                        let mimeType = String(file.mimeType)

                        if(mimeType.includes("vnd.google-apps.folder")) {
                            arrayOfFolders.push(file)
                        } else if(mimeType.includes("image")) {
                            arrayOfPictures.push(file)
                        } else {
                            arrayOfFiles.push(file)
                        }
                    });

                    if(arrayOfFolders.length > 0) {
                        this.setState({
                            folders: arrayOfFolders
                        })
                    }

                    if(arrayOfFiles.length > 0) {
                        this.setState({
                            files: arrayOfFiles
                        })
                    }

                    if(arrayOfPictures.length > 0) {
                        this.setState({
                            pictures: arrayOfPictures
                        })
                    }
                } else {
                    console.log('No files found.')
                }
            }
        });
    }

    handleFolderOnClick(id, name) {        
        if(this.state.previousDirectories.length === 0) {
            this.state.previousDirectories.push("root")
            this.state.previousDirectoriesName.push(name)

            this.setState({
                currentDirectory: id,
                folders: [],
                files: [],
                pictures: [],
            })
        } else {
            this.state.previousDirectoriesName.push(name)
            let currentDirectory = this.state.currentDirectory

            this.setState({
                previousDirectory: currentDirectory,
                currentDirectory: id,
                folders: [],
                files: [],
                pictures: [],
            })

            this.state.previousDirectories.push(currentDirectory)
        }

        this.listDirectoryContent(id)
    }

    handleBackButtonOnClick(e) {
        let previousDirectory = this.state.previousDirectories.pop()

        this.state.previousDirectoriesName.pop()

        this.listDirectoryContent(previousDirectory)
    }

    handleDownloadButtonOnClick(file) {
        const mimeType = String(file.mimeType)
        const method = mimeType.includes('vnd.google-apps') ? "export" : "get"

        let data = {
            fileName: file.name,
        }

        ipcRenderer.send('download-file', JSON.stringify(data))

        ipcRenderer.on('start-download', (event, filePath) => {
            const auth = this.state.oAuth2Client
            const drive = google.drive({version: 'v3', auth})

            if(method === "get") {
                drive.files.get({
                    fileId: file.id,
                    alt: "media"
                }, { responseType: "arraybuffer" },
                    function(error, { data }) {
                        fs.writeFile(filePath, Buffer.from(data), error => {
                            if(error) console.log(error);
                        });
                    }
                );
            } 
            
            if(method === "export") {
                drive.files.export({
                    auth: auth,
                    fileId: file.id,
                    mimeType: "application/pdf"
                }, { responseType: "arraybuffer" },
                    (error, res) => {
                        if(error) {
                            console.log(error)
                        } else {
                            fs.writeFile(filePath + ".pdf", Buffer.from(res.data), function(error) {
                                if(error) console.log(error)
                            });
                        }
                    }
                );
            }
        })
    }

    render() {
        return(
            <div className="row">
                {this.state.needToken ? 
                    <div className="col-md-12 ml-2 mr-2">
                        <h3>Please enter authorization token below</h3>
                        <form id="authCodeForm" onSubmit={this.onSubmitAuthCodeHandler}>
                            <div className="form-row">
                                <div className="form-group col-md-6 col-md-offset-3">
                                    <label className="form-label" htmlFor="code">Enter auth code here:</label>
                                    <input className="form-control" id="code" name="code" type="text" />
                                </div>
                                <button className="btn btn-success float-right" type="submit">Set Token</button>
                            </div>
                        </form>
                    </div>
                    :
                    <div className="col-md-12">
                        <div className="breadcrumb-area">
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb pr-4">
                                    <li className="breadcrumb-item ml-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style={{ fill: 'white' }} d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/></svg>
                                    </li>
                                    {this.state.previousDirectoriesName.map((name, index) => (
                                        <li className="breadcrumb-item text-white" key={index}>{name}</li>
                                    ))}
                                </ol>
                            </nav>
                        </div>
                        {this.state.previousDirectories.length === 0 ?
                            ""
                            :
                            <button className="btn btn-outline-secondary ml-3" onClick={(e) => this.handleBackButtonOnClick(e)}><i className="fas fa-arrow-left"></i></button>
                        }
                        <div className="row ml-1 mr-1 scrollable">
                            {this.state.folders.length ?
                                <Folders 
                                    folders = {this.state.folders}
                                    openFolder = {this.handleFolderOnClick} 
                                />
                                :
                                ""
                            }
                            {this.state.pictures.length ? 
                                <Pictures
                                    pictures = {this.state.pictures}
                                    downloadPicture = {this.handleDownloadButtonOnClick}
                                />
                                :
                                ""
                            }
                            {this.state.files.length ?
                                <Files
                                    files = {this.state.files}
                                    downloadFile = {this.handleDownloadButtonOnClick}
                                />
                                :
                                ""
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }
}

export default App;