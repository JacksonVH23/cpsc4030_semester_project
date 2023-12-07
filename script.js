// Example D3 code
const svg = d3.select("#visualization-container")
    .append("svg")
    .attr("width", 500)
    .attr("height", 300);

svg.append("circle")
    .attr("cx", 250)
    .attr("cy", 150)
    .attr("r", 50)
    .style("fill", "blue");
