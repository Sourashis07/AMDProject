import React, { useEffect, useRef } from 'react';

function LineChart({ data, color, label, max = 100 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - 2 * padding) * (i / 4);
      const value = max - (max * i / 4);
      ctx.fillText(value.toFixed(0) + '%', padding - 10, y + 4);
    }

    // Draw line
    if (data.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const xStep = (width - 2 * padding) / (data.length - 1);
      
      data.forEach((value, index) => {
        const x = padding + index * xStep;
        const y = padding + (height - 2 * padding) * (1 - value / max);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw current value
      const lastValue = data[data.length - 1];
      const lastX = padding + (data.length - 1) * xStep;
      const lastY = padding + (height - 2 * padding) * (1 - lastValue / max);
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw current value text
      ctx.fillStyle = '#000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(lastValue.toFixed(1) + '%', lastX + 10, lastY + 5);
    }

    // Draw label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, 20);

  }, [data, color, label, max]);

  return <canvas ref={canvasRef} width={600} height={300} style={{ width: '100%', height: 'auto' }} />;
}

export default LineChart;
