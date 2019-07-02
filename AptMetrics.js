import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';

class AptMetrics extends Component {

  constructor() {
    super();

    this.options = {
        layout: {
            padding: {
              top: 50
            }
        },
        legend: {
            display: false
        },
        scales: {
          yAxes: [{
              ticks: {
                  beginAtZero: true,
                  max: 100
              }
          }]
        }
    }
    this.plugins = [{
        afterDatasetsDraw: function(chart) {
         var ctx = chart.ctx;
         chart.data.datasets.forEach(function(dataset, index) {
            var datasetMeta = chart.getDatasetMeta(index);
            if (datasetMeta.hidden) return;
            datasetMeta.data.forEach(function(point, index) {
               var value = dataset.data[index],
                   x = point.getCenterPoint().x,
                   y = point.getCenterPoint().y,
                   radius = point._model.radius,
                   fontSize = 14,
                   fontFamily = 'Verdana',
                   fontColor = 'black',
                   fontStyle = 'normal';
               ctx.save();
               ctx.textBaseline = 'middle';
               ctx.textAlign = 'center';
               ctx.font = fontStyle + ' ' + fontSize + 'px' + ' ' + fontFamily;
               ctx.fillStyle = fontColor;
               var txt = value + "\n" + dataset.label;
               var lineheight = 25;
               var lines = txt.split('\n');
               for (var i = 0; i<lines.length; i++)
                   ctx.fillText(lines[i], x, y - (i*lineheight) - radius - fontSize);
               ctx.restore();
            });
         });
        }
        }]
  }

  render() {
    return <>
        <Line options={this.options} data={this.props.data} plugins={this.plugins}/>
    </>;
  }
}

export default AptMetrics;
