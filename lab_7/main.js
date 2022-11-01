Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(([airports, worldmap]) => {
    let visType = 'force'
    // Convert to geojson
    const worldmapGeo = topojson.feature(worldmap, worldmap.objects.countries)

    // Inspect data
    // console.log('airports.json', airports)
    // console.log("world-110 TopoJson", worldmap)
    // console.log("world-110m GeoJson", worldmapGeo)
    
    // Svg initialization
    const width = 900
    const height = 600
    const svg = d3.select(".airport-chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0,0, width, height])
    
    // Create projection
    const proj = d3.geoMercator()
        .fitExtent(
            [[0,0], [width,height]],
            worldmapGeo
            )


    // Create path generator
    const pathGen = d3.geoPath().projection(proj)

    // Create paths
    const paths = svg.selectAll("path")
        .data(worldmapGeo.features)
        .join(
            enter => enter.append("path")
                .attr("d", pathGen)
                .style("fill", "black")
                .attr("opacity", 0)
        )

    // Add names to countries
    paths.append("title")
        .text(d => d.properties.name)

    // Create borders
    svg.append("path")
        .datum(topojson.mesh(worldmap, worldmap.objects.countries))
        .attr("d", pathGen)
        .attr('fill', 'none')
          .attr('stroke', 'white')
        .attr("class", "subunit-boundary");

    // Color scale initialization
    const s = d3.scaleLinear()
        .domain(d3.extent(airports.nodes.map(d => d.passengers)))
        .range([5,10])

    // Add radius to dataset (doesn't vary)
    airports.nodes.map(d => d.r = s(d.passengers))

    // check color scale
    // console.log("color scale check", airports.nodes.map(d => s(d.passengers)))

    // Construct forces
    const forceNode = d3.forceManyBody().strength(-10)
    const forceLink = d3.forceLink(airports.links)
    const forceCollide = d3.forceCollide(d => d.r).iterations(3)
    const forceCenter = d3.forceCenter(width/2, height/2)

    // Create force simulation
    const sim = d3.forceSimulation(airports.nodes)
        .force("center", forceCenter)
        .force("charge", forceNode)
        .force("collide", forceCollide)
        .force("link", forceLink)

    // Create links
    const links = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(airports.links)
        .join(
            enter => enter.append("line")
                .style("stroke", "red")
        )
    
    // Create Nodes
    const nodes = svg.append("g")
        .attr("class","nodes")
        .selectAll("circle")
        .data(airports.nodes)
        .join(
            enter => enter.append("circle")
                .attr("r", d => d.r)
                .style("fill", "aqua")
            // update => update
            //     .attr("cx", d => d.x)
            //     .attr("cy", d => d.y)
        )
    // For tooltip
    nodes.append("title")   
        .text(d => d.name)
    
    // Create function for simulation update
    function ticked() {
        nodes
            .attr("cx", d => Math.max(d.r, Math.min(width - d.r, d.x)))
            .attr("cy", d => Math.max(d.r, Math.min(height - d.r, d.y)))
            // .attr("cx", d => d.x)
            // .attr("cy", d => d.y)
        links
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y)
    }

    // Start simulation
    sim.on("tick", ticked)

    // Set up drags
    function dragstarted(event, d) {
        if (!event.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Create drag handler
    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    // Call dragging
    nodes.call(drag)

    // Only enable draggin on map
    drag.filter(_ => visType === "force")

    function switchLayout() {
        if (visType === "map") {
                // Stop Simulation
                sim.stop()
                // Show map
                paths.attr("opacity",1)
                // Reproject nodes
                airports.nodes.map(d => {
                    d.fx = proj([d.longitude, d.latitude])[0]
                    d.fy = proj([d.longitude, d.latitude])[1]
                })
                // Reproject links
                airports.links.map(d => {
                    d.source.fx = proj([d.source.longitude, d.source.latitude])[0]
                    d.source.fy = proj([d.source.longitude, d.source.latitude])[1]
                    d.target.fx = proj([d.target.longitude, d.target.latitude])[0]
                    d.target.fy = proj([d.target.longitude, d.target.latitude])[1]
                })
                // Move nodes 
                nodes.transition().duration(750)
                    .attr("cx", d => d.fx)
                    .attr("cy", d => d.fy)
                // Move links
                links.transition().duration(750)
                    .attr("x1", d => d.source.fx)
                    .attr("y1", d => d.source.fy)
                    .attr("x2", d => d.target.fx)
                    .attr("y2", d => d.target.fy)
            } else {
                // Reproject nodes
                airports.nodes.map(d => {
                    d.fx = null
                    d.fy = null
                })
                // Reproject links
                airports.links.map(d => {
                    d.source.fx = null
                    d.source.fy = null
                    d.target.fx = null
                    d.target.fy = null
                })

                // Move nodes 
                nodes.transition().duration(750)
                    .attr("cx", d => d.x)
                    .attr("cy", d => d.y)
                // Move links
                links.transition().duration(750)
                    .attr("x1", d => d.source.x)
                    .attr("y1", d => d.source.y)
                    .attr("x2", d => d.target.x)
                    .attr("y2", d => d.target.y)

                // Wait for transition to finish to restart simulation
                setTimeout(function() {
                    sim.alpha(0.2).restart()
                  }, 750);
                paths.attr("opacity",0)
            }
        }

    // Listener for chart selection
    d3.selectAll("input[name=chart-type]").on("change", event=>{
        visType = event.target.value;// selected button
        // console.log("Radio Button: ", visType)
        switchLayout()
    })
})
