import React from 'react';

// const {dialog} = window.require('electron')
const fs = window.fs;
const { google } = window.google;

const ipcRenderer = window.ipcRenderer;
const Store = window.Store;
const store = new Store();

// If modifying these scopes, delete token.json.
// const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly'];
const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.photos.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
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
        
                    files.map((file) => {
                        let mimeType = file.mimeType

                        mimeType = mimeType.split("/")
                        
                        if(mimeType[1] === "vnd.google-apps.folder") {
                            arrayOfFolders.push(file)
                        } else {
                            arrayOfFiles.push(file)
                        }
                    });

                    this.setState({
                        folders: arrayOfFolders,
                        files: arrayOfFiles
                    })
                    
                    // this.listFiles(auth);
                } else {
                    console.log('No files found.')
                }
            }
        });
    }

    handleFolderOnClick(e, id, name) {        
        if(this.state.previousDirectories.length === 0) {
            this.state.previousDirectories.push("root")
            this.state.previousDirectoriesName.push(name)

            this.setState({
                currentDirectory: id
            })
        } else {
            this.state.previousDirectoriesName.push(name)
            let currentDirectory = this.state.currentDirectory

            this.setState({
                previousDirectory: currentDirectory,
                currentDirectory: id
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

    handleDownloadButtonOnClick(e, file) {
        ipcRenderer.send('download-file', file.id, file.name, file.mimeType, this.state.oAuth2Client)
    }

    render() {
        return(
            <div className="row">
                {this.state.needToken ? 
                    <div className="col-md-12">
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
                        <div className="mb-2 border-bottom">
                            <h5>
                                {this.state.previousDirectories.length === 0 ?
                                    <button className="btn btn-outline-secondary mr-3" disabled><i className="fas fa-arrow-left"></i></button>
                                :
                                    <button className="btn btn-outline-secondary mr-3" onClick={(e) => this.handleBackButtonOnClick(e)}><i className="fas fa-arrow-left"></i></button>
                                }
                                Folders
                            </h5>
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><i className="fas fa-home"></i></li>
                                    {this.state.previousDirectoriesName.map((name, index) => (
                                        <li className="breadcrumb-item" key={index}>{name}</li>
                                    ))}
                                </ol>
                            </nav>
                        </div>
                        <div className="card-columns">
                            {this.state.folders.map(folder => (
                                <div className="card cursor-pointer" key={folder.id} onClick={(e) => this.handleFolderOnClick(e, folder.id, folder.name)}>
                                    <div className="card-body">
                                        <p>{folder.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pb-2 mt-4 mb-2 border-bottom">
                            <h5>Files</h5>
                        </div>
                        <div className="card-columns">
                            {this.state.files.map(file => (
                                <div className="card text-white border-dark" key={file.id}>
                                    <img className="card-img overlayed" src={file.thumbnailLink} alt={file.name} style={{ backgroundSize: 'cover', maxHeight: '250px', minHeight: '200px' }}></img>
                                    <div className="card-img-overlay">
                                        <h5 className="card-title">{file.name}</h5>
                                        <button className="btn btn-sm btn-light btn-download" onClick={(e) => this.handleDownloadButtonOnClick(e, file)}><i className="fas fa-file-download"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                }
            </div>
        );
    }
}

export default App;