import React, { useEffect, useRef, useState } from 'react';

const provinceColors = {
  default: '#444',
  hover: '#4F8AFA',
  selected: '#FFD600',
};

const VietnamSVGMap = ({ selectedProvince, onProvinceClick }) => {
  const svgRef = useRef(null);
  const [hoveredProvince, setHoveredProvince] = useState(null);

  useEffect(() => {
    fetch('/src/assets/map.svg')
      .then(res => res.text())
      .then(svgText => {
        if (svgRef.current) {
          svgRef.current.innerHTML = svgText;

          // Gắn sự kiện cho từng path có id (tỉnh)
          const paths = svgRef.current.querySelectorAll('path[id]');
          paths.forEach(path => {
            const id = path.getAttribute('id');
            // Màu mặc định
            path.setAttribute('fill',
              selectedProvince === id
                ? provinceColors.selected
                : hoveredProvince === id
                  ? provinceColors.hover
                  : provinceColors.default
            );
            // Sự kiện hover
            path.onmouseenter = () => {
              setHoveredProvince(id);
            };
            path.onmouseleave = () => {
              setHoveredProvince(null);
            };
            // Sự kiện click
            path.onclick = () => {
              if (onProvinceClick) onProvinceClick(id);
            };
            // Style pointer
            path.style.cursor = 'pointer';
            path.style.transition = 'fill 0.2s';
          });
        }
      });
  }, [selectedProvince, hoveredProvince, onProvinceClick]);

  // Khi hover thay đổi, cập nhật lại màu
  useEffect(() => {
    if (svgRef.current) {
      const paths = svgRef.current.querySelectorAll('path[id]');
      paths.forEach(path => {
        const id = path.getAttribute('id');
        path.setAttribute('fill',
          selectedProvince === id
            ? provinceColors.selected
            : hoveredProvince === id
              ? provinceColors.hover
              : provinceColors.default
        );
      });
    }
  }, [hoveredProvince, selectedProvince]);

  return (
    <div className="w-full h-full bg-transparent">
      <div ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default VietnamSVGMap; 