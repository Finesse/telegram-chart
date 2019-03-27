import {Filter, defaultFilterVertex} from './index';

const fragmentShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float r;
uniform float g;
uniform float b;

void main(void) {
    float opacity = texture2D(uSampler, vTextureCoord).a;
    gl_FragColor = vec4(r * opacity, g * opacity, b * opacity, opacity);
}
`;

/**
 * Replaces all the sprite color with the given color considering the alpha channel
 */
export default class ColorizeFilter extends Filter {
  constructor(color = 0x000000) {
    super(defaultFilterVertex, fragmentShader);
    this.setColor(color);
  }

  setColor(color) {
    this.uniforms.r = ((color >> 16) % 0x100) / 0xff;
    this.uniforms.g = ((color >> 8) % 0x100) / 0xff;
    this.uniforms.b = (color % 0x100) / 0xff;
  }
}
