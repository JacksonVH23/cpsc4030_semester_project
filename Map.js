(function() {
    function createMapVisualization(originalWidth, originalHeight) {

        // Load the data from the CSV file
        d3.csv("cleaned_dataset.csv").then(function(data) {

            // Process the data to count job listings for each state
            const stateCounts = {};
            // Convert 'Number of Employees' to numeric values
            data.forEach(function (d) {
                d.companyLocation = d['Company Location'];

                // Check if the state is already present in stateCounts
                if (!stateCounts[d.companyLocation]) {
                    stateCounts[d.companyLocation] = 1; // If not present, add it with an initial count of 1
                } else {
                    stateCounts[d.companyLocation]++; // If already present, increment the count
                }
            });

            // Convert 'Number of Employees' to numeric values
            data.forEach(function (d) {
                d.count = stateCounts[d.companyLocation]
            });

            // Convert stateCounts to an array of objects
            const stateCountsArray = Object.entries(stateCounts).map(([state, count]) => ({ state, count }));

            // Sort the array based on the count in descending order
            stateCountsArray.sort((a, b) => b.count - a.count);

            // Create the graph
            // Update the margins based on the state (expanded or collapsed)
            const margin = { top: originalHeight / 7, right: originalWidth / 20, bottom: originalHeight / 5.8, left: originalWidth / 10 }
            const width = originalWidth - margin.left - margin.right;
            const height = originalHeight - margin.top - margin.bottom;

            const svg = d3.select("#visualization-map-container")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .style("border", "2px solid black") // Add black border
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

            // Add a title to the visualization
            const title = "Common Locations of Data Analyst Jobs";
            const titleFontSize = "23px"
            const titleMargin = -90
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", margin.top / 1.5 + titleMargin)
                .attr("text-anchor", "middle")
                .style("font-size", titleFontSize)
                .style("font-weight", "bold")
                .style("fill", "#DCDCDC")
                .style("text-decoration", "underline")
                .text(title);

            // Add the image to the visualization
            const imageWidth = width*1.2; // Set the width of the image
            const imageHeight = height*1.2; // Set the height of the image
            const imageURL = "usmap.png"; // Specify the path to your image file

            svg.append("svg:image")
                .attr("xlink:href", imageURL)
                .attr("x", width / 2 - imageWidth / 1.95) // Adjust the x-position as needed
                .attr("y", height / 2 - imageHeight / 2.4) // Adjust the y-position as needed
                .attr("width", imageWidth)
                .attr("height", imageHeight);

            // Define a mapping of states to coordinates
            const stateCoordinates = {
                'NY': { x: 510, y: 100 },
                'NJ': { x: 532, y: 140 },
                'CA': { x: 16, y: 190 },
                'TX': { x: 260, y: 305 },
                'IL': { x: 370, y: 170 },
                'PA': { x: 495, y: 140 },
                'AZ': { x: 105, y: 247 },
                'NC': { x: 495, y: 220 },
                'CO': { x: 185, y: 185 },
                'WA': { x: 45, y: 35 },
                'VA': { x: 495, y: 190 },
                'OH': { x: 440, y: 160 },
                'UT': { x: 115, y: 175 },
                'FL': { x: 482, y: 330 },
                'IN': { x: 405, y: 170 }
            };

            // Draw circles based on stateCounts
            const circleScale = d3.scalePow()
                .exponent(0.5)  // Experiment with different exponent values
                .domain([0, d3.max(Object.values(stateCounts))])
                .range([0, 50]); // Adjust the range as needed

            const circleColor = "rgb(215, 152, 103)";

            Object.entries(stateCounts).forEach(([state, count]) => {
                // Check if the state is in the mapping
                if (stateCoordinates[state]) {
                    const { x, y } = stateCoordinates[state];
                    const radius = circleScale(count);

                    svg.append("circle")
                        .attr("class", state)
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", radius)
                        .style("fill", circleColor)
                        .style("opacity", 0.8);
                }
            });

            // Define a function to darken a given color
            function darkenColor(color, factor) {
                const rgbValues = color.match(/\d+/g).map(Number);
                const darkenedValues = rgbValues.map(value => Math.max(0, value - factor));
                return `rgb(${darkenedValues.join(', ')})`;
            }

            circles = svg.selectAll("circle")

            // Add event listeners for interactivity
            circles.on("mouseover", handleMouseOver)
                   .on("mousemove", handleMouseMove)
                   .on("mouseout", handleMouseOut);

            // Function to handle mouseover event
            function handleMouseOver(d, i) {
                // Select the hovered circle
                const hoveredCircle = d3.select(this);

                // Get the current radius
                const currentRadius = parseFloat(hoveredCircle.attr("r"));

                // Increase the radius by a small factor (e.g., 10%)
                const newRadius = currentRadius * 1.1;

                // Darken the color by subtracting a small amount from each RGB component
                const darkerColor = darkenColor(circleColor, 15);

                // Apply the transition to smoothly change the radius, color, and opacity
                hoveredCircle.transition()
                    .duration(100)  // You can adjust the duration as needed
                    .attr("r", newRadius)
                    .style("fill", darkerColor)
                    .style("opacity", 0.9); // Adjust opacity as needed

                const state = hoveredCircle.attr("class")

                const stateMappings = {
                    'CA': 'California',
                    'NY': 'New York',
                    'NJ': 'New Jersey',
                    'TX': 'Texas',
                    'IL': 'Illinois',
                    'PA': 'Pennsylvania',
                    'AZ': 'Arizona',
                    'NC': 'North Carolina',
                    'CO': 'Colorado',
                    'WA': 'Washington',
                    'VA': 'Virginia',
                    'OH': 'Ohio',
                    'UT': 'Utah',
                    'FL': 'Florida',
                    'IN': 'Indiana'
                };

                const info = `${stateMappings[state]}\nJob Listings: ${stateCounts[state]}`;

                // Get the position of the current mouse cursor
                const mouseX = d3.event.pageX;
                const mouseY = d3.event.pageY;

                const tooltipX = mouseX + 10;
                const tooltipY = mouseY + 10;

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
                        .style("font-size", "12px")
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

                // Append a temporary text element to calculate the length
                const tempText = tooltip.append("text")
                    .text(lines[0])
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("visibility", "hidden"); // Make it invisible

                // Get the computed text length
                const firstlineWidth = tempText.node().getComputedTextLength();

                // Remove the temporary text element
                tempText.remove();

                const textHeight = lines.length * 18;

                // Append a rect for the border
                tooltip.append("rect")
                    .attr("width", maxLineWidth + 12)  // Add margin on both sides
                    .attr("height", textHeight + 3)  // Add margin on both top and bottom
                    .attr("fill", "none")  // No fill color
                    .attr("stroke", "black")  // Border color
                    .attr("stroke-width", 2);  // Border width

                // Append a rect for the background
                tooltip.append("rect")
                    .attr("width", maxLineWidth + 12)  // Add margin on both sides
                    .attr("height", textHeight + 3)  // Add margin on both top and bottom
                    .attr("fill", "#a9a9a9");  // Grey color

                // Calculate the x-coordinate to center the first line
                const firstLineX = (maxLineWidth - firstlineWidth) / 3 + (55 / (firstlineWidth / 9));

                // Append text elements for each line
                tooltip.selectAll(".tooltip-text")
                    .data(lines)
                    .enter().append("text")
                    .attr("x", (d, i) => i === 0 ? firstLineX : 5.5)  // Center the first line
                    .attr("y", (d, i) => 15 + i * 18)
                    .style("font-size", "12px")
                    .style("font-weight", "bold")
                    .style("fill", "white")
                    .text(d => d)
                    .attr("class", "tooltip-text");
            }

            function handleMouseMove(d, i) {
                // Get the existing tooltip 
                const tooltip = svg.select(".tooltip");

                if (!tooltip.empty()) {
                    // Get the position of the current mouse cursor
                    const mouseX = d3.event.pageX;
                    const mouseY = d3.event.pageY;

                     // Calculate the position of the tooltip relative to the container
                    const containerPos = svg.node().getBoundingClientRect();
                    let tooltipX = mouseX - containerPos.left - 35; // Adjust as needed
                    const tooltipY = mouseY - containerPos.top - 100; // Adjust as needed

                    if(tooltipX + 195 > containerPos.width) {
                        tooltipX = tooltipX - 180
                    }

                    tooltip.attr("transform", `translate(${tooltipX}, ${tooltipY})`)   
                }
            }

            // Function to handle mouseout event
            function handleMouseOut(d, i) {
                // Remove the tooltip element when the mouse leaves the bar
                svg.select(".tooltip").remove();

                // Select the hovered circle
                const hoveredCircle = d3.select(this);

                // Get the current radius
                const currentRadius = parseFloat(hoveredCircle.attr("r"));

                // Decrease the radius back to its original size
                hoveredCircle.transition()
                    .duration(100)  // You can adjust the duration as needed
                    .attr("r", currentRadius / 1.1)
                    .style("fill", circleColor) // Restore the original color
                    .style("opacity", 0.8); // Restore the original opacity
            }
            
        });
    }
    
    const originalHeight = 515;
    const originalWidth = originalHeight*1.35;
    createMapVisualization(originalWidth, originalHeight, false);

})();