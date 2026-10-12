import React from 'react';
import SliderCanvas from './SliderCanvas';

export default function InteractiveDemo() {
  return (
    <div>
      <h3>交互式动画演示</h3>
      <p>下方是一个纯前端 Canvas 动画，通过滑块实时控制参数：</p>
      <SliderCanvas />
    </div>
  );
}
