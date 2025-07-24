
'use client';

import React from 'react';
import { Mercator } from '@visx/geo';
import * as topojson from 'topojson-client';
import type { Topology } from 'topojson-specification';
import { useTheme } from 'next-themes';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';

// Using a simplified world topojson for performance
const world = {
  type: 'Topology',
  arcs: [],
  objects: {
    units: {
      type: 'GeometryCollection',
      geometries: [],
    },
  },
} as Topology;

// This would typically come from your API
const mockData = [
  { country: 'USA', value: 150 },
  { country: 'NGA', value: 250 },
  { country: 'GBR', value: 200 },
  { country: 'BRA', value: 120 },
  { country: 'IND', value: 180 },
  { country: 'CHN', value: 160 },
  { country: 'AUS', value: 90 },
];

const countryCentroids: { [key: string]: [number, number] } = {
  USA: [-98.5795, 39.8283],
  NGA: [8.6753, 9.0820],
  GBR: [-3.4360, 55.3781],
  BRA: [-51.9253, -14.2350],
  IND: [78.9629, 20.5937],
  CHN: [104.1954, 35.8617],
  AUS: [133.7751, -25.2744],
};

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(50,50,50,0.8)',
  border: '1px solid white',
  color: 'white',
};

export const AdminWorldMap = () => {
  const { theme } = useTheme();
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<{ country: string; value: number }>();
  
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    scroll: true,
    detectBounds: true,
  });

  const features = React.useMemo(() => {
    if (world.objects.units) {
      return (topojson.feature(world, world.objects.units) as any).features;
    }
    return [];
  }, []);

  return (
    <ParentSize>
      {({ width, height }) => {
        if (width < 10) return null;

        const centerX = width / 2;
        const centerY = height / 2;
        const scale = (width / 630) * 100;

        return (
          <div ref={containerRef} style={{ position: 'relative', width, height }}>
            <svg width={width} height={height}>
              <rect x={0} y={0} width={width} height={height} fill="hsl(var(--card))" rx={14} />
              <Mercator
                data={features}
                scale={scale}
                translate={[centerX, centerY]}
              >
                {(mercator) => (
                  <g>
                    {mercator.features.map(({ feature, path }, i) => (
                      <path
                        key={`map-feature-${i}`}
                        d={path || ''}
                        fill={theme === 'dark' ? 'hsl(var(--muted))' : 'hsl(var(--border))'}
                        stroke={theme === 'dark' ? 'hsl(var(--background))' : 'hsl(var(--card))'}
                        strokeWidth={0.5}
                      />
                    ))}
                    {mockData.map((d) => {
                      const centroid = countryCentroids[d.country];
                      if (!centroid) return null;

                      const [cx, cy] = mercator.path.centroid(
                        { type: 'Point', coordinates: centroid } as any
                      );
                      if(isNaN(cx) || isNaN(cy)) return null;

                      const radius = Math.max(5, Math.min(25, d.value / 10));

                      return (
                        <circle
                          key={`point-${d.country}`}
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill="hsl(var(--primary) / 0.5)"
                          stroke="hsl(var(--primary))"
                          strokeWidth={1}
                          className="transition-all duration-300 hover:fill-primary"
                          onMouseMove={() => {
                            showTooltip({
                              tooltipData: d,
                              tooltipTop: cy,
                              tooltipLeft: cx,
                            });
                          }}
                          onMouseLeave={hideTooltip}
                        />
                      );
                    })}
                  </g>
                )}
              </Mercator>
            </svg>
            {tooltipOpen && tooltipData && (
              <TooltipInPortal
                key={Math.random()}
                top={tooltipTop}
                left={tooltipLeft}
                style={tooltipStyles}
              >
                <div>
                  <strong>{tooltipData.country}</strong>
                </div>
                <div>Volume: {tooltipData.value}k</div>
              </TooltipInPortal>
            )}
          </div>
        );
      }}
    </ParentSize>
  );
};
