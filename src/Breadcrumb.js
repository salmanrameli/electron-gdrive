import React, { Component } from 'react';

class Breadcrumb extends Component {
    constructor(props) {
        super(props)

        this.state = {
            previousDirectoriesName: []
        }
    }

    static getDerivedStateFromProps(props, state) {
		return {
			previousDirectoriesName: props.previousDirectoriesName
		}
    }
    
    handleHomeButtonOnClick(event) {
        return this.props.handleHomeButtonOnClick()
    }

    handleOpenChosenDirectory(event, index) {
        const previousDirectoriesName = this.state.previousDirectoriesName

        if(!(index === (previousDirectoriesName.length - 1))) {
            console.log(`selected index: ${index}`)

            // index = index + 1

            return this.props.handleOpenChosenDirectory(index)
        }
    }

    render() {
        return(
            <div className="breadcrumb-area">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb pr-4">
                        <li className="breadcrumb-item ml-3" onClick={(e) => this.handleHomeButtonOnClick(e)} title="Back to home directory">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path style={{ fill: 'white' }} d="M21 13v10h-6v-6h-6v6h-6v-10h-3l12-12 12 12h-3zm-1-5.907v-5.093h-3v2.093l3 3z"/></svg>
                        </li>
                        {this.state.previousDirectoriesName.map((name, index) => (
                            <li className="breadcrumb-item text-white" key={index} onClick={(e) => this.handleOpenChosenDirectory(e, index)}><small>{index}-{name}</small></li>
                        ))}
                    </ol>
                </nav>
            </div>
        )
    }
}

export default Breadcrumb