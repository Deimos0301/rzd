import React from 'react';
import { Button } from 'devextreme-react/button';
import './container.css';

class Container extends React.Component {
    
    render() {
        return (
            <div className='container' style={{
                display: this.props.display || "flex", 
                flexDirection: "column",
                height: this.props.height || "100%",
                width: this.props.width || "100%", 
                minWidth: "200px",
                // minHeight: "200px",
                // boxShadow: "5px 5px 5px grey",
                borderStyle: "groove",
                background: "white"}}>
                
                <div className='header-panel' style={{paddingRight: "5px"}}> {this.props.title}
                    {this.props.closeButton ? <Button icon="remove" stylingMode='outlined' onClick={this.props.onCloseClick} /> : undefined}
                </div>

                {this.props.children}
            </div>
        );
    }
}

export default Container;