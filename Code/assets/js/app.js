// setup svg demensions
var svgWidth = 960;
var svgHeight = 500;

// setup chart margins
var margin = {
  top: 60,
  right: 60,
  bottom: 120,
  left: 150
};

// setup chart area demensions
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;

// select id from html, append svg and add demensions
var svg = d3.select("#scatter")
  .append("svg")
  .classed("chart", true)
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// shift everything over by the margins
var chartGroup = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// setup parameters, chart data and setup axes labels
var acsData = null;
var chosenXAxis = "poverty";
var chosenYAxis = "obesity";
var xAxisLabels = ["poverty", "age", "income"];
var yAxisLabels = ["obesity", "smokes", "healthcare"];
var labelsTitle = { "poverty": "In Poverty (%)", 
                    "age": "Age (Median)", 
                    "income": "Household Income (Median)",
                    "obesity": "Obese (%)", 
                    "smokes": "Smokes (%)", 
                    "healthcare": "Lacks Healthcare (%)" };
var axisPadding = 20;

// setup function for xy-scale axis label text when clicked
function scale(acsData, chosenAxis, xy) {
    var axisRange = (xy === "x") ? [0, chartWidth]:[chartHeight, 0]
    
    // create axis scales
    var linearScale = d3.scaleLinear()
      .domain([d3.min(acsData, d => d[chosenAxis]) * 0.8,
        d3.max(acsData, d => d[chosenAxis]) * 1.2
      ])
      .range(axisRange);
  
    return linearScale;
}

// setup function for updating xyAxis var upon click on axis label text
function renderAxis(newScale, Axis, xy) {
    var posAxis = (xy === "x") ? d3.axisBottom(newScale):d3.axisLeft(newScale)
  
    // setup transition between xy-axis change
    Axis.transition()
      .duration(1000)
      .call(posAxis);
  
    return Axis;
}

// setup function used for updating circles group with transition
function renderCircles(elemEnter, newScale, chosenAxis, xy) {

    // setup transition of circles rendering
    elemEnter.selectAll("circle")
        .transition()
        .duration(1000)
        .attr(`c${xy}`, d => newScale(d[chosenAxis]));
    // setup transition of text rendering
    elemEnter.selectAll("text")
        .transition()
        .duration(1000)
        .attr(`d${xy}`, d => newScale(d[chosenAxis]));
  
    return elemEnter;
}

// setup function updating circles group with new tooltip
function updateToolTip(chosenXAxis, chosenYAxis, elemEnter) {
    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-8, 0])
        .html(d => `${d.state} <br>${chosenXAxis}: ${d[chosenXAxis]} <br>${chosenYAxis}: ${d[chosenYAxis]}`);
    
    svg.call(tool_tip);

    // hover events
    elemEnter.classed("active inactive", true)
    .on('mouseover', tool_tip.show)
    .on('mouseout', tool_tip.hide);
   
    return elemEnter;
}

// function update the scatter chart based on the selected axis label change
function updateChart() {
    // setup value of chosen axis label
    var value = d3.select(this).attr("value");
    // setup x or y axis for the value of choice
    var xy = xAxisLabels.includes(value) ? "x":"y";
    // setup element enter
    var elemEnter = d3.selectAll("#elemEnter");
    // get the xAxis or yAxis tag object
    var axis = (xy==="x") ? d3.select("#xAxis"):d3.select("#yAxis");
    //  select chosenAxis
    chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;

    if (value !== chosenAxis) {
        // replace chosenAxis with selected value
        if(xy === "x") {
            chosenXAxis = value;
        }
        else {
            chosenYAxis = value;
        };

        // chosenAxis update
        chosenAxis = (xy === "x") ? chosenXAxis:chosenYAxis;
        // xy scale update for new data
        linearScale = scale(acsData, chosenAxis, xy);
        // axis updates with transition
        axis = renderAxis(linearScale, axis, xy);
        // circles updates with new axis values
        elemEnter = renderCircles(elemEnter, linearScale, chosenAxis, xy);
        // tooltip updates with new info
        elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
        // chosen axis Labels parsing, reset active and inactive
        axisLabels = (xy === "x") ? xAxisLabels:yAxisLabels
        axisLabels.forEach(label => {
            if(label === value) {
                // text labels
                d3.select(`[value=${label}]`).classed("active", true);
                d3.select(`[value=${label}]`).classed("inactive", false);
                // switch rect axis
                d3.select(`[value=${xy+label}]`).classed("invisible", true);
            }
            else { // text labels    
                d3.select(`[value=${label}]`).classed("active", false);
                d3.select(`[value=${label}]`).classed("inactive", true);
                // switch rect axis
                d3.select(`[value=${xy+label}]`).classed("invisible", false);
            }
        });
    };
}

