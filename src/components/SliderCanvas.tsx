import React, { useEffect, useRef, useState } from 'react';

export default function SliderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [speed, setSpeed] = useState(2);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let x = 20;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#2e8555';
      ctx.beginPath();
      ctx.arc(x, 60, 20, 0, Math.PI * 2);
      ctx.fill();
      x += speed;
      if (x > canvas.width - 20) x = 20;
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animRef.current);
  }, [speed]);

  return (
    <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
      <label>
        速度：{speed}
        <input
          type="range"
          min="1"
          max="10"
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
      <canvas
        ref={canvasRef}
        width={600}
        height={120}
        style={{ border: '1px solid #eee', marginTop: '0.5rem', display: 'block' }}
      />
      <p style={{ fontSize: '0.85rem', color: '#666' }}>↑ 拖动滑块改变动画速度</p>
    </div>
  );
}
