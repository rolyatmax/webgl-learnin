/* global requestAnimationFrame */
const fit = require('canvas-fit')
const { GUI } = require('dat.gui')
const createRegl = require('regl')
const createCamera = require('3d-view-controls')
const mat4 = require('gl-mat4')

const { cities } = require('./data/cities.json')

const canvas = document.body.appendChild(document.createElement('canvas'))
const resize = fit(canvas)
window.addEventListener('resize', resize)
const regl = createRegl(canvas)
const camera = createCamera(canvas)
camera.lookAt([2, 2, 2], [0, 0, 0], [0, 1, 0])

const settings = {
  pointSize: 1,
  primitive: 'points',
  alpha: 0.8
}

const gui = new GUI()
gui.add(settings, 'pointSize', 0, 50)
gui.add(settings, 'alpha', 0, 1)
gui.add(settings, 'primitive', ['points', 'lines', 'triangles'])

const lnglats = cities.map(city => city.lnglat)

const draw = regl({
  primitive: () => settings.primitive,
  count: lnglats.length,
  attributes: {
    lnglat: lnglats
  },
  uniforms: {
    alpha: () => settings.alpha,
    view: () => camera.matrix,
    projection: () => mat4.perspective([], Math.PI / 4, canvas.width / canvas.height, 0.01, 100),
    pointSize: () => settings.pointSize
  },
  blend: {
    enable: true,
    func: {
      src: 'src alpha',
      dst: 'one'
    }
  },
  vert: `
  attribute vec2 lnglat;
  uniform float pointSize;
  uniform mat4 projection;
  uniform mat4 view;

  vec3 getPosition(vec2 lnglat) {
    vec2 rads = radians(lnglat);
    return vec3(
      cos(rads.y) * sin(rads.x),
      sin(rads.y),
      cos(rads.y) * cos(rads.x)
    );
  }

  void main() {
    vec3 position = getPosition(lnglat);
    gl_PointSize = pointSize;
    gl_Position = projection * view * vec4(position, 1);
  }
  `,
  frag: `
  precision highp float;
  uniform float alpha;
  void main() {
    gl_FragColor = vec4(0.25, 0.35, 0.45, alpha);
  }
  `
})

function render () {
  regl.clear({
    color: [0.13, 0.13, 0.13, 1]
  })
  camera.tick()
  camera.up = [0, 1, 0]
  draw()
}

requestAnimationFrame(function loop () {
  requestAnimationFrame(loop)
  render()
})
