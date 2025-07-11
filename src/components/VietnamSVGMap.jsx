import React, { useEffect, useRef, useState } from 'react';

function generateGoldenAnglePalette(n) {
  const colors = [];
  const saturation = 80; // tươi
  const lightness = 50;  // sáng
  let hue = 0;
  const goldenAngle = 137.508; // độ
  for (let i = 0; i < n; i++) {
    colors.push(`hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`);
    hue = (hue + goldenAngle) % 360;
  }
  return colors;
}

const colorPalette = generateGoldenAnglePalette(189);

const VietnamSVGMap = ({ selectedProvince, onProvinceClick }) => {
  const svgRef = useRef(null);
  const [hoveredProvince, setHoveredProvince] = useState(null);

  useEffect(() => {
    fetch('/src/assets/map_with_ids.svg')
      .then(res => res.text())
      .then(svgText => {
        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;
          const paths = svgRef.current.querySelectorAll('path[id]');
          paths.forEach(path => {
            const id = path.getAttribute('id');
            let fillColor = '#444'; // default
            if (Array.isArray(selectedProvince) && selectedProvince.includes(id)) {
              const idx = selectedProvince.indexOf(id);
              fillColor = colorPalette[idx % colorPalette.length];
            } else if (hoveredProvince === id) {
              fillColor = '#4F8AFA';
            }
            path.setAttribute('fill', fillColor);
            // Hover/click event
            path.onmouseenter = () => setHoveredProvince(id);
            path.onmouseleave = () => setHoveredProvince(null);
            path.onclick = () => {
              if (onProvinceClick) onProvinceClick(id);
            };
            path.style.cursor = 'pointer';
            path.style.transition = 'fill 0.2s';
          });
        }
      });
  }, [selectedProvince, hoveredProvince, onProvinceClick]);

  return (
    <div className="w-full h-full bg-transparent">
      <div ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default VietnamSVGMap; 