// function updates the axis labels tooptip on the rect tag
function updateLabelsTooltip(xy, labelEnter) {
    // reverse xy for move to opposite axis
    xy = (xy === "x") ? "y":"x";
    // add tooltip to the rect tag
    var tool_tip = d3.tip()
        .attr("class", "d3-tip")
        .offset([-10, 0])
        .html(d => `Move ${d} to ${xy}-axis`);
    
    svg.call(tool_tip);
    // add the event handlers
    labelEnter.classed("active inactive", true)
    .on('mouseenter', tool_tip.show)
    .on('mouseleave', tool_tip.hide)
    .on('mousedown', tool_tip.hide);

    return labelEnter;
}

// setup function to update rect tag into axis label group
function updateLabelsRect(xy, xPos, labelsRect) {
    // square size
    var squareSize = 12;
    // setup chosenAxis by xy
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    // setup rect tag
    var enterlabelsRect = null;
    // rect tag appending
    enterlabelsRect = labelsRect.enter()
        .append("rect")
        .merge(labelsRect)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding-squareSize)
        .attr("width", squareSize)
        .attr("height", squareSize)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenAxis) ? true:false)
        .attr("value", d => xy+d)
        .on("click", updateLabel);;

    // setup enter to append tooltip
    return enterlabelsRect;
}

// setup update function for text tag into axis label group
function updateLabelsText(xy, xPos, labelsText) {
    // setup chosenAxis by xy
    var chosenAxis = (xy === "x") ? chosenXAxis : chosenYAxis;
    // change text tag
    var enterlabelsText = null; labelsText.enter()
                                    .append("text");
    // change text tag
    enterlabelsText = labelsText.enter()
        .append("text")
        .merge(labelsText)
        .attr("x", xPos)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d) // value to grab for event listener
        .classed("active", d => (d === chosenAxis) ? true:false)
        .classed("inactive", d => (d === chosenAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);
}

// function updates the axis labels after moving one of the axes
function updateLabel() {
    // get move value of selection and slice it for the xy axis and axis label value
    var moveLabel = d3.select(this).attr("value");
    var oldAxis = moveLabel.slice(0,1);
    var selectedLabel = moveLabel.slice(1);

    // move axis labels to the other axes
    if (oldAxis === "x") {
        // remove label from x-axis labels
        xAxisLabels = xAxisLabels.filter(d => d !== selectedLabel);
        // add labels to yLabels labels
        yAxisLabels.push(selectedLabel);
    } 
    else {
        // remove label from y-axis labels
        yAxisLabels = yAxisLabels.filter(d => d !== selectedLabel);
        // add label to xLabels labels
        xAxisLabels.push(selectedLabel);
    }

    // update x axis labels group of rect + text
    var xLabels = d3.select("#xLabels");
    // append the rect for move labels
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels);
    // update labels rect tags
    xEnterLabelsRect = updateLabelsRect("x", -120, xLabelsRect);
    // update tooptip on rect
    updateLabelsTooltip("x", xEnterLabelsRect);
    // remove old labels rect
    xLabelsRect.exit().remove();
    // append the text for the x-axis labels
    var xLabelsText = xLabels.selectAll("text")
        .data(xAxisLabels);
    // update labels text
    updateLabelsText("x", 0, xLabelsText);
    // remove excess old data
    xLabelsText.exit().remove();
    // group update for y axis labels group of rect + text
    var yLabels = d3.select("#yLabels");
    // append the rect for move labels
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    // update labels rect tags
    yEnterLabelsRect = updateLabelsRect("y", -45, yLabelsRect);
    // update tooptip on rect tags
    updateLabelsTooltip("y", yEnterLabelsRect);
    // remove old labels rect tags
    yLabelsRect.exit().remove();
    // append the text for the x-axis labels
    var yLabelsText = yLabels.selectAll("text")
        .data(yAxisLabels);
    // update labels text tag
    updateLabelsText("y", margin.top, yLabelsText);
    // remove excess old data
    yLabelsText.exit().remove();
}

