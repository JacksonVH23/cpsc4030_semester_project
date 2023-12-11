(function() {
function createJobTitleVisualization(originalWidth, originalHeight, isExpanded) {
    // Update the button font size based on the visualization state
    const buttonFontSize = isExpanded ? "10px" : "7px";
    d3.select("#jobTitleToggleButton").style("font-size", buttonFontSize);

    const buttonFontSize2 = isExpanded ? "10px" : "7px";
    const buttonFontSize3 = isExpanded ? "10px" : "8px";
    const buttonPos1 = isExpanded ? "37px" : "31px"
    const buttonPos2 = isExpanded ? "188px" : "145px"
    d3.select("#dropbtn").style("font-size", buttonFontSize2);
    d3.select("#dropdown").style("top", buttonPos1);
    d3.select("#dropdown").style("left", buttonPos2);
    d3.select("#option1").style("font-size", buttonFontSize3);
    d3.select("#option2").style("font-size", buttonFontSize3);

    // Load the data from the CSV file
    d3.csv("cleaned_dataset.csv").then(function(data) {
        // Define keywords and their shorthand mappings
        const keywordMapping = {
            "Sr.": "Senior",
            "Senior": "Senior",
            "Junior": "Junior",
            "III": "III",
            "II": "II",
            "Management": "Data Management",
            "Marketing": "Marketing",
            "Market": "Marketing",
            "Healthcare": "Healthcare",
            "Financial": "Financial",
            "Governance": "Data Governance",
            "Warehouse": "Data Warehouse",
            "Quality": "Data Quality",
            "Business": "Business",
            "Reporting": "Data Reporting"
        };

        // Group synonyms together
        const groupedMapping = {};
        Object.keys(keywordMapping).forEach(keyword => {
            const fullKeyword = keywordMapping[keyword];
            if (!groupedMapping[fullKeyword]) {
                groupedMapping[fullKeyword] = [];
            }
            groupedMapping[fullKeyword].push(keyword);
        });

        // Group the data by keywords and calculate the average salary
        const groupedData = Object.keys(groupedMapping).map(fullKeyword => {
            const synonyms = groupedMapping[fullKeyword];
            const filteredData = data.filter(d => {
                const regex = new RegExp(`\\b(${synonyms.join('|')})\\b`, 'gi');
                const jobTitle = d["Job Title"].replace(regex, fullKeyword);
                return jobTitle.includes(fullKeyword);
            });

            // Convert the salary estimates to numbers
            filteredData.forEach(d => {
                d.Salary = parseFloat(d["Salary Estimate"].replace(/[^0-9.-]+/g, ""));
            });

            const averageSalary = d3.mean(filteredData, d => d.Salary);

            return {
                Keyword: fullKeyword,
                AverageSalary: averageSalary,
                TitleCount: filteredData.length  // Add the count of titles under this keyword
            };
        });

        const titleCounts = groupedData.map(d => d.TitleCount);

        // Sort the data by average salary in descending order
        groupedData.sort((a, b) => b.AverageSalary - a.AverageSalary);

        // Create the bar chart
        // Update the margins based on the state (expanded or collapsed)
        const margin = (isExpanded == false)
            ? { top: originalHeight / 12, right: originalWidth / 20, bottom: originalHeight / 5.8, left: originalWidth / 8 }
            : { top: originalHeight / 14, right: originalWidth / 32, bottom: originalHeight / 6.15, left: originalWidth / 9 };
        const width = originalWidth - margin.left - margin.right;
        const height = originalHeight - margin.top - margin.bottom;

        // Calculate the maximum salary with a buffer
        const maxSalary = d3.max(groupedData, d => d.AverageSalary);
        const yBuffer = 3000;
        const yDomainMax = maxSalary + yBuffer;

        const svg = d3.select("#visualization-jobtitle-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("border", "2px solid black") // Add black border
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        // Add a title to the visualization
        const title = "Salary Estimate by Job Title Keyword";
        const titleFontSize = isExpanded ? "18px" : "12px"
        const titleMargin = isExpanded ? -11 : -11
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2 + titleMargin)
            .attr("text-anchor", "middle")
            .style("font-size", titleFontSize)
            .style("font-weight", "bold")
            .style("fill", "#DCDCDC")
            .style("text-decoration", "underline")
            .text(title);

        const x = d3.scaleBand()
            .domain(groupedData.map(d => d.Keyword))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, yDomainMax])
            .range([height, 0]);

        // Calculate the bar width dynamically based on the number of groups and available width
        const barWidth = width / groupedData.length * 0.6;

        // Calculate the maximum title count with a buffer
        const maxTitleCount = d3.max(groupedData, d => d.TitleCount);

        const colorScale = d3.scaleLog()
            .domain([20, maxTitleCount/1.5])
            .range(["#FAC898", "#CC7722"]);

        const bars = svg.selectAll("rect")
            .data(groupedData)
            .enter().append("rect")
            .attr("x", d => x(d.Keyword) + (x.bandwidth() - barWidth) / 2)  // Center the bars
            .attr("width", barWidth)
            .attr("y", d => y(d.AverageSalary))
            .attr("height", d => height - y(d.AverageSalary))
            .attr("fill", d => colorScale(d.TitleCount)); // Use the square root scale for TitleCount
        
        // Add event listeners for interactivity
        bars.on("mouseover", handleMouseOver)
            .on("mousemove", handleMouseMove) // Add mousemove event listener
            .on("mouseout", handleMouseOut);

        // Function to handle mouseover event
        function handleMouseOver(d, i) {
            // Define a mapping between keywords and custom titles for the tooltip
            const customTitleMapping = {
                "Marketing": "Marketing Data Analyst",
                "Data Warehouse": "Data Warehouse Analyst",
                "Financial": "Financial Data Analyst",
                "Data Management": "Data Management Analyst",
                "Senior": "Senior Data Analyst",
                "Data Reporting": "Data Reporting Analyst",
                "III": "Data Analyst III",
                "Business": "Business Analyst",
                "Healthcare": "Healthcare Data Analyst",
                "Data Quality": "Data Quality Analyst",
                "II": "Data Analyst II",
                "Data Governance": "Data Governance Analyst",
                "Junior": "Junior Data Analyst", 
            };

            // Get the custom title from the mapping or use the original keyword
            const customTitle = customTitleMapping[d.Keyword] || d.Keyword;

            // Display information about the job title count and average salary estimate
            const formattedSalary = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.AverageSalary);
            const info = `Ex: "${customTitle}"\n"${d.Keyword}" Keyword Count: ${d.TitleCount}\nAverage Salary Estimate: ${formattedSalary}`;

            // Calculate the position of the tooltip relative to the mouse
            let mouseX = d3.event.pageX;
            let mouseY = d3.event.pageY;

            // Append a tooltip element inside a grey rectangle and position it
            const tooltip = svg.append("g")
                .attr("class", "tooltip")
                .attr("transform", `translate(${mouseX - 80}, ${mouseY - 100})`);

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

            // Highlight the bar
            d3.select(this).classed('highlighted-bar', true);
        }

        // Function to handle mousemove event
        function handleMouseMove(d, i) {
            // Get the existing tooltip
            const tooltip = svg.select(".tooltip");

            if (!tooltip.empty()) {
                // Get the position of the current mouse cursor
                const mouseX = d3.event.pageX;
                const mouseY = d3.event.pageY;

                // Get the position of the container element
                const containerPosition = document.getElementById("visualization-jobtitle-container").getBoundingClientRect();

                // Calculate the position of the tooltip relative to the container
                let tooltipX = mouseX - containerPosition.left;
                const tooltipY = mouseY - containerPosition.top;

                // Get the dimensions of the tooltip
                const tooltipRect = tooltip.select("rect").node().getBoundingClientRect();

                // Calculate automatic offsets
                const offsetX = isExpanded ? tooltipRect.width / 3.5 : tooltipRect.width / 4
                const offsetY = tooltipRect.height + 20; // Adjust this value based on the desired vertical offset

                // Check if the tooltip exceeds the right boundary
                if (tooltipX + offsetX + tooltipRect.width > containerPosition.width) {
                    // Swap the tooltip to the left side
                    isExpanded ? tooltipX = tooltipX + offsetX + tooltipRect.width - containerPosition.width / (1.7 * 1.45) : tooltipX = tooltipX + offsetX + tooltipRect.width - containerPosition.width / 1.7;
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

            // Remove the highlight from the bar
            d3.select(this).classed('highlighted-bar', false);
        }

        // Add x-axis
        const xFontSize = isExpanded ? "11px" : "8px"
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("fill", "#DCDCDC")
            .attr("font-size", xFontSize)
            .style("text-anchor", "middle")  // Center the text
            .attr("dy", "0.6em")  // Adjust the vertical position
            .each(function (d, i) {
                const currentLabel = d3.select(this);
                const words = currentLabel.text().split(' ');

                // Store the line element associated with the current tick
                const lineElement = currentLabel.select(function() { return this.parentNode }).select("line");

                if (words.length > 1) {
                    // If there is more than one word, break into two lines
                    currentLabel.text('');

                    for (let i = 0; i < words.length; i++) {
                        const tspan = currentLabel.append('tspan')
                            .text(words[i])
                            .attr('x', 0)
                            .attr('dy', i ? '1.1em' : '0.8em');
                    }

                    lineElement.attr("y2", currentLabel.attr("dy"));
                } else if (words[0].length >= 8 && i < svg.selectAll("text").nodes().length - 1) {
                    // If the label is one line and has 8 or more characters,
                    // and the next label is also one line and has 8 or more characters, extend downwards
                    const nextLabel = d3.select(svg.selectAll("text").nodes()[i + 2]);
                    const nextWords = nextLabel.text().split(' ');

                    if (nextWords.length === 1 && nextWords[0].length >= 8) {
                        // If the next label is also a single line and has 8 or more characters, extend downwards
                        const combinedLength = words[0].length + nextWords[0].length;

                        if (combinedLength >= 16) {
                            currentLabel.attr('dy', '1.6em');  // or any other appropriate value
                            const xLine = isExpanded ? 9 : 8
                            lineElement.attr("y2", parseFloat(currentLabel.attr("dy")) * xLine);
                        }
                    }
                }
            })

        // Add x-axis label
        const xLabelFontSize = isExpanded ? "14px" : "10px"
        const xMargin = isExpanded ? 33 : 27
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.top + margin.bottom - xMargin)
            .attr("text-anchor", "middle")
            .style("font-size", xLabelFontSize)
            .style("font-weight", "bold")
            .text("Job Title Keywords")
            .style("fill", "#DCDCDC");

        const yFontSize = isExpanded ? "11px" : "8px"
        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(d)))
            .selectAll("text")
            .style("fill", "#DCDCDC")
            .attr("font-size", yFontSize);

        // Add y-axis label
        const yLabelFontSize = isExpanded ? "15px" : "11px"
        const yMargin = isExpanded ? 20 : 17
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - height / 2)
            .attr("y", -margin.left + yMargin)
            .attr("text-anchor", "middle")
            .style("font-size", yLabelFontSize)
            .style("font-weight", "bold")
            .style("fill", "#DCDCDC")
            .text("Average Salary Estimate (USD)");

        // Create the legend
        const legendPos = isExpanded ? 95 : 60
        const legend = svg.append("g")
            .attr("transform", `translate(${width - legendPos}, 0)`);

        // Specify the Title Counts for the left and right ends of the gradient
        const leftTitleCount = 30;
        const rightTitleCount = 1800;

        // Find the corresponding colors using the color scale
        const leftColor = colorScale(leftTitleCount);
        const rightColor = colorScale(rightTitleCount);


        // Define the gradient for the legend
        const gradient = legend.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "150%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // Add color stops to the gradient based on the specified colors
        gradient.selectAll("stop")
            .data([
                { offset: 0, color: leftColor },
                { offset: 1, color: rightColor }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Add the legend rectangle filled with the gradient
        const legendWidth = isExpanded ? 75 : 65
        const legendHeight = isExpanded ? 15 : 10
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        // Add labels
        const legendFontSize1 = isExpanded ? "8px" : "7px"
        const legendLabelX1 = isExpanded ? "37px" : "33px"
        const legendLabelY1 = isExpanded ? "25px" : "18px"
        legend.append("text")
            .attr("x",legendLabelX1)
            .attr("y", legendLabelY1)
            .style("fill", "#DCDCDC")
            .attr("text-anchor", "middle")
            .style("font-size", legendFontSize1)
            .text("Keyword Frequency");
        
        const legendFontSize2 = isExpanded ? "7px" : "6px"
        const legendLabelX2 = isExpanded ? "8px" : "5px"
        const legendLabelY2 = isExpanded ? "-3px" : "-3px"
        legend.append("text")
        .attr("x", legendLabelX2)
        .attr("y", legendLabelY2)
        .attr("text-anchor", "middle")
        .style("fill", "#DCDCDC")
        .style("font-size", legendFontSize2)
        .text("Low");

        const legendFontSize3 = isExpanded ? "7px" : "6px"
        const legendLabelX3 = isExpanded ? "66px" : "58px"
        const legendLabelY3 = isExpanded ? "-3px" : "-3px"
        legend.append("text")
        .attr("x", legendLabelX3)
        .attr("y", legendLabelY3)
        .attr("text-anchor", "middle")
        .style("fill", "#DCDCDC")
        .style("font-size", legendFontSize3)
        .text("High");
            
    });
}

