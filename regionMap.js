import React, { Component } from 'react';
import { Chart } from "react-google-charts";

class RegionMap extends Component {

    constructor() {
        super();

        this.options = {
            colorAxis: {
                minValue: 0,
                maxValue: 100,
                colors: ['#008000', '#ff0000']
            }
        }
        this.chartType = "GeoChart"
    }

    render() {
        return <>
            <Chart options={this.options} chartType={this.chartType} data={this.props.data} />
        </>;
    }
}

export default RegionMap;