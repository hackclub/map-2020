// Initialization
const width = window.innerWidth
const height = window.innerHeight
const size = [width / 2, height / 2]

const svg = d3.select('svg').attr('width', width).attr('height', height)
const projection = d3.geoOrthographic().translate(size)
const initialScale = projection.scale()
const path = d3.geoPath().projection(projection)
let locations = []

// Draw layers
const oceanFill = svg
  .append('defs')
  .append('radialGradient')
  .attr('id', 'ocean-fill')
  .attr('cx', '75%')
  .attr('cy', '25%')
oceanFill.append('stop').attr('offset', '10%').attr('stop-color', '#5bc0de')
oceanFill.append('stop').attr('offset', '100%').attr('stop-color', '#338eda')
svg
  .append('circle')
  .attr('class', 'layer')
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('fill', 'url(#ocean-fill)')

const featureGroup = svg.append('g').attr('id', 'features')
const render = () => svg.selectAll('.segment').attr('d', path)

const globeHighlight = svg
  .append('defs')
  .append('radialGradient')
  .attr('id', 'globe-highlight')
  .attr('cx', '75%')
  .attr('cy', '25%')
globeHighlight
  .append('stop')
  .attr('offset', '5%')
  .attr('stop-color', '#dff')
  .attr('stop-opacity', '0.5')
globeHighlight
  .append('stop')
  .attr('offset', '100%')
  .attr('stop-color', '#9ab')
  .attr('stop-opacity', '0.0625')
svg
  .append('circle')
  .attr('class', 'layer')
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('fill', 'url(#globe-highlight)')

const globeShading = svg
  .append('defs')
  .append('radialGradient')
  .attr('id', 'globe-shading')
  .attr('cx', '50%')
  .attr('cy', '40%')
globeShading
  .append('stop')
  .attr('offset', '50%')
  .attr('stop-color', '#9ab')
  .attr('stop-opacity', '0')
globeShading
  .append('stop')
  .attr('offset', '100%')
  .attr('stop-color', '#3e6184')
  .attr('stop-opacity', '0.3')
svg
  .append('circle')
  .attr('class', 'layer')
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('fill', 'url(#globe-shading)')

const markerGroup = svg.append('g').attr('id', 'markers')

// Rotation + interactivity
const rotationDelay = 3000
const autorotate = d3.timer(rotate)
let lastTime = d3.now()
function degPerMs() {
  // rotate faster when zoomed out,
  // rotate slower when zoomed in
  return 2 / projection.scale()
}
let rotate0, coords0

function startRotation(delay) {
  autorotate.restart(rotate, rotationDelay)
}

function stopRotation() {
  autorotate.stop()
}

function rotate(elapsed) {
  now = d3.now()
  diff = now - lastTime
  if (diff < elapsed) {
    rotation = projection.rotate()
    rotation[0] += (diff % 60) * degPerMs()
    projection.rotate(rotation)
    render()
    drawMarkers()
  } else {
    // this only needs to run once
    d3.select('#banner').style('opacity', 0)
  }
  lastTime = now
}

const coords = () => projection.rotate(rotate0).invert([d3.event.x, d3.event.y])

svg
  .call(
    d3
      .drag()
      .on('start', () => {
        rotate0 = projection.rotate()
        coords0 = coords()
      })
      .on('drag', () => {
        const coords1 = coords()
        projection.rotate([
          rotate0[0] + coords1[0] - coords0[0],
          rotate0[1] + coords1[1] - coords0[1],
        ])
        render()
        drawMarkers()
      })
      .on('end', () => {
        lastTime = d3.now()
        startRotation()
      })
      .filter(() => !(d3.event.touches && d3.event.touches.length === 2))
  )
  .call(
    d3.zoom().on('zoom', () => {
      const newScale = initialScale * d3.event.transform.k
      projection.scale(newScale)
      d3.selectAll('.layer').attr('r', newScale)
      render()
      drawMarkers()
    })
  )

// Import geographies
d3.json(
  'https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json'
).then((worldData) => {
  featureGroup
    .selectAll('.segment')
    .data(topojson.feature(worldData, worldData.objects.countries).features)
    .enter()
    .append('path')
    .attr('class', 'segment')
    .attr('d', path)
})

d3.json(
  'https://api2.hackclub.com/v0/Operations/Clubs/?select=%7B%22fields%22:%5B%22Name%22,%22Latitude%22,%22Longitude%22,%22Customized%20Name%22%5D,%22filterByFormula%22:%22AND(%7BRejected%7D=0,%7BDummy%7D=0,%7BDropped%7D=0)%22%7D'
)
  .then((data) => _.filter(data, (c) => !_.isEmpty(c.fields['Latitude'])))
  .then((data) => _.filter(data, (c) => c.fields['Latitude'] != 0))
  .then((clubs) => {
    console.log(clubs.length)
    clubs.forEach(({ fields }) => {
      locations.push({
        name: fields['Name'],
        lat: fields['Latitude'][0],
        lng: fields['Longitude'][0],
      })
    })
    return locations
  })
  .then(() => {
    drawMarkers()
  })

// Draw club markers
function drawMarkers() {
  const markers = markerGroup.selectAll('circle').data(locations)
  markers
    .enter()
    .append('circle')
    .merge(markers)
    .attr('r', 6)
    .attr('cx', ({ lng, lat }) => projection([lng, lat])[0])
    .attr('cy', ({ lng, lat }) => projection([lng, lat])[1])
    .attr('fill', ({ lng, lat }) => {
      gdistance = d3.geoDistance([lng, lat], projection.invert(size))
      return gdistance > 1.625 ? 'none' : '#ec3750'
    })
    .on('mouseenter', (club) => {
      d3.select('#banner').text(club.name).style('opacity', 1)
    })
    .on('click', (club) => {
      d3.select('#banner').text(club.name).style('opacity', 1)
    })
  svg.append(markers)
}

drawMarkers()
