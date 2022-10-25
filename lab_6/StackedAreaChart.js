export default function StackedAreaChart(container){

	// initialization
    let selected = null, defaultTitle="Total Unemployed", xDomain, data
    const listeners = { zoomed: null }

    // Create SVG
    const margin = {top: 20, right: 10, bottom: 20, left: 50}
    const width = 960 - margin.left - margin.right
    const height = 500 - margin.top - margin.bottom

    const svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
    // Create x-axis scale
    const xScale = d3.scaleTime()
        .rangeRound([0, width])

    // Create y-axis scale
    const yScale = d3.scaleLinear()
        .rangeRound([height, 0])
    
    // Create group scale
    const cScale = d3.scaleOrdinal()
        .range(d3.schemeCategory10)

    // update axes and axis title
    const xAx = d3.axisBottom(xScale)
    const yAx = d3.axisLeft(yScale)
        .tickFormat(d3.format(",.2r"))

    // Create axis containers
    const yGroup = svg.append("g")
            .attr("class","y-axis")

    const xGroup = svg.append("g")
            .attr("class","x-axis")
            .attr("transform",`translate(0, ${height})`)

    const yLabel = svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", 0)
            .attr("y", 0 - margin.top)
            .attr("dy", "1em")
            .style("text-anchor", "start")
            .text("Total Unemployed")
    
    // Create zoom
    function zoomed({ transform }) {
        const copy = xScale.copy().domain(d3.extent(data, d => d.date))
        const rescaled = transform.rescaleX(copy)
        xDomain = rescaled.domain()
        update(data)
        listeners["zoomed"](xDomain) // ERROR HERE
      }

    const zoom = d3.zoom()
        .extent([[0, 0], [width, height]])
        .translateExtent([[0, -Infinity], [width, Infinity]])
        .scaleExtent([1, 4])
        .on("zoom", zoomed)

    svg.call(zoom)
    svg.on("dblclick.zoom", null)
    
    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)// the size of clip-path is the same as
        .attr("height", height); // the chart area

    function on(event, listener) {
        listeners[event] = listener;
    }

    // Function to filter xDomain
    function filterByDate(range){
        xDomain = range  // -- (3)
        update(data) // -- (4)
    }

    // Update function
	function update(_data){ 
        data = _data

        const keys = selected ? [selected] : data.columns.filter(d => d !== 'date')

        const stack = d3.stack()
            .keys(keys) // If 1 key --> this subsets data

        const stackedData = stack(data)

        // update domains
        xScale.domain(xDomain ? xDomain : d3.extent(data.map(d => d.date))) // range of dates for stackedData == data
            .nice(d3.timeWeek)
            .clamp(true) // Don't return values outside of the view range

        yScale.domain([0, d3.max(stackedData, d => d3.max(d, d => d[1]))])

        cScale.domain(keys)

        // Change axes and labels
        xGroup//.transition(t)
            .call(xAx)

        yGroup
            // .transition(t)
            .call(yAx)

        // Area generator
		const areaGen = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => xScale(d.data.date)) // NEED TO GET DATE VALUE
            .y0(d => yScale(d[0]))
            .y1(d => yScale(d[1]))

        const vis = svg.selectAll(".stack-area")
            .data(stackedData, d => d.key)
        

        const stacks = vis.join(
                enter => enter.append("path")
                        .attr("class","stack-area")
                        .attr("d", areaGen)
                        .attr("fill", d => cScale(d.key))
                        .attr("opacity",0.75),
                update => update.attr("d", areaGen),
                exit => exit.remove()
            )
            
        stacks.on("click", (event, d) => {
            // toggle selected based on d.key
            if (selected === d.key) {
                // Reset to defaults
                defaultTitle = "Total Unemployed"
                selected = null
            } else {
                // Switch to selection 
                defaultTitle = d.key
                selected = d.key
            }
            update(data) // simply update the chart again
            })

        // Change y-axis label to data key
        let change_label = function(event, d) {
            // console.log(this)
            yLabel.text(d.key)
            d3.select(this).style("opacity",1)
            }

        // Change y-axis label back to default
        let revert_label = function() {
            yLabel.text(defaultTitle)
            d3.select(this).style("opacity",0.75)
            }

        // Create tooltip interactivity
        stacks
            .on("mouseover", change_label)
            .on("mouseleave", revert_label)
	}

	return {
		update,
        filterByDate,
        on
	}
}