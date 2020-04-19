const width = window.innerWidth
const height = window.innerHeight
const size = [width / 2, height / 2]

const config = {
  speed: -0.008,
  verticalTilt: -24,
  horizontalTilt: 0,
}

let locations = []

const svg = d3.select('svg').attr('width', width).attr('height', height)
const projection = d3.geoOrthographic().translate(size)
const initialScale = projection.scale()
const path = d3.geoPath().projection(projection)

const oceanFill = svg
  .append('defs')
  .append('radialGradient')
  .attr('id', 'ocean-fill')
  .attr('cx', '75%')
  .attr('cy', '25%')
oceanFill.append('stop').attr('offset', '5%').attr('stop-color', '#ddf')
oceanFill.append('stop').attr('offset', '100%').attr('stop-color', '#9ab')
svg
  .append('circle')
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('pointer-events', 'none')
  .style('fill', 'url(#ocean-fill)')

const featureGroup = svg.append('g')
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
  .attr('stop-color', '#ffd')
  .attr('stop-opacity', '0.6')
globeHighlight
  .append('stop')
  .attr('offset', '100%')
  .attr('stop-color', '#ba9')
  .attr('stop-opacity', '0.2')
svg
  .append('circle')
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('pointer-events', 'none')
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
  .attr('cx', size[0])
  .attr('cy', size[1])
  .attr('r', initialScale)
  .style('pointer-events', 'none')
  .style('fill', 'url(#globe-shading)')

const markerGroup = svg.append('g')

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
    .style('stroke', '#aaa')
    .style('stroke-width', '1px')
    .style('fill', '#e5e5e5')

  svg.call(
    d3.zoom().on('zoom', () => {
      const newScale = initialScale * d3.event.transform.k
      projection.scale(newScale)
      d3.selectAll('circle').attr('r', newScale)
      render()
    })
  )
})

d3.json(
  'https://api2.hackclub.com/v0/Operations/Clubs/?select=%7B%22fields%22:%5B%22Name%22,%22Latitude%22,%22Longitude%22,%22Customized%20Name%22%5D,%22filterByFormula%22:%22AND(%7BRejected%7D=0,%7BDummy%7D=0,%7BDropped%7D=0)%22%7D'
)
  .then((data) => _.filter(data, (c) => !_.isEmpty(c.fields['Latitude'])))
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

// Spinning animation
// /*
d3.timer((elapsed) => {
  projection.rotate([
    config.speed * elapsed - 256,
    config.verticalTilt,
    config.horizontalTilt,
  ])

  render()
  drawMarkers()
})
// */

// City markers
function drawMarkers() {
  const markers = markerGroup.selectAll('circle').data(locations)
  markers
    .enter()
    .append('circle')
    .merge(markers)
    .attr('cx', ({ lng, lat }) => projection([lng, lat])[0])
    .attr('cy', ({ lng, lat }) => projection([lng, lat])[1])
    .attr('fill', ({ lng, lat }) => {
      const coordinate = [lng, lat]
      gdistance = d3.geoDistance(coordinate, projection.invert(size))
      return gdistance > 1.625 ? 'none' : '#ec3750'
    })
    .attr('r', (projection.scale() / initialScale) * 6)
    .on('mouseenter', (club) => {
      d3.select('#banner').text(club.name).style('opacity', 1)
    })
    .on('click', (club) => {
      d3.select('#banner').text(club.name).style('opacity', 1)
    })
  // .on('mouseleave', () => {
  // 	d3.select('#banner').text('').style('opacity', 0)
  // })
  svg.append(markers)
}

drawMarkers()
