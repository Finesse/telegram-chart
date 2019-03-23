import {Filter, defaultFilterVertex} from './index';

const fragmentShader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float r;
uniform float g;
uniform float b;

void main(void) {
    vec4 c = texture2D(uSampler, vTextureCoord);

    if (c.a > 0.0) {
      c.rgb /= c.a;
    }

    vec3 color = vec3(r, g, b);
    gl_FragColor = vec4(color * c.a, c.a);
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
