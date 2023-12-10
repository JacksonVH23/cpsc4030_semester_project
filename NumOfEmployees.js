(function() {
    function createnumOfEmployeesVisualization(originalWidth, originalHeight, isExpanded) {

        // Update the button font size based on the visualization state
        const buttonFontSize = isExpanded ? "10px" : "7px";
        d3.select("#numOfEmployeesToggleButton").style("font-size", buttonFontSize);

        // Load the data from the CSV file
        d3.csv("cleaned_dataset.csv").then(function(data) {

            data = data.filter(function (d) {
                return d['Number of Employees'].toLowerCase() !== 'unknown';
            });

            // Function to parse 'Number of Employees' to a numerical format
            function parsenumOfEmployees(numOfEmployees) {
                // Check if the string contains a '+'
                if (numOfEmployees.includes('+')) {
                    // If yes, return 10000
                    return 10000;
                }
                const range = numOfEmployees.split(' ')[0].split('-').map(Number);
                return Math.floor((range[0] + range[1]) / 2);
            }   

            // Convert 'Number of Employees' to numeric values
            data.forEach(function (d) {
                // Assuming the 'Number of Employees' is in the format "1-50 Employees" or "10000+ Employees"
                d.numOfEmployees = parsenumOfEmployees(d['Number of Employees']);
                // Assuming 'Quality Score' is a numeric value
                d.qualityScore = +d['Quality Score'];
            });

            data.sort((a, b) => a.numOfEmployees - b.numOfEmployees);

            // Create the graph
            // Update the margins based on the state (expanded or collapsed)
            const margin = (isExpanded == false)
                ? { top: originalHeight / 7, right: originalWidth / 20, bottom: originalHeight / 5.8, left: originalWidth / 10 }
                : { top: originalHeight / 9, right: originalWidth / 32, bottom: originalHeight / 6, left: originalWidth / 10 };
            const width = originalWidth - margin.left - margin.right;
            const height = originalHeight - margin.top - margin.bottom;

            const svg = d3.select("#visualization-numOfEmployees-container")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("border", "2px solid black") // Add black border
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

            // Add a title to the visualization
            const title = "Effect of Company Size on Job Quality";
            const titleFontSize = isExpanded ? "18px" : "12px"
            const titleMargin = isExpanded ? -20 : -30
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", margin.top / 2 + titleMargin)
                .attr("text-anchor", "middle")
                .style("font-size", titleFontSize)
                .style("font-weight", "bold")
                .style("fill", "#DCDCDC")
                .style("text-decoration", "underline")
                .text(title);

            // Show the Y scale
            const ytickFont = isExpanded ? "13px" : "10px"
            var y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.qualityScore)])
                .range([height, 0]);
            svg.append("g")
                .call(d3.axisLeft(y))
                .selectAll("text")
                .style("fill", "#DCDCDC")
                .style("font-size", ytickFont)

            // Show the X scale
            const xtickFont = isExpanded ? "13px" : "10px"
            var x = d3.scaleBand()
                .domain(data.map(d => d.numOfEmployees))
                .range([0, width])
                .padding(0.1);
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .selectAll("text")
                .style("fill", "#DCDCDC")
                .style("font-size", xtickFont)

            // Add Y axis label
            const yLabelFont = isExpanded ? "17px" : "13px"
            const yLabelMargin = isExpanded ? 20 : 10
            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", yLabelMargin - margin.left)
                .attr("x", 0 - height / 2)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", yLabelFont)
                .style("font-weight", "bold")
                .style("fill", "#DCDCDC")
                .text("Quality Score");

            // Add X axis label
            const xLabelFont = isExpanded ? "16px" : "12px"
            const xLabelMargin = isExpanded ? 1.35 : 1.3
            svg.append("text")
                .attr("transform", "translate(" + (width / 2) + " ," + (margin.bottom/xLabelMargin + height) + ")")
                .style("text-anchor", "middle")
                .style("font-size", xLabelFont)
                .style("font-weight", "bold")
                .style("fill", "#DCDCDC")
                .text("Number of Employees");

            // Create the box plot components
            const boxWidth = 20; // Adjust the box width as needed
            const boxColor = "rgb(215, 152, 103)";

            // Group the data by 'numOfEmployees'
            const nestedData = d3.nest()
            .key(d => d.numOfEmployees)
            .entries(data);

            // Create the box plot for each group
            svg.selectAll(".box")
                .data(nestedData)
                .enter()
                .append("g")
                .attr("transform", d => "translate(" + (x(d.key) + x.bandwidth() / 2) + ",0)")
                .each(function (d) {
                const values = d.values.map(v => v.qualityScore).sort(d3.ascending);

                const q1 = d3.quantile(values, 0.25);
                const median = d3.quantile(values, 0.5);
                const q3 = d3.quantile(values, 0.75);
                const iqr = q3 - q1;
                const min = q1 - 1.5 * iqr
                const max = q1 + 1.5 * iqr

                // Create the main line
                d3.select(this).append("line")
                    .attr("class", "median")
                    .attr("x1", 0)
                    .attr("x2", 0)
                    .attr("y1", y(min))
                    .attr("y2", y(max))
                    .style("stroke", "black");

                // Create the box
                let box = d3.select(this).append("rect")
                    .attr("class", "box")
                    .attr("width", boxWidth)
                    .attr("height", y(q1) - y(q3))
                    .attr("x", -boxWidth / 2)
                    .attr("y", y(q3))
                    .style("fill", boxColor)
                    .style("stroke", "black")

                // Create the median line
                d3.select(this).append("line")
                    .attr("class", "median")
                    .attr("x1", -boxWidth / 2)
                    .attr("x2", boxWidth / 2)
                    .attr("y1", y(median))
                    .attr("y2", y(median))
                    .style("stroke", "black");

                // Create the whiskers
                // Upper whisker
                d3.select(this).append("line")
                    .attr("class", "whisker")
                    .attr("x1", -boxWidth / 2)
                    .attr("x2", boxWidth / 2)
                    .attr("y1", y(max))
                    .attr("y2", y(max))
                    .style("stroke", "black");

                // Lower whisker
                d3.select(this).append("line")
                    .attr("class", "whisker")
                    .attr("x1", -boxWidth / 2)
                    .attr("x2", boxWidth / 2)
                    .attr("y1", y(min))
                    .attr("y2", y(min))
                    .style("stroke", "black");

                // Calculate the upper and lower whisker positions
                const upperWhisker = Math.min(max, d3.max(values));
                const lowerWhisker = Math.max(min, d3.min(values));

                // Create the invisible rect spanning from the upper whisker to the lower whisker
                hoverbox = d3.select(this).append("rect")
                    .attr("class", "whisker-rect")
                    .attr("width", boxWidth)
                    .attr("height", y(lowerWhisker) - y(upperWhisker))
                    .attr("x", -boxWidth / 2)
                    .attr("y", y(upperWhisker))
                    .style("opacity", 0); // Make it invisible

                // Add event listeners for interactivity
                hoverbox.on("mouseover", handleMouseOver)
                .on("mousemove", handleMouseMove) // Add mousemove event listener
                .on("mouseout", handleMouseOut);

                // Function to handle mouseover event
                function handleMouseOver(d, i) {
                    const info = `Median: ${median.toFixed(2)}\n1st Quartile: ${q1.toFixed(2)}\nThird Quartile: ${q3.toFixed(2)}\nMinimum: ${min.toFixed(2)}\nMaximum: ${max.toFixed(2)}`;

                    // Get the position of the current box element
                    const boxPosition = this.getBoundingClientRect();
                    const containerPosition = document.getElementById("visualization-numOfEmployees-container").getBoundingClientRect();

                    // Calculate the position of the tooltip relative to the container
                    const tooltipX = boxPosition.left - containerPosition.left + boxPosition.width / 2;
                    const tooltipY = boxPosition.top - containerPosition.top;

                    // Append a tooltip element inside a grey rectangle and position it
                    const tooltip = svg.append("g")
                        .attr("class", "tooltip")
                        .attr("transform", `translate(${tooltipX}, ${tooltipY})`);

                    // Calculate the width and height of the tooltip box dynamically based on the text content
                    const lines = info.split('\n');
                    let maxLineWidth = 0;
                    lines.forEach(line => {
                        // Append a temporary text element to calculate the length
                        const tempText = tooltip.append("text")
                            .text(line)
                            .style("font-size", "10px")
                            .style("font-weight", "bold")
                            .style("visibility", "hidden"); // Make it invisible

                        // Get the computed text length
                        const lineWidth = tempText.node().getComputedTextLength();

                        // Check if this line has the maximum width so far
                        if (lineWidth > maxLineWidth) {
                            maxLineWidth = lineWidth;
                        }

                        // Remove the temporary text element
                        tempText.remove();
                    })
                    const textHeight = lines.length * 12;

                    // Append a rect for the border
                    tooltip.append("rect")
                        .attr("width", maxLineWidth + 12)  // Add margin on both sides
                        .attr("height", textHeight + 10)  // Add margin on both top and bottom
                        .attr("fill", "none")  // No fill color
                        .attr("stroke", "black")  // Border color
                        .attr("stroke-width", 2);  // Border width

                    // Append a rect for the background
                    tooltip.append("rect")
                        .attr("width", maxLineWidth + 12)  // Add margin on both sides
                        .attr("height", textHeight + 10)  // Add margin on both top and bottom
                        .attr("fill", "#a9a9a9");  // Grey color

                    // Append text elements for each line
                    tooltip.selectAll(".tooltip-text")
                        .data(lines)
                        .enter().append("text")
                        .attr("x", 5.5)
                        .attr("y", (d, i) => 15 + i * 12)
                        .style("font-size", "10px")
                        .style("font-weight", "bold")
                        .style("fill", "white")
                        .text(d => d)
                        .attr("class", "tooltip-text");

                    // Change the color of the box to a lighter green when hovered
                    box.style("fill", "#CC7722");
                }

                // Function to handle mousemove event
                // Assume initialContainerWidth is the original width of the container
                function handleMouseMove(d, i) {
                    // Get the existing tooltip
                    const tooltip = svg.select(".tooltip");

                    if (!tooltip.empty()) {
                        // Get the position of the current mouse cursor
                        const mouseX = d3.event.pageX;
                        const mouseY = d3.event.pageY;

                        // Get the position of the container element
                        const containerPosition = document.getElementById("visualization-numOfEmployees-container").getBoundingClientRect();

                        // Calculate the position of the tooltip relative to the container
                        let tooltipX = mouseX - containerPosition.left;
                        const tooltipY = mouseY - containerPosition.top;

                        // Get the dimensions of the tooltip
                        const tooltipRect = tooltip.select("rect").node().getBoundingClientRect();

                        // Calculate automatic offsets
                        const offsetX = isExpanded ? tooltipRect.width / 2.5 : tooltipRect.width / 3.8
                        const offsetY = tooltipRect.height + 23; // Adjust this value based on the desired vertical offset

                        // Check if the tooltip exceeds the right boundary
                        if (tooltipX + offsetX + tooltipRect.width > containerPosition.width) {
                            // Swap the tooltip to the left side
                            isExpanded ? tooltipX = tooltipX + offsetX + tooltipRect.width - containerPosition.width / (2.7 * 1.55) : tooltipX = tooltipX + offsetX + tooltipRect.width - containerPosition.width / 2.7;
                            tooltip.attr("transform", `translate(${tooltipX - offsetX*4.5}, ${tooltipY - offsetY})`);
                        } else {
                            isExpanded ? tooltip.attr("transform", `translate(${tooltipX - offsetX/1.3}, ${tooltipY - offsetY})`) : tooltip.attr("transform", `translate(${tooltipX - offsetX/(1.5)}, ${tooltipY - offsetY})`)
                        }   
                    }
                }

                // Function to handle mouseout event
                function handleMouseOut() {
                    // Remove the tooltip element when the mouse leaves the bar
                    svg.select(".tooltip").remove();

                    box.style("fill", boxColor);

                }

            });


        });
    }

    // Call the function with initial dimensions
    let isVisualizationExpanded = false;
    const originalWidth = 500;
    const originalHeight = originalWidth/2;
    createnumOfEmployeesVisualization(originalWidth, originalHeight, false);

    // Add event listener to the button
    document.getElementById('numOfEmployeesToggleButton').addEventListener('click', function () {
        if (isVisualizationExpanded) {
            // Collapse visualization
            document.getElementById('numOfEmployeesToggleButton').textContent = 'Expand Visualization'; 
            // Remove existing visualization
            d3.select("#visualization-numOfEmployees-container").select("svg").remove();
            d3.select("#visualization-2-container").style("z-index", "1");
            createnumOfEmployeesVisualization(originalWidth, originalHeight, false);
        } else {
            // Expand visualization
            document.getElementById('numOfEmployeesToggleButton').textContent = 'Collapse Visualization';
            const newWidth = originalWidth * 1.4;
            const newHeight = originalHeight * 1.4;
            // Remove existing visualization
            d3.select("#visualization-numOfEmployees-container").select("svg").remove();
            d3.select("#visualization-2-container").style("z-index", "2");
            createnumOfEmployeesVisualization(newWidth, newHeight, true);
        }

        // Toggle the state
        isVisualizationExpanded = !isVisualizationExpanded;
    });
})();