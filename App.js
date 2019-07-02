import React, { Component } from 'react';
import './App.css';
import VintageList from './Vintages.js';
import RunList from './Runs.js';
import AptMetrics from './AptMetrics.js';
import HighestPercentButton from './HighestPercentButton.js'
import { Container, Row, Col, Navbar, NavbarBrand, Button, Nav, Input } from 'reactstrap';
import SpecificVintage from './SpecificVintage';
import { Chart } from "react-google-charts";
import RegionMap from './regionMap.js';

const isoCodeFile = require('./isoCodes.js'); // this file is a dictionary of iso codes, where the three-digit code is the key and contains two properties: "name" and "code",
                                              // code is the two-digit iso code equivalent that Google GeoChart requires, and "name" is the name of the country
const rest = require('rest');
const mime = require('rest/interceptor/mime');

const client = rest.wrap(mime);

const regionFilter = (value, index, region) => region.indexOf(value) === index;

class App extends Component {

    constructor() {
        super();

        this.state = {
            allData: {
                datasets: [{
                    data: [],
                    label: null
                }],
                labels: []
            },
            allDropdownLabels: [],
            graphData: {},
            states: [],
            continents: [],
            countries: [],
            isHighestPercentSelected: false,
            geoChartData: [["Country", "Percent of APTs out of Range"]]
        }

        this.handleDropdownChange = this.handleDropdownChange.bind(this);
        this.highestPercent = this.highestPercent.bind(this);
        this.getAverageForRegion = this.getAverageForRegion.bind(this);
        this.updateGeoChartData = this.updateGeoChartData.bind(this);
        this.parseContinentCountryState = this.parseContinentCountryState.bind(this);

    }

    updateGeoChartData(datasets, labels) {

        /*
            This function handles updating the heat map according to the dropdown selection. Extra if/else conditions were
            added to check if the dropdown selection included the USA or CAN regions in order to average out their states.
        */

        let isoCodes = isoCodeFile.isoCodes; // this file is a dictionary of iso codes, where the three-digit code is the key and contains two properties: "name" and "code",
                                             // code is the two-digit iso code equivalent that Google GeoChart requires, and "name" is the name of the country
        let geoChartData = [["Country", "Percent of APTs out of Range"]];

        let averagesRunForUsa = false; // check to see if the sub-regions of USA have been averaged yet
        let averagesRunForCan = false; // check to see if the sub-regions of CAN have been averaged yet

        for (let i = 0; i < labels.length; i++) {

            if ((isoCodes[labels[i].country]) && (!isNaN(datasets[i].data[datasets[i].data.length - 1]))) { // checks to make sure the country exists in the iso_code file and that the last data point in the array is NOT NaN

                if ((labels[i].country === "USA") && (averagesRunForUsa === false)){ // only runs once when the country is USA, adds the average percent for the entire USA to the geoChartData array

                    let filteredUSAData = datasets
                        .filter(item => {
                            return item.label.includes("usa");
                        });

                    let averagesForUsa = this.getAverageForRegion("USA", filteredUSAData);

                    geoChartData.push([
                        isoCodes[labels[i].country].code,
                        averagesForUsa.averageList[averagesForUsa.averageList.length - 1]
                    ]);

                    averagesRunForUsa = true;

                } else if ((labels[i].country === "CAN") && (averagesRunForCan === false)) { // only runs once when the country is CAN, adds the average percent for all of CAN to the geoChartData array

                    let filteredCanadaData = datasets
                        .filter(item => {
                            return item.label.includes("can");
                        });

                    let averageForCan = this.getAverageForRegion("CAN", filteredCanadaData);

                    geoChartData.push([
                        isoCodes[labels[i].country].code,
                        averageForCan.averageList[averageForCan.averageList.length - 1]
                    ]);

                    averagesRunForCan = true;

                } else if ((labels[i].country != "USA") && (labels[i].country != "CAN")){
                    geoChartData.push([
                        isoCodes[labels[i].country].code,
                        datasets[i].data[datasets[i].data.length - 1]
                    ]);
                }
            }
        }
        return geoChartData;
    }

