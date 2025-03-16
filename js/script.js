const margin = { top: 80, right: 60, bottom: 60, left: 100 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;
let allData = [];
let xScale, yScale;
let xVar = "elevation",
    yVar = "TAVG",
    targetDate = 20170101;
const state = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "PR"
]; 
const colorScale = d3.scaleOrdinal(state, d3.schemeSet2);
const options = ["latitude", "longitude", "elevation", "TMIN", "TMAX", "TAVG", "PRCP", "AWND", "WSF5"];
const t = 1000;
let currentState = state[0];


const svg = d3
    .select("#vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

function init() {

    d3.csv(
        "./data/data.json",
        function (d) {
            return {
                station: d.station,
                state: d.state,
                date: d.date,
                latitude: +d.latitude,
                longitude: +d.longitude,
                elevation: +d.elevation,
                TMIN: +d.TMIN,
                TMAX: +d.TMAX,
                TAVG: +d.TAVG,
                AWND: +d.AWND,
                PRCP: +d.PRCP,
                SNOW: +d.SNOW,
                SNWD: +d.SNWD,
                WSF5: +d.WSF5,
                WDF5: +d.WDF5
            };
        }
    )
        .then((data) => {
            allData = data
            setupSelector()
            setupSlider()
            updateAxes()
            updateVis(state[0])
        })
}

function setupSlider() {
    const formatDate = d => {
        const dateString = d.toString();
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);

        const date = new Date(2017, month - 1, day);
        return d3.timeFormat("%b %d")(date);
    };

    const minDate = 20170101;
    const maxDate = 20171231;

    const sliderDiv = d3.select("#slider");
    sliderDiv.html("");

    sliderDiv.append("h4").text("Select Date (All Data Is From 2017):").style("margin-bottom", "5px");
    sliderDiv
        .append("span")
        .attr("id", "current-date")
        .text(formatDate(targetDate))
        .style("font-weight", "bold")
        .style("margin-right", "10px");

    const slider = d3
        .sliderBottom()
        .min(minDate)
        .max(maxDate)
        .step(1)
        .width(width - 100)
        .tickFormat(formatDate)
        .tickValues([
            20170101, 20170201, 20170301, 20170401, 20170501, 20170601,
            20170701, 20170801, 20170901, 20171001, 20171101, 20171201
        ])
        .default(targetDate)
        .on("onchange", val => {
            targetDate = val;
            d3.select("#current-date").text(formatDate(val));
            updateVis(d3.select("#State").property("value"));
        });

    sliderDiv
        .append("svg")
        .attr("width", width)
        .attr("height", 70)
        .append("g")
        .attr("transform", "translate(50,30)")
        .call(slider);
}




function setupSelector() {
    const variableLabels = {
        TMIN: "Minimum Temp",
        TMAX: "Maximum Temp",
        TAVG: "Avg Temp",
        AWND: "Avg Wind Speed",
        WSF5: "Fastest Wind Speed",
        PRCP: "Precipitation",
        elevation: "Elevation",
        latitude: "Latitude",
        longitude: "Longitude"
    };

    d3.selectAll(".variable")
        .filter(function () {
            return this.id !== "State";
        })
        .each(function () {
            d3.select(this)
                .selectAll("option")
                .data(options)
                .enter()
                .append("option")
                .text((d) => variableLabels[d])
                .attr("value", (d) => d);
        })
        .on("change", function () {
            let selectedId = d3.select(this).property("id");
            let selectedValue = d3.select(this).property("value");

            if (selectedId === "xVariable") {
                xVar = selectedValue;
            } else if (selectedId === "yVariable") {
                yVar = selectedValue;
            }

            updateAxes();
            updateVis(currentState);
        });

    let stateDropdown = d3.select("#State");
    stateDropdown.selectAll("option").remove();

    stateDropdown
        .selectAll("option")
        .data(state)
        .enter()
        .append("option")
        .text((d) => d)
        .attr("value", (d) => d);

    stateDropdown.on("change", function () {
        currentState = d3.select(this).property("value");
        updateVis(currentState);
    });

    d3.select("#xVariable").property("value", xVar);
    d3.select("#yVariable").property("value", yVar);
    d3.select("#State").property("value", currentState);
}



