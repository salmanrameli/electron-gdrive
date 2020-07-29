import React, { Component } from 'react';

class Folders extends Component {
    constructor(props) {
        super(props)

        this.state = {
            folders: []
        }
    }

    static getDerivedStateFromProps(props, state) {
		return {
			folders: props.folders
		}
    }
    
    handleFolderOnClick(event, folderId, folderName) {
        return this.props.openFolder(folderId, folderName)
    }

    render() {
        return(
            <div className="col-md-12 col-lg-6 col-xl-6">
                <div className="mt-2 mb-2">
                    <h5>Folders</h5>
                </div>
                <div className="card-columns">
                    {this.state.folders.map(folder => (
                        <div className="card cursor-pointer" key={folder.id} onClick={(e) => this.handleFolderOnClick(e, folder.id, folder.name)}>
                            <div className="card-body">
                                <p>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 22h-24v-14h7.262c1.559 0 2.411-.708 5.07-3h11.668v17zm-16.738-16c.64 0 1.11-.271 2.389-1.34l-2.651-2.66h-7v4h7.262z"/></svg>
                                    &nbsp; {folder.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

export default Folders