    handleDropdownChange(e){

        /*
            This function governs how each dropdown responds to a change in the region selected.
            For example, if "EUR" in the continent dropdown is selected, this function ensures
            the other dropdowns only show countries and states from "EUR".
        */

        let continentDropdown = document.getElementById("continent");
        let countryDropdown = document.getElementById("country");
        let stateDropdown = document.getElementById("state");

        let selection = e.target; // e.target includes the value and id of the dropdown selection
        let allData = this.state.allData;

        if (selection.value === "all") { // dropdown selections that are NOT a specific region are assigned the value of "all"

            let avgData = this.getAverageForRegion("global", allData.datasets);

            let geoChartData = this.updateGeoChartData(allData.datasets, this.state.allDropdownLabels);

            let newGraphData = {
                    "datasets": [{
                        "label": avgData.label,
                        "labels": allData.labels,
                        "backgroundColor": "rgb(0,0,255)",
                        "fill": false,
                        "data": avgData.averageList
                    }],
                    "labels": allData.labels
            };

            let continentCountryState = this.parseContinentCountryState(allData.datasets);

            this.setState({
                countries: continentCountryState.countries,
                states: continentCountryState.states,
                graphData: newGraphData,
                isHighestPercentSelected: false,
                geoChartData: geoChartData
            });

        } else {
            let value;
            let filteredGraphData = allData.datasets // filters through the datasets and find all items that include the value of the dropdown, i.e "EUR"
                .filter(item => {
                    if (selection.value === "all_countries") {
                        value = continentDropdown.value;
                        return item.label.includes(value.toLowerCase())
                    }
                    if (selection.value === "all_states") {
                        value = countryDropdown.value;
                        return item.label.includes(value.toLowerCase())
                    } else {
                        value = selection.value;
                        return item.label.includes(value.toLowerCase())
                    }
                });

            let avgData = this.getAverageForRegion(value, filteredGraphData); // average out all the filtered data points for the selected region

            let graphObj = [{
                "label": avgData.label,
                "labels": allData.labels,
                "backgroundColor": "rgb(0,0,255)",
                "fill": false,
                "data": avgData.averageList
            }];

            let filteredDropdownLabels = this.state.allDropdownLabels // returns all labels that include the selected dropdown value
                .filter(label => {
                    return label[selection.id] === selection.value
                });

            let countries = filteredDropdownLabels // builds new dropdown list that only includes the countries that correspond with the selected dropdown value
                .map(item => item.country)
                .filter(regionFilter);

            let states = filteredDropdownLabels // builds new dropdown list that only includes the states that correspond with the selected dropdown value
                .map(item => item.state)
                .filter(regionFilter);

            let newGraphData = {
                "datasets": graphObj,
                "labels": allData.labels
            };

            let geoChartData = this.updateGeoChartData(filteredGraphData, filteredDropdownLabels);

            let setState = selection.id === "country" ?
                {states: states, graphData: newGraphData, isHighestPercentSelected: false, geoChartData: geoChartData} :
                selection.id === "state" ?
                {graphData: newGraphData, isHighestPercentSelected: false, geoChartData: geoChartData} :
                {countries: countries, states: states, graphData: newGraphData, isHighestPercentSelected: false, geoChartData: geoChartData};

            this.setState(setState);
        }
    }

