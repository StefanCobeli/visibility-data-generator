import {
  onValue,
  getValue,
  setBrushedPoints,
  onBrushedPoints,
} from "./store.js";

// get current (if already set)
console.log("current:", getValue());

// react to future updates
onValue((v) => {
  console.log("received:", v, "______+++______");
  if (scatterCurProjection == "PCA") {
    setActiveBtnProjection("PCA");
    updateScatter2(v);
  }
});

let scatterCurProjection = "PCA";
let scatterGroup;
let s_ids = [];

const scatterBtnPCA = document.getElementById("btn-pca");
const scatterBtnUMAP = document.getElementById("btn-umap");

scatterBtnPCA.addEventListener("click", () => {
  if (scatterCurProjection !== "PCA") {
    scatterCurProjection = "PCA";
    setActiveBtnProjection("PCA");
    drawScatter();
  }
});

scatterBtnUMAP.addEventListener("click", () => {
  if (scatterCurProjection !== "UMAP") {
    scatterCurProjection = "UMAP";
    setActiveBtnProjection("UMAP");
    drawScatter();
  }
});

function setActiveBtnProjection(projection) {
  if (projection === "PCA") {
    scatterBtnPCA.classList.add("active");
    scatterBtnUMAP.classList.remove("active");
  } else {
    scatterBtnUMAP.classList.add("active");
    scatterBtnPCA.classList.remove("active");
  }
}
const svgElementScatter = document.getElementById("svg-scatter");

let svg_scatter = d3v7.select(svgElementScatter);
let marginScatter = { top: 0, right: 0, bottom: 0, left: 0 };
let lastTransformScatter = d3v7.zoomIdentity; // Remember zoom state globally
let zoomEnabledScatter = true;
let xScale, yScale;
let brushedGalleryPoints = []; // Declare outside brush to store result

// Wrapper to redraw the chart
function drawScatter() {
  // Get current container sizes
  const wrapperScatter = document.querySelector(".wrapper-scatter");
  const containerScatter = document.querySelector(".container-scatter");
  const width = wrapperScatter.clientWidth;
  const height = wrapperScatter.clientHeight - containerScatter.offsetHeight;

  updateProjection(scatterCurProjection, width, height);
}

window.drawScatter = drawScatter;