function createIndustryVisualization(originalWidth, originalHeight, isExpanded) {
    // Update the button font size based on the visualization state
    const buttonFontSize = isExpanded ? "10px" : "7px";
    d3.select("#jobTitleToggleButton").style("font-size", buttonFontSize);

    const buttonFontSize2 = isExpanded ? "10px" : "7px";
    const buttonFontSize3 = isExpanded ? "10px" : "8px";
    const buttonPos1 = isExpanded ? "37px" : "31px"
    const buttonPos2 = isExpanded ? "188px" : "145px"
    d3.select("#dropbtn").style("font-size", buttonFontSize2);
    d3.select("#dropdown").style("top", buttonPos1);
    d3.select("#dropdown").style("left", buttonPos2);
    d3.select("#option1").style("font-size", buttonFontSize3);
    d3.select("#option2").style("font-size", buttonFontSize3);

    // Load the data from the CSV file
    d3.csv("cleaned_dataset.csv").then(function(data) {
        // Get unique industries and their counts
        const industryCounts = data.reduce((counts, d) => {
            const industry = d["Industry"];
            
            // Exclude 'unknown' values from the counts
            if (industry !== 'Unknown') {
                counts[industry] = (counts[industry] || 0) + 1;
            }
            
            return counts;
        }, {});
        // Sort industries by count in descending order and take the top 10
        const sortedIndustries = Object.keys(industryCounts).sort((a, b) => industryCounts[b] - industryCounts[a]).slice(0, 12);

        // Filter data for the top 10 industries
        const filteredData = data.filter(d => sortedIndustries.includes(d["Industry"]));

        // Group the data by industries and calculate the average salary
        const groupedData = sortedIndustries.map(industry => {
            const industryData = filteredData.filter(d => d["Industry"] === industry);

            // Convert the salary estimates to numbers
            industryData.forEach(d => {
                d.Salary = parseFloat(d["Salary Estimate"].replace(/[^0-9.-]+/g, ""));
            });

            const averageSalary = d3.mean(industryData, d => d.Salary);

            return {
                Industry: industry,
                AverageSalary: averageSalary,
                TitleCount: industryData.length  // Add the count of titles under this industry
            };
        });

        // Sort the data by average salary in descending order
        groupedData.sort((a, b) => b.AverageSalary - a.AverageSalary);

        // Create the bar chart
        // Update the margins based on the state (expanded or collapsed)
        const margin = (isExpanded == false)
            ? { top: originalHeight / 12, right: originalWidth / 20, bottom: originalHeight / 5.8, left: originalWidth / 8 }
            : { top: originalHeight / 14, right: originalWidth / 32, bottom: originalHeight / 4.5, left: originalWidth / 9 };
        const width = originalWidth - margin.left - margin.right;
        const height = originalHeight - margin.top - margin.bottom;

        // Calculate the maximum salary with a buffer
        const maxSalary = d3.max(groupedData, d => d.AverageSalary);
        const yBuffer = 3000;
        const yDomainMax = maxSalary + yBuffer;

        const svg = d3.select("#visualization-jobtitle-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("border", "2px solid black") // Add black border
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        // Add a title to the visualization
        const title = "Salary Estimate by Company Industry";
        const titleFontSize = isExpanded ? "18px" : "12px"
        const titleMargin = isExpanded ? -11 : -11
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2 + titleMargin)
            .attr("text-anchor", "middle")
            .style("font-size", titleFontSize)
            .style("font-weight", "bold")
            .style("fill", "#DCDCDC")
            .style("text-decoration", "underline")
            .text(title);

        const x = d3.scaleBand()
            .domain(groupedData.map(d => d.Industry))
            .range([0, width])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, yDomainMax])
            .range([height, 0]);

        // Calculate the bar width dynamically based on the number of groups and available width
        const barWidth = width / groupedData.length * 0.6;

        // Calculate the maximum title count with a buffer
        const maxTitleCount = d3.max(groupedData, d => d.TitleCount);

        const colorScale = d3.scaleLog()
            .domain([20, maxTitleCount/1.5])
            .range(["#FAC898", "#CC7722"]);

        const bars = svg.selectAll("rect")
            .data(groupedData)
            .enter().append("rect")
            .attr("x", d => x(d.Industry) + (x.bandwidth() - barWidth) / 2)  // Center the bars
            .attr("width", barWidth)
            .attr("y", d => y(d.AverageSalary))
            .attr("height", d => height - y(d.AverageSalary))
            .attr("fill", d => colorScale(d.TitleCount)); // Use the square root scale for TitleCount
        
        // Add event listeners for interactivity
        bars.on("mouseover", handleMouseOver)
            .on("mousemove", handleMouseMove) // Add mousemove event listener
            .on("mouseout", handleMouseOut);

        // Function to handle mouseover event
        function handleMouseOver(d, i) {

            // Display information about the job title count and average salary estimate
            const formattedSalary = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(d.AverageSalary);
            const info = `Industry: ${d.Industry}\nListing Count: ${d.TitleCount}\nAverage Salary Estimate: ${formattedSalary}`;

            // Calculate the position of the tooltip relative to the mouse
            let mouseX = d3.event.pageX;
            let mouseY = d3.event.pageY;

            // Append a tooltip element inside a grey rectangle and position it
            const tooltip = svg.append("g")
                .attr("class", "tooltip")
                .attr("transform", `translate(${mouseX - 80}, ${mouseY - 100})`);

            // Calculate the width and height of the tooltip box dynamically based on the text content
            const lines = info.split('\n');
            let maxLineWidth = 0;
            lines.forEach(line => {
                // Append a temporary text element to calculate the length
                const tempText = tooltip.append("text")
                .text(line)
                .style("font-size", "8px")
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
                .style("font-size", "8px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(d => d)
                .attr("class", "tooltip-text");

            // Highlight the bar
            d3.select(this).classed('highlighted-bar', true);
        }

        // Function to handle mousemove event
        function handleMouseMove(d, i) {
            // Get the existing tooltip
            const tooltip = svg.select(".tooltip");

            if (!tooltip.empty()) {
                // Get the position of the current mouse cursor
                const mouseX = d3.event.pageX;
                const mouseY = d3.event.pageY;

                // Get the position of the container element
                const containerPosition = document.getElementById("visualization-jobtitle-container").getBoundingClientRect();

                // Calculate the position of the tooltip relative to the container
                let tooltipX = mouseX - containerPosition.left;
                const tooltipY = mouseY - containerPosition.top;

                // Get the dimensions of the tooltip
                const tooltipRect = tooltip.select("rect").node().getBoundingClientRect();

                // Calculate automatic offsets
                const offsetX = isExpanded ? tooltipRect.width / 3.5 : tooltipRect.width / 4
                const offsetY = tooltipRect.height + 20; // Adjust this value based on the desired vertical offset

                // Check if the tooltip exceeds the right boundary
                if (tooltipX + offsetX + tooltipRect.width > containerPosition.width) {
                    // Swap the tooltip to the left side
                    isExpanded ? tooltipX = tooltipX + offsetX + tooltipRect.width - containerPosition.width / (1.7 * 1.45) : tooltipX = tooltipX + offsetX + tooltipRect.width/1.3 - containerPosition.width / 2;
                    tooltip.attr("transform", `translate(${tooltipX - offsetX*4.5 - tooltipRect.width/8 + 10}, ${tooltipY - offsetY})`);
                } else {
                    isExpanded ? tooltip.attr("transform", `translate(${tooltipX - offsetX/1.3}, ${tooltipY - offsetY})`) : tooltip.attr("transform", `translate(${tooltipX - offsetX/(1.5)}, ${tooltipY - offsetY})`)
                }
            }
        }

        // Function to handle mouseout event
        function handleMouseOut() {
            // Remove the tooltip element when the mouse leaves the bar
            svg.select(".tooltip").remove();

            // Remove the highlight from the bar
            d3.select(this).classed('highlighted-bar', false);
        }

        // Add x-axis
        const xFontSize = isExpanded ? "9px" : "6px"
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("fill", "#DCDCDC")
            .attr("font-size", xFontSize)
            .style("text-anchor", "middle")  // Center the text
            .attr("dy", "0.6em")  // Adjust the vertical position
            .each(function (d, i) {
                const currentLabel = d3.select(this);
                const words = currentLabel.text().split(' ');

                // Store the line element associated with the current tick
                const lineElement = currentLabel.select(function() { return this.parentNode }).select("line");

                if (words.length > 1) {
                    // If there is more than one word, break into two lines
                    currentLabel.text('');

                    for (let i = 0; i < words.length; i++) {
                        const tspan = currentLabel.append('tspan')
                            .text(words[i])
                            .attr('x', 0)
                            .attr('dy', i ? '1.1em' : '0.8em');
                    }

                    lineElement.attr("y2", currentLabel.attr("dy"));
                } else if (words[0].length >= 8 && i < svg.selectAll("text").nodes().length - 1) {
                    // If the label is one line and has 8 or more characters,
                    // and the next label is also one line and has 8 or more characters, extend downwards
                    const nextLabel = d3.select(svg.selectAll("text").nodes()[i + 2]);
                    const nextWords = nextLabel.text().split(' ');

                    if (nextWords.length === 1 && nextWords[0].length >= 8) {
                        // If the next label is also a single line and has 8 or more characters, extend downwards
                        const combinedLength = words[0].length + nextWords[0].length;

                        if (combinedLength >= 16) {
                            currentLabel.attr('dy', '1.6em');  // or any other appropriate value
                            const xLine = isExpanded ? 9 : 8
                            lineElement.attr("y2", parseFloat(currentLabel.attr("dy")) * xLine);
                        }
                    }
                }
            })

        // Add x-axis label
        const xLabelFontSize = isExpanded ? "14px" : "10px"
        const xMargin = isExpanded ? 33 : 27
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.top + margin.bottom - xMargin)
            .attr("text-anchor", "middle")
            .style("font-size", xLabelFontSize)
            .style("font-weight", "bold")
            .text("Industries")
            .style("fill", "#DCDCDC");

        const yFontSize = isExpanded ? "11px" : "8px"
        // Add y-axis
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d => new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            }).format(d)))
            .selectAll("text")
            .style("fill", "#DCDCDC")
            .attr("font-size", yFontSize);

        // Add y-axis label
        const yLabelFontSize = isExpanded ? "15px" : "11px"
        const yMargin = isExpanded ? 20 : 17
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", 0 - height / 2)
            .attr("y", -margin.left + yMargin)
            .attr("text-anchor", "middle")
            .style("font-size", yLabelFontSize)
            .style("font-weight", "bold")
            .style("fill", "#DCDCDC")
            .text("Average Salary Estimate (USD)");

        // Create the legend
        const legendPos = isExpanded ? 95 : 60
        const legend = svg.append("g")
            .attr("transform", `translate(${width - legendPos}, 0)`);

        // Specify the Title Counts for the left and right ends of the gradient
        const leftTitleCount = 30;
        const rightTitleCount = 1800;

        // Find the corresponding colors using the color scale
        const leftColor = colorScale(leftTitleCount);
        const rightColor = colorScale(rightTitleCount);


        // Define the gradient for the legend
        const gradient = legend.append("linearGradient")
            .attr("id", "legend-gradient")
            .attr("x1", "0%")
            .attr("x2", "150%")
            .attr("y1", "0%")
            .attr("y2", "0%");

        // Add color stops to the gradient based on the specified colors
        gradient.selectAll("stop")
            .data([
                { offset: 0, color: leftColor },
                { offset: 1, color: rightColor }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        // Add the legend rectangle filled with the gradient
        const legendWidth = isExpanded ? 75 : 65
        const legendHeight = isExpanded ? 15 : 10
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)");

        // Add labels
        const legendFontSize1 = isExpanded ? "8px" : "7px"
        const legendLabelX1 = isExpanded ? "37px" : "33px"
        const legendLabelY1 = isExpanded ? "25px" : "18px"
        legend.append("text")
            .attr("x",legendLabelX1)
            .attr("y", legendLabelY1)
            .style("fill", "#DCDCDC")
            .attr("text-anchor", "middle")
            .style("font-size", legendFontSize1)
            .text("Industry Frequency");
        
        const legendFontSize2 = isExpanded ? "7px" : "6px"
        const legendLabelX2 = isExpanded ? "8px" : "5px"
        const legendLabelY2 = isExpanded ? "-3px" : "-3px"
        legend.append("text")
        .attr("x", legendLabelX2)
        .attr("y", legendLabelY2)
        .attr("text-anchor", "middle")
        .style("fill", "#DCDCDC")
        .style("font-size", legendFontSize2)
        .text("Low");

        const legendFontSize3 = isExpanded ? "7px" : "6px"
        const legendLabelX3 = isExpanded ? "66px" : "58px"
        const legendLabelY3 = isExpanded ? "-3px" : "-3px"
        legend.append("text")
        .attr("x", legendLabelX3)
        .attr("y", legendLabelY3)
        .attr("text-anchor", "middle")
        .style("fill", "#DCDCDC")
        .style("font-size", legendFontSize3)
        .text("High");
            
    });
}

