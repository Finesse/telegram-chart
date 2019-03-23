import {Renderer, BatchRenderer} from '@pixi/core';
import {skipHello} from '@pixi/utils';

if (process.env.NODE_ENV === 'production') {
  skipHello();
}
Renderer.registerPlugin('batch', BatchRenderer);

// Extract only the required stuff to reduce the bundle size
export {Application} from '@pixi/app';
export {Container} from '@pixi/display';
export {Graphics} from '@pixi/graphics';
export {Text, TextStyle} from '@pixi/text';
export {Sprite} from '@pixi/sprite';
export {Filter, defaultFilterVertex} from '@pixi/core';