// Main function to create or update the scatter plot
function updateProjection(projectionType, width, height) {
  d3v7.json(dataFiles[currentCategory]).then((rawData) => {
    // console.log(rawData);
    const data = rawData.map((d) => ({
      x: d[projectionType][0],
      y: d[projectionType][1],
      id: d.image_name,
    }));

    const xExtent = d3v7.extent(data, (d) => d.x);
    const yExtent = d3v7.extent(data, (d) => d.y);

    // remove previous scatter plot
    svg_scatter.selectAll("*").remove();

    svg_scatter.attr("width", width).attr("height", height);

    const chart = svg_scatter
      .append("g")
      .attr(
        "transform",
        `translate(${marginScatter.left}, ${marginScatter.top})`
      );

    const innerWidth = width - marginScatter.left - marginScatter.right;
    const innerHeight = height - marginScatter.top - marginScatter.bottom;

    const pointRadius = 1;
    const xPadding = (xExtent[1] - xExtent[0]) * 0.01;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.01;

    xScale = d3v7
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([pointRadius, innerWidth - pointRadius]);

    yScale = d3v7
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight - pointRadius, pointRadius]);

    chart
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight);

    scatterGroup = chart
      .append("g")
      .attr("clip-path", "url(#clip)")
      .attr("transform", lastTransformScatter);

    const points = scatterGroup
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", pointRadius)
      .attr("opacity", 0.25)
      .attr("fill", "#7570b3");

    let brushLayer = chart.append("g").attr("class", "brush-scatter");

    const zoom = d3v7
      .zoom()
      .scaleExtent([1, 10])
      .on("zoom", (event) => {
        if (zoomEnabledScatter) {
          lastTransformScatter = event.transform;
          scatterGroup.attr("transform", lastTransformScatter);
        }
      });

    const brush = d3v7
      .brush()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on("brush", (event) => {
        if (!zoomEnabledScatter) {
          const sel = event.selection;
          if (!sel) return;

          const newX = lastTransformScatter.rescaleX(xScale);
          const newY = lastTransformScatter.rescaleY(yScale);
          const [[x0, y0], [x1, y1]] = sel;

          const isInside = (d) => {
            const cx = newX(d.x);
            const cy = newY(d.y);
            return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
          };

          // 1) Color ONLY base points (everything except gallery points)
          scatterGroup
            .selectAll("circle:not(.gallery-point)")
            .classed("selected-scatter", (d) => isInside(d));

          // 2) Collect (but do NOT style) the gallery points inside brush
          brushedGalleryPoints = scatterGroup
            .selectAll("circle.gallery-point")
            .filter((d) => isInside(d))
            .data();

          // console.log("Brushed gallery points:", brushedGalleryPoints);

          setBrushedPoints(brushedGalleryPoints);
        }
      })
      .on("end", (event) => {
        if (!zoomEnabledScatter && !event.selection) {
          // Clear highlight ONLY on base points
          scatterGroup
            .selectAll("circle:not(.gallery-point)")
            .classed("selected-scatter", false);

          // Clear stored gallery selection
          brushedGalleryPoints = [];
          setBrushedPoints(brushedGalleryPoints);
          // console.log("Brush cleared.");
        }
      });

    if (zoomEnabledScatter) {
      svg_scatter.call(zoom.transform, lastTransformScatter); // Restore zoom position
      svg_scatter.call(zoom);
    } else {
      svg_scatter.on(".zoom", null); // Disable zoom
      brushLayer.call(brush);
    }

    document
      .getElementById("zoomToggle-scatter")
      .addEventListener("change", function () {
        zoomEnabledScatter = this.checked;

        if (zoomEnabledScatter) {
          brushLayer.call(brush.move, null);
          brushLayer.selectAll("*").remove();
          svg_scatter.call(zoom.transform, lastTransformScatter);
          svg_scatter.call(zoom);
        } else {
          scatterGroup.attr("transform", lastTransformScatter);
          svg_scatter.on(".zoom", null);
          brushLayer.call(brush);
        }
      });
  });
}

// Initial load
drawScatter();

// Debounced resize listener
let resizeTimeout;
window.addEventListener("resize", () => {
  // console.log("resizing");
  drawScatter();
});

window.updateScatter = function (selectedData) {
  const selectedIds = new Set(selectedData.map((d) => d.image_name || d.id));
  s_ids = selectedIds;

  scatterGroup
    .selectAll("circle")
    .attr("fill", (d) => (d.isGallery ? "#d95f02" : "#7570b3"))
    .attr("opacity", (d) => {
      if (d.isGallery) return 1;
      if (s_ids.has(d.id)) return 0.25;
      return 0;
    });
};

window.updateScatter2 = function (selectedData) {
  scatterGroup?.selectAll("circle.gallery-point").remove();

  selectedData.forEach((d, i) => {
    scatterGroup
      .append("circle") // <-- append to the zoomed group
      .attr("class", "gallery-point") // for future cleanup if needed
      .datum({
        x: +d.PCA[0],
        y: +d.PCA[1],
        id: `gallery-${i}`,
        isGallery: true,
      })
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 1.5);
  });

  const selectedIds = new Set(selectedData.map((d, i) => `gallery-${i}`));

  scatterGroup
    .selectAll("circle")
    .attr("fill", (d) => (d.isGallery ? "#d95f02" : "#7570b3"))
    .attr("opacity", (d) => {
      if (selectedIds.has(d.id)) return 1;
      if (s_ids.has(d.id)) return 0.25;
      return 0;
    });
};
