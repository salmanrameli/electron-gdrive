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
                                <div class="info">
                                    <p>Info 1<br></br>info1.1<br></br>info1.2</p>
                                    <p>Info 2</p>
                                    <p>Info 3</p>
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