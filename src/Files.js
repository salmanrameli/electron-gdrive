import React, { Component } from 'react';

class Files extends Component {
    constructor(props) {
        super(props)

        this.state = {
            files: []
        }
    }

    static getDerivedStateFromProps(props, state) {
		return {
			files: props.files
		}
    }
    
    handleDownloadButtonOnClick(event, file) {
        return this.props.downloadFile(file)
    }

    render() {
        return(
            <div className="col-md-12 col-lg-12 col-xl-12">
                <div className="mt-2 mb-2">
                    <h5>Files</h5>
                </div>
                <div className="row">
                    <div className="col-12">
                        <table className="table">
                            <tbody>
                            {this.state.files.map(file => (
                                <tr key={file.id}>
                                    <td className="pl-0">
                                        <div className="dropup d-inline">
                                            <button type="button" className="btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title={`Details of ${file.name}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 24c6.627 0 12-5.373 12-12s-5.373-12-12-12-12 5.373-12 12 5.373 12 12 12zm1-6h-2v-8h2v8zm-1-12.25c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25z"/></svg>
                                            </button>
                                            <div className="dropdown-menu pt-1 pr-1 pb-1 pl-1">
                                                <small><b>Created at</b>: {file.createdTime}<br></br></small>
                                                {file.isGoogleDocsFormat ?
                                                    ""
                                                    :
                                                    <small><b>Size</b>: {file.size}<br></br></small>
                                                }
                                                <small><b>Mime Type</b>: {file.mimeType}</small>
                                            </div>
                                        </div>
                                        {file.name}
                                    </td>
                                    <td>
                                        <button className="btn btn-sm float-right" onClick={(e) => this.handleDownloadButtonOnClick(e, file)} title={`Download ${file.name}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M16 11h5l-9 10-9-10h5v-11h8v11zm1 11h-10v2h10v-2z"/></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
}

export default Files