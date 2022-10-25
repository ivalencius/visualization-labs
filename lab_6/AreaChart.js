export default function AreaChart(container){

	// initialization
    const listeners = { brushed: null }
    const dispatch = d3.dispatch("brushed", "brushend")

    // Create SVG
    const margin = {top: 20, right: 10, bottom: 20, left: 50}
    const width = 960 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const svg = d3.select(container).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            // .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    
    // Create x-axis scale
    const xScale = d3.scaleTime()
        .rangeRound([0, width])

    // Create y-axis scale
    const yScale = d3.scaleLinear()
        .rangeRound([height, 0])

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

    // Create svg path
    const areaDiv = svg.append("path")
        .attr("class","area")

    // Default brush extent
    const defaultSelection = null // NEED TO UPDATE DEFAULT SELECTION

    // Brush has selection
    function brushed({selection}) {
        if (selection) {listeners["brushed"](selection.map(xScale.invert))}
    }
    
    // Empty brush selection
    function brushend({selection}) {
        if (!selection) {listeners["brushed"](defaultSelection)}
    }

    // dispatch.on("brushed", function(event) {
    //     if (event.selection) { return event.selection.map(xScale.invert)}
    //     })
    // dispatch.on("brushend", function(event) {
    //     if (!event.selection) {return defaultSelection}
    //     })

    // Create brush
    const brush = d3.brushX()
        .extent([[0, 0],[width, height]])
        .on("brush",brushed)
        .on("end", brushend)
        // .on("brush", dispatch.call("brushed", this))
        // .on("end", dispatch.call("brushend", this))

    // Add brush to svg
    svg.append("g").attr('class', 'brush').call(brush)
    
    // Alter brush from zooming
    function setBrush(timeRange) {
        const timePix = timeRange.map(xScale)
        svg.select('.brush')
            .call(brush.move, timePix)
    }

	function update(data){ 

		// update scales, encodings, axes (use the total count)
        // update domains
        xScale.domain(d3.extent(data.map(d => d.date))).nice(d3.timeWeek)
        yScale.domain([0, d3.max(data.map(d => d.total))])

        // Change axes and labels
        xGroup//.transition(t)
            .call(xAx)
            // .call(g => g.selectAll(".tick").delay(delayfxn))

        yGroup
            // .transition(t)
            .call(yAx)

        // Area generator
		const area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => xScale(d.date))
            .y0(yScale(0))
            .y1(d => yScale(d.total))

        areaDiv
            .datum(data)
            .attr("fill","aquamarine")
            .attr("d",area)
	}

    function on(event, listener) {
        listeners[event] = listener;
    }

	return {
		update, // ES6 shorthand for "update": update
        on,
        setBrush
	}
}