    highestPercent() {

        /*
            This function returns the 3 regions with the highest change in their percentage of apts out of range.
            It doesn't matter if the change is positive or negative.
            It ignores all previous weeks and only compares the two most recent data points.
        */

        let allData = this.state.allData;

        let filteredPercentages = allData.datasets // returns a list that includes all items that have a value that isn't "NaN" in the "change" property
            .filter(item => {
                return (!isNaN(item.change))
            });

        let sortedList = filteredPercentages // creates an array of only the "change" values sorted from highest to lowest
            .map(item => item.change)
            .slice()
            .sort((a, b) => {
                return b - a
            });

        let topThree = sortedList.filter(item => sortedList.indexOf(item) < 3); // new array of the top three highest percent changes

        let i = 0;

        let filteredGraphData = filteredPercentages // finds all the items in filteredPercentages that include the top three highest percent changes
            .filter(item =>
                (i < topThree.length && topThree.includes(item.change)),
                i++
            );

        for (let i = 0; i < filteredGraphData.length; i++) { // for loop to round each data point to one decimal place, MIGHT BE A BETTER WAY TO HANDLE THIS
            for (let x = 0; x < filteredGraphData[i].data.length; x++) {
                filteredGraphData[i].data[x] = Math.round(filteredGraphData[i].data[x] * 10) / 10;
            }
        }

        let newGraphData = {
            "datasets": filteredGraphData,
            "labels": allData.labels
        };

        let filteredDropdownLabels = filteredGraphData
            .map(item => {
                return {
                    continent: item.label.substring(0,3).toUpperCase(),
                    country: item.label.substring(5,8).toUpperCase(),
                    state: item.label.substring(10,13).toUpperCase()
                };
         })

        let geoChartData = this.updateGeoChartData(filteredGraphData, filteredDropdownLabels);

        if (!this.state.isHighestPercentSelected){ // check to make sure the "Show Countries With Highest Change" button has not already been selected
            this.setState({isHighestPercentSelected: true, graphData: newGraphData, geoChartData: geoChartData});
        }

        if (this.state.isHighestPercentSelected){ // if "Show Countries With Highest Change" has already been selected, this check resets the graph to the global average

            let globalAvg = this.getAverageForRegion("global", allData.datasets);

            let newGraphData = {
                "datasets": [{
                    "label": globalAvg.label,
                    "labels": allData.labels,
                    "backgroundColor": "rgb(0,0,255)",
                    "fill" : false,
                    "data": globalAvg.averageList
                }],
                "labels": allData.labels
            };

            let geoChartData = this.updateGeoChartData(allData.datasets, this.state.allDropdownLabels);

            this.setState({isHighestPercentSelected: false, graphData: newGraphData, geoChartData: geoChartData});
        }
    }

    getAverageForRegion(region, datasets) {

        /*
            This function averages multiple data points for a region in a single point to be added to the graph
        */

        let avgList = [];

        for (let i = 0; i < datasets[0].data.length; i++){

            let numOfApts = datasets // adds all the number of apts for the region together
                .map(item => {
                    if (isNaN(item.num_apts[i])){ // checks to see if one of the num_apts is a NaN, which was causing an error on the global dataset
                        return 0;
                    } else {
                        return item.num_apts[i];
                    }
                })
                .flat()
                .reduce((total, num) => total + num);

            let numOfAptsOutOfRange = datasets // adds all the number of apts out of range together
                .map(item => {
                    if (isNaN(item.num_apts_out_of_range[i])){ // checks to see if one of the num_apts_out_of_range is a NaN, which was causing an error on the global dataset
                        return 0;
                    } else {
                        return item.num_apts_out_of_range[i];
                    }
                })
                .flat()
                .reduce((total, num) => total + num);

            let percentOfAptsOutOfRange = numOfAptsOutOfRange / numOfApts; // calculates the perecentage of apts out of range

            avgList.push(Math.round(percentOfAptsOutOfRange * 1000) / 10); // add the percentage to an array after rounding it to the first decimal place

        }

        let returnData = {"label": region, "averageList": avgList};

        return returnData;
    }

    componentDidMount() {

        /*
            This function ensures the react component has successfully loaded and then queries MNR.
            It returns all the data needed to populate the graph, the dropdowns, and sorting information.
            All initial states are set here.
        */

        client({method: 'GET', path: '/api/apt'}).then(response => {

            const responseData = response.entity;

            const datasetsWithColor = responseData.datasets
                .map(dataset => {
                    return Object.assign(
                        {},
                        dataset,
                        {
                            "backgroundColor": "rgb(0,0,255)",
                            'fill': false,
                            'change': Math.abs((dataset.data[dataset.data.length - 2] - dataset.data[dataset.data.length - 1])) // calculates the change from the most recent week to the week before
                        }
                    );
                });

            const allData = Object.assign({}, responseData, {'datasets': datasetsWithColor});

            let avgData = this.getAverageForRegion("global", datasetsWithColor);

            let graphData = {
                "datasets": [{
                    "label": avgData.label,
                    "labels": allData.labels,
                    "backgroundColor": "rgb(0,0,255)",
                    "fill": false,
                    "data": avgData.averageList
                }],
                "labels": allData.labels
            };

            console.log(allData);

            let allDropdownLabels = allData.datasets
                .map(item => {
                    return {
                        continent: item.label.substring(0,3).toUpperCase(),
                        country: item.label.substring(5,8).toUpperCase(),
                        state: item.label.substring(10,13).toUpperCase()
                    };
                })
                .filter(regionFilter);

            let continentCountryState = this.parseContinentCountryState(allData.datasets);

            let geoChartData = this.updateGeoChartData(allData.datasets, allDropdownLabels);

            this.setState({
                allData: allData,
                allDropdownLabels: allDropdownLabels,
                continents: continentCountryState.continents,
                countries: continentCountryState.countries,
                states: continentCountryState.states,
                graphData: graphData,
                geoChartData: geoChartData
            });
        });
    }

    parseContinentCountryState(datasets) { // creates separate lists that correspond to each dropdown option

        let continents = datasets
            .map(item => item.label.substring(0,3).toUpperCase())
            .filter(regionFilter);

        let countries = datasets
            .map(item => item.label.substring(5,8).toUpperCase())
            .filter(regionFilter);

        let states = datasets
            .map(item => item.label.substring(10,13).toUpperCase())
            .filter(regionFilter);

        return {"continents": continents, "countries": countries, "states": states};
    }

    render() {

        let continents = this.state.continents
            .sort()
            .map(item => <option key={item}>{item}</option>);

        let countries = this.state.countries
            .sort()
            .map(item => <option key={item}>{item}</option>);

        let states = this.state.states
            .sort()
            .map(item => <option key={item}>{item}</option>);

        return (
            <div className="App">
                <Navbar color="light" light expand="md">
                    <NavbarBrand href="/"><span role="img" aria-label="sherlock emoji">🕵</span></NavbarBrand>
                    <div className="pdg">
                    <Input type="select" id="continent" onChange={this.handleDropdownChange}>
                        <option value="all">All Continents</option>
                        {continents}
                    </Input>
                    </div>
                    <div className="pdg">
                    <Input type="select" id="country" onChange={this.handleDropdownChange}>
                        <option value="all_countries">All Countries</option>
                        {countries}
                    </Input>
                    </div>
                    <div className="pdg">
                    <Input type="select" id="state" onChange={this.handleDropdownChange}>
                        <option value="all_states">All States</option>
                        {states}
                    </Input>
                    </div>
                    <HighestPercentButton className="ml-auto" highestPercent={this.highestPercent} isHighestPercentSelected={this.state.isHighestPercentSelected} />
                    <Nav className="ml-auto" navbar>
                        <SpecificVintage className="ml-auto" />
                        <Button className="pdg" outline color="primary">
                            <a href='/api/apt-csv' download="metrics.xlsx">Download APT Geocoding</a>
                        </Button>
                        <Button className="pdg" outline color="primary">
                            <a href='/api/hsn-count-csv' download="metrics.xlsx">Download HSN Counts</a>
                        </Button>
                    </Nav>
                </Navbar>
                <Container className="margin-top">
                    <AptMetrics data={this.state.graphData} />
                </Container>
                <RegionMap data={this.state.geoChartData} />
                {/* <VintageList /> */}
                {/* <RunList /> */}
            </div>
        );
    }
}

export default App;