// function initialize the chart elements
function init() {
    // variable radius for circle
    var r = 10;
    // setup initial x and y linear scales
    var xLinearScale = scale(acsData, chosenXAxis, "x");
    var yLinearScale = scale(acsData, chosenYAxis, "y");

    // setup initial axis
    var bottomAxis = d3.axisBottom(xLinearScale);
    var leftAxis = d3.axisLeft(yLinearScale);

    // append x axis
    var xAxis = chartGroup.append("g")
        .classed("axis", true)
        .attr("transform", `translate(0, ${chartHeight})`)
        .attr("id", "xAxis")
        .call(bottomAxis);

    // append y axis
    var yAxis = chartGroup.append("g")
      .classed("axis", true)
      .attr("id", "yAxis")
      .call(leftAxis);
      
    // setup data for the circles + text
    var elem = chartGroup.selectAll("g circle")
        .data(acsData);
 
    // setup and place "blocks" containing circles and text  
    var elemEnter = elem.enter()
        .append("g")
        .attr("id", "elemEnter");
    
    // setup the circle for each block
    elemEnter.append("circle")
        .attr('cx', d => xLinearScale(d[chosenXAxis]))
        .attr('cy', d => yLinearScale(d[chosenYAxis]))
        .attr('r', r)
        .classed("stateCircle", true);
    
    // setup text for circles
    elemEnter.append("text")
        .attr("dx", d => xLinearScale(d[chosenXAxis]))
        .attr("dy", d => yLinearScale(d[chosenYAxis]))
        .classed("stateText", true)
        .attr("font-size", parseInt(r*0.8))
        .text(d => d.abbr);
  
    // setup group for xLabels/x-axis labels
    var xLabels = chartGroup.append("g")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`)
        .classed("atext", true)
        .attr("id", "xLabels");
    // setup rect for x-axis move labels
    var xLabelsRect = xLabels.selectAll("rect")
        .data(xAxisLabels)
    var enterXLabelsRect = xLabelsRect.enter()
        .append("rect")
        .attr("x", -120)
        .attr("y", (d,i) => (i+1)*axisPadding-12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenXAxis) ? true:false)
        .attr("value", d => "x"+d)
        .on("click", updateLabel);
    // update tooptip on rect
    updateLabelsTooltip("x", enterXLabelsRect);
    // setup x-axis label text and set event listener value
    xLabels.selectAll("text")
        .data(xAxisLabels)
        .enter()
        .append("text")
        .attr("x", 0)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d)
        .classed("active", d => (d === chosenXAxis) ? true:false)
        .classed("inactive", d => (d === chosenXAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);

    // y-axis labels groups
    var yLabels = chartGroup.append("g")
        .attr("transform", `rotate(-90 ${(margin.left/2)} ${(chartHeight/2)+60})`)
        .classed("atext", true)
        .attr("id", "yLabels");
    // y-axis move label rect
    var yLabelsRect = yLabels.selectAll("rect")
        .data(yAxisLabels);
    var enterYLabelsRect = yLabelsRect.enter()
        .append("rect")
        .attr("x", -45)
        .attr("y", (d,i) => (i+1)*axisPadding-12)
        .attr("width", 12)
        .attr("height", 12)
        .classed("stateRect", true)
        .classed("invisible", d => (d === chosenYAxis) ? true:false)
        .attr("value", d => "y"+d)
        .on("click", updateLabel);
    // update tooltip on rect
    updateLabelsTooltip("y", enterYLabelsRect);
    // y-axis label text
    yLabels.selectAll("text")
        .data(yAxisLabels)
        .enter()
        .append("text")
        .attr("x", margin.top)
        .attr("y", (d,i) => (i+1)*axisPadding)
        .attr("value", d => d)
        .classed("active", d => (d === chosenYAxis) ? true:false)
        .classed("inactive", d => (d === chosenYAxis) ? false:true)
        .text(d => labelsTitle[d])
        .on("click", updateChart);

    // updateToolTip function
    var elemEnter = updateToolTip(chosenXAxis, chosenYAxis, elemEnter);
};

// data load from csv
d3.csv("/assets/data/data.csv").then((data, error) => {
    // throw out errors
    if (error) throw error;
  
    // set data values to ints
    data.forEach(d => {
      d.poverty = +d.poverty;
      d.age = +d.age;
      d.income = +d.income;
      d.obesity = +d.obesity;
      d.healthcare = +d.healthcare;
      d.smokes = +d.smokes;
    });

    // load into acsData
    acsData = data;
    // init my chart
    init();
});