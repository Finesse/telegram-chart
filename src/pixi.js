import {Renderer, BatchRenderer} from '@pixi/core';

Renderer.registerPlugin('batch', BatchRenderer);

// Extract only the required stuff to reduce the bundle size
export {Application} from '@pixi/app';
export {Container} from '@pixi/display';
export {Graphics} from '@pixi/graphics';
export {Text, TextStyle} from '@pixi/text';
