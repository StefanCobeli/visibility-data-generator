let global_locations = [];
let selected_locations = [];

// Load the data from data.json
// d3.json("data.json").then(function(data) {
d3.json("./D3Charts/Histogram/queried_many_locations_plane.csv").then(function (
  data
) {
  global_locations = data;
  selected_locations = data;

  // Create the histogram
  createHistogram(global_locations);
});

function createHistogram(data) {
  const svg = d3.select(".parallelCoordinates");
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = +svg.attr("width") - margin.left - margin.right;
  const height = +svg.attr("height") - margin.top - margin.bottom;
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleLinear().domain([0, 0.6]).rangeRound([0, width]);

  const bins = d3.histogram().domain(x.domain()).thresholds(x.ticks(20))(
    data.map((d) => d.residual)
  );

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(bins, (d) => d.length)])
    .range([height, 0]);

  const bar = g
    .selectAll(".bar")
    .data(bins)
    .enter()
    .append("g")
    .attr("class", "bar")
    .attr("transform", (d) => `translate(${x(d.x0)},${y(d.length)})`);

  bar
    .append("rect")
    .attr("x", 1)
    .attr("width", x(bins[0].x1) - x(bins[0].x0) - 1)
    .attr("height", (d) => height - y(d.length))
    .attr("class", "bar");

  // Text on top of bins with number of objects per bin:
  // bar.append("text")
  //     .attr("dy", ".75em")
  //     .attr("y", -12)
  //     .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
  //     .attr("text-anchor", "middle")
  //     .text(d => d.length);

  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));

  g.append("g")
    .attr("class", "brush")
    .call(
      d3
        .brushX()
        .extent([
          [0, 0],
          [width, height],
        ])
        .on("brush end", brushended)
    );

  function brushended(event) {
    if (!event.selection) {
      selected_locations = global_locations;
    } else {
      const [x0, x1] = event.selection.map(x.invert);
      selected_locations = global_locations.filter(
        (d) => d.residual >= x0 && d.residual <= x1
      );
    }
    console.log(selected_locations); // For debugging purposes
  }
}