function updateAxes() {
    svg.selectAll(".axis").remove();
    svg.selectAll(".labels").remove();

    const variableLabels = {
        TMIN: "Minimum Temperature (°C)",
        TMAX: "Maximum Temperature (°C)",
        TAVG: "Average Temperature (°C)",
        AWND: "Average Wind Speed (m/s)",
        WSF5: "Fastest Wind Speed (m/S)",
        PRCP: "Precipitation (MM)",
        elevation: "Elevation (M)",
        latitude: "Latitude (°)",
        longitude: "Longitude (°)"
    };

    const xMin = d3.min(allData, (d) => d[xVar]);
    const xMax = d3.max(allData, (d) => d[xVar]);
    xScale = d3.scaleLinear()
        .domain([xMin, xMax])
        .range([0, width]);

    const yMin = d3.min(allData, (d) => d[yVar]);
    const yMax = d3.max(allData, (d) => d[yVar]);
    yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);


    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height})`)
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis")
        .call(yAxis);

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .text(variableLabels[xVar])
        .attr("class", "labels");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 40)
        .attr("text-anchor", "middle")
        .text(variableLabels[yVar])
        .attr("class", "labels");
}


function updateVis(selectedState) {
    const targetMonthDay = targetDate.toString().substring(4);

    let currentData = allData.filter((d) => {
        const dateStr = d.date.toString();
        const monthDay = dateStr.substring(4);
        return d.state === selectedState && monthDay === targetMonthDay;
    });

    if (currentData.length === 0) {
        currentData = allData.filter((d) => d.state === selectedState);
    }


    let stationNames = [...new Set(currentData.map((d) => d.station))];
    colorScale.domain(stationNames);

    let circles = svg.selectAll(".points").data(currentData, (d) => d.station);

    circles
        .enter()
        .append("circle")
        .attr("class", "points")
        .attr("cx", (d) => xScale(d[xVar]))
        .attr("cy", (d) => yScale(d[yVar]))
        .style("fill", (d) => colorScale(d.station))
        .style("opacity", 0.7)
        .attr("r", 8)
        .on("mouseover", function (event, d) {
            d3.select(this).style("stroke", "black").style("stroke-width", "3px");

            d3.select("#tooltip")
                .style("display", "block")
                .html(`<strong>Station:</strong> ${d.station}`);
        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
            d3.select(this).style("stroke", "none").style("stroke-width", "0px");

            d3.select("#tooltip").style("display", "none");
        });

    circles
        .transition()
        .duration(1000)
        .attr("cx", (d) => xScale(d[xVar]))
        .attr("cy", (d) => yScale(d[yVar]))
        .style("fill", (d) => colorScale(d.station));

    circles.exit().transition().duration(1000).attr("r", 0).remove();

    updateLegend(stationNames);
}


function updateLegend(stationNames) {
    svg.selectAll(".legend").remove();

    const size = 10;
    const itemsPerRow = 3;
    const horizontalSpacing = width / itemsPerRow;
    const verticalSpacing = 20;

    const numRows = Math.ceil(stationNames.length / itemsPerRow);
    const legendHeight = numRows * verticalSpacing + 20;

    const paddingBelowAxis = 40;

    d3.select("#vis svg")
        .attr("height", height + margin.top + margin.bottom + legendHeight + paddingBelowAxis);

    let legend = svg
        .selectAll(".legend")
        .data(stationNames)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => {
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            return `translate(${col * horizontalSpacing}, ${height + row * verticalSpacing + paddingBelowAxis + 30})`;
        });

    legend
        .append("rect")
        .attr("width", size)
        .attr("height", size)
        .style("fill", (d) => colorScale(d))

    legend
        .append("text")
        .attr("x", size + 5)
        .attr("y", size)
        .style("fill", "#000")
        .text((d) => d)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .on("mouseover", function (event, station) {
            svg.selectAll(".points")
                .style("opacity", 0.1);

            svg.selectAll(".points")
                .filter((d) => d.station === station)
                .style("opacity", 1)
                .attr("r", 10)
                .style("stroke", "black")

        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", event.pageX + 15 + "px")
                .style("top", event.pageY - 10 + "px");
        })
        .on("mouseout", function () {
            svg.selectAll(".points")
                .style("opacity", 0.7)
                .attr("r", 8)
                .style("stroke", "none");

            d3.select("#tooltip").style("display", "none");
        });
}

