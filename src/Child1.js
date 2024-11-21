import React, { Component } from 'react';
import * as d3 from 'd3';
import './Child1.css';

class Child1 extends Component {
  state = {
    company: "Apple",
    selectedMonth: 'November'
  };

  componentDidMount() {
    this.updateChart();
    console.log(this.props.csv_data)
  }

  componentDidUpdate(prevProps, prevState) {
    console.log(this.props.csv_data)
    const dataUpdate = prevProps.csv_data !== this.props.csv_data;
    const monthN = prevState.selectedMonth !== this.state.selectedMonth;
    const newCompany = prevState.company !== this.state.company;
    
    if (dataUpdate || newCompany || monthN) {
      this.updateChart();
    }
  }

  updateChart = () => {
    const { company, selectedMonth } = this.state;
    
    d3.select(document.getElementById("chart")).selectAll("*").remove();

    const w = 800;
    const h = 400;
    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const svg = d3.select(document.getElementById("chart"))
    .selectAll("svg")
    .data([null])
    .join("svg")
    .attr("width", w)
    .attr("height", h)
    .selectAll("g")
    .data([null])
    .join("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!this.props.csv_data || this.props.csv_data.length === 0) {
      svg.selectAll(".ndata")
        .data([null])
        .join("text")
          .attr("class", "ndata")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text("Please upload CSV data to view the chart");

      const xSc = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);

      const ySc = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

      svg.selectAll(".samplex")
        .data([null])
        .join("g")
          .attr("class", "samplex")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(xSc));

      svg.selectAll(".sampley")
        .data([null])
        .join("g")
          .attr("class", "sampley")
          .call(d3.axisLeft(ySc));

      return;
    }

    const data = this.props.csv_data.filter((d) => {
      const month = d.Date.toLocaleString("default", { month: "long" });
      return d.Company === company && month === selectedMonth;
    });

    if (data.length === 0) {
      svg.selectAll(".ndata")
        .data([null])
        .join("text")
          .attr("class", "ndata")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .style("font-size", "16px")
          .text(`No data available for ${company} in ${selectedMonth}`);

      return;
    }

    const xSc = d3.scaleTime()
      .domain(d3.extent(data, d => d.Date))
      .range([0, width]);

    const ySc = d3.scaleLinear()
      .domain([
        d3.min(data, d => Math.min(d.Open, d.Close)) * 0.995,
        d3.max(data, d => Math.max(d.Open, d.Close)) * 1.005
      ])
      .range([height, 0]);


    svg.selectAll(".y")
      .data([null])
      .join("g")
        .attr("class", "y")
        .call(d3.axisLeft(ySc)
          .tickFormat(d => `${d}`));

          
    svg.selectAll(".x")
      .data([null])
      .join("g")
        .attr("class", "x")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xSc)
          .tickFormat(d3.timeFormat("%b %d")));



    const tooltip = d3.select(document.getElementById("chart"))
      .selectAll(".tooltip")
      .data([null])
      .join("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");

    
    const closeL = d3.line()
      .x(d => xSc(d.Date))
      .y(d => ySc(d.Close));

    const openL = d3.line()
      .x(d => xSc(d.Date))
      .y(d => ySc(d.Open));

    svg.selectAll(".lineo")
      .data([data])
      .join("path")
        .attr("class", "lineo")
        .attr("fill", "none")
        .attr("stroke", "#90EE90")
        .attr("stroke-width", 2)
        .attr("d", openL);

    svg.selectAll(".linec")
      .data([data])
      .join("path")
        .attr("class", "linec")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", closeL);

    const showTool = (event, d) => {
      const [x, y] = d3.pointer(event);
    
      tooltip
        .style("opacity", 1)
        .html(`
          <div>
            Date: ${d.Date.toLocaleDateString()}<br/>
            Open: ${d.Open.toFixed(2)}<br/>
            Close: ${d.Close.toFixed(2)}<br/>
            Difference: ${(d.Close - d.Open).toFixed(2)}
          </div>
        `)
        .style("left", `${x + 15}px`) 
        .style("top", `${y - 10}px`); 
    };

    const hideTool = () => {
      tooltip.style("opacity", 0);
    };

    svg.selectAll(".doto")
      .data(data)
      .join("circle")
        .attr("class", "doto")
        .attr("r", 4)
        .attr("cx", d => xSc(d.Date))
        .attr("cy", d => ySc(d.Open))
        

        .attr("fill", "#90EE90")
        .on("mouseover", showTool)
        .on("mouseout", hideTool);

    svg.selectAll(".dotc")
      .data(data)
      .join("circle")
        .attr("class", "dotc")
        .attr("cy", d => ySc(d.Close))
        .attr("cx", d => xSc(d.Date))
        
        .attr("r", 4)
        .attr("fill", "red")
        .on("mouseover", showTool)
        .on("mouseout", hideTool);

    const legend = svg.selectAll(".legend")
      .data([null])
      .join("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 100}, 0)`);

    legend.selectAll(".ocircle")
      .data([null])
      .join("circle")
        .attr("class", "ocircle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 4)
        .style("fill", "#90EE90");

    legend.selectAll(".otext")
      .data([null])
      .join("text")
        .attr("class", "otext")
        .attr("x", 10)
        .attr("y", 4)
        .text("Open")
        .attr("style", "background-color: white")
        .style("font-size", "12px");

    legend.selectAll(".clocircle")
      .data([null])
      .join("circle")
        .attr("class", "clocircle")
        .attr("cx", 0)
        .attr("cy", 20)
        .attr("r", 4)
        .style("fill", "red");

    legend.selectAll(".ctext")
      .data([null])
      .join("text")
        .attr("class", "ctext")
        .attr("x", 10)
        .attr("y", 24)
        .text("Close")
        .attr("style", "background-color: white")
        .style("font-size", "12px");
  };

  render() {
    const options = ['Apple', 'Microsoft', 'Amazon', 'Google', 'Meta'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
      <div className="chartBox">
        <div className="controls">
          <div className="controlR">
            <label>Company:</label>
            <div className="button">
              {options.map(option => (
                <label key={option} className="buttonL">
                  <input
                  type="radio"
                  name="company"
                  value={option}
                  checked={this.state.company === option}
                  onChange={(e) => this.setState({ company: e.target.value })}
                  />
                  {option}
                  </label>
                ))}
                </div>
                </div>
                <div className="controlR">
                  <label>Month:</label>
                  <select
                  value={this.state.selectedMonth}
                  onChange={(e) => this.setState({ selectedMonth: e.target.value })}
                  >
                    {months.map(month => (
                      <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
      </div>
      </div>
        <div id="chart" />
    </div>
      );
    }
  }

export default Child1;