// Call the function with initial dimensions
let isVisualizationExpanded = false;
let isOption2 = false;
const originalWidth =500;
const originalHeight = originalWidth/2;
createJobTitleVisualization(originalWidth, originalHeight, false);

// Add event listener to the button
document.getElementById('jobTitleToggleButton').addEventListener('click', function () {
    if (isVisualizationExpanded) {
        if(!isOption2){
            // Collapse visualization
            document.getElementById('jobTitleToggleButton').textContent = 'Expand Visualization';
            // Remove existing visualization
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            d3.select("#visualization-1-container").style("z-index", "1");
            createJobTitleVisualization(originalWidth, originalHeight, false);
        } else {
            // Collapse visualization
            document.getElementById('jobTitleToggleButton').textContent = 'Expand Visualization';
            // Remove existing visualization
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            d3.select("#visualization-1-container").style("z-index", "1");
            createIndustryVisualization(originalWidth, originalHeight, false);
        }
    } else {
        if(!isOption2) {
            // Expand visualization
            document.getElementById('jobTitleToggleButton').textContent = 'Collapse Visualization';
            const newWidth = originalWidth * 1.4;
            const newHeight = originalHeight * 1.4;
            // Remove existing visualization
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            d3.select("#visualization-1-container").style("z-index", "2");
            createJobTitleVisualization(newWidth, newHeight, true);
        } else {
            // Expand visualization
            document.getElementById('jobTitleToggleButton').textContent = 'Collapse Visualization';
            const newWidth = originalWidth * 1.4;
            const newHeight = originalHeight * 1.4;
            // Remove existing visualization
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            d3.select("#visualization-1-container").style("z-index", "2");
            createIndustryVisualization(newWidth, newHeight, true);
        }
    }

    // Toggle the state
    isVisualizationExpanded = !isVisualizationExpanded;
});

// Add event listener to dropdown options
document.getElementById('option1').addEventListener('click', function () {
    // Switch to job title visualization
    if(isOption2) {
        if(isVisualizationExpanded == true) {
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            createJobTitleVisualization(originalWidth*1.4, originalHeight*1.4, isVisualizationExpanded);
            isOption2 = false;
        } else {
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            createJobTitleVisualization(originalWidth, originalHeight, isVisualizationExpanded);
            isOption2 = false;
        }
    }
}); 

document.getElementById('option2').addEventListener('click', function () {
    if(!isOption2) {
        if(isVisualizationExpanded == true) {
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            createIndustryVisualization(originalWidth*1.4, originalHeight*1.4, isVisualizationExpanded);
            isOption2 = true;
        } else {
            d3.select("#visualization-jobtitle-container").select("svg").remove();
            createIndustryVisualization(originalWidth, originalHeight, isVisualizationExpanded);
            isOption2 = true;
        }
    }
});

})();