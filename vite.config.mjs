import glsl from 'vite-plugin-glsl';

export default {
  root: './',
  base: './',
  plugins: [glsl()],
  server: {
    open: true
  }
}
