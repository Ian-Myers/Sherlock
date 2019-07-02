import React, { Component } from 'react';
import './App.css';
import { Button } from 'reactstrap';

class HighestPercentButton extends Component {

    click = () => {
        this.props.highestPercent();
    }

    render() {
        if (!this.props.isHighestPercentSelected) {
            return <div>
                <Button color="info" onClick={this.click}>Show Countries With Highest Change</Button>
                </div>
        }
        if (this.props.isHighestPercentSelected) {
            return <div>
                <Button color="info" onClick={this.click}>Show All Countries</Button>
                </div>
        }
    }
}

export default HighestPercentButton;