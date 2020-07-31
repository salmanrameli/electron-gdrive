import React, { Component } from 'react';

class Pictures extends Component {
    constructor(props) {
        super(props)

        this.state = {
            pictures: []
        }
    }

    static getDerivedStateFromProps(props, state) {
		return {
			pictures: props.pictures
		}
    }
    
    handleDownloadButtonOnClick(event, picture) {
        return this.props.downloadPicture(picture)
    }

    render() {
        return(
            <div className="col-md-12 col-lg-6 col-xl-6">
                <div className="mt-2 mb-2">
                    <h5>Images</h5>
                </div>
                <div className="card-columns">
                    {this.state.pictures.map(picture => (
                        <div className="card text-white border-dark" key={picture.id}>
                            <img className="card-img overlayed" src={picture.thumbnailLink} alt={picture.name} style={{ backgroundSize: 'cover', height: '250px' }}></img>
                            <div className="card-img-overlay">
                                <h5 className="card-title" title={picture.name}>{picture.name}</h5>
                                <div className="btn-group dropup btn-picture-detail">
                                    <button type="button" className="btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" title="Details">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style={{ fill: 'white' }} d="M12 24c6.627 0 12-5.373 12-12s-5.373-12-12-12-12 5.373-12 12 5.373 12 12 12zm1-6h-2v-8h2v8zm-1-12.25c.69 0 1.25.56 1.25 1.25s-.56 1.25-1.25 1.25-1.25-.56-1.25-1.25.56-1.25 1.25-1.25z"/></svg>                                    </button>
                                    <div className="dropdown-menu pt-1 pr-1 pb-1 pl-1 w-100">
                                        <small><b>Width</b>: {picture.imageMediaMetadata.width} px</small>
                                        <br></br>
                                        <small><b>Height</b>: {picture.imageMediaMetadata.height} px</small>
                                        <br></br>
                                        <small><b>Created at</b>: {picture.createdTime}</small>
                                        <br></br>
                                        <small><b>Size</b>: {picture.size}</small>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-download" onClick={(e) => this.handleDownloadButtonOnClick(e, picture)} title={`Download ${picture.name}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style={{ fill: 'white' }} d="M16 11h5l-9 10-9-10h5v-11h8v11zm1 11h-10v2h10v-2z"/></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
}

export default Pictures