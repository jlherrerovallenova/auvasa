import React from 'react';
import type { BusFleetInfo } from '../utils/fleet.ts';
import { getBusSvgIllustration } from '../utils/busIcons.ts';

interface BusDrawingProps {
  fleet: BusFleetInfo;
  lineName: string;
  routeColor: string;
  routeTextColor?: string;
  vehicleId?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  width?: number | string;
  height?: number | string;
}

export const BusDrawing: React.FC<BusDrawingProps> = ({
  fleet,
  lineName,
  routeColor,
  routeTextColor = '#FFFFFF',
  vehicleId,
  className = '',
  size = 'sm',
  width,
  height,
}) => {
  const isArticulated = fleet.isArticulated || fleet.typeKey === 'irizar-ie-tram-articulated' || fleet.typeKey === 'articulated-gnc';

  // Compute preset dimensions if width/height are not provided
  let computedWidth = width;
  let computedHeight = height;

  if (!computedWidth && !computedHeight) {
    switch (size) {
      case 'xs':
        computedWidth = isArticulated ? '38px' : '28px';
        computedHeight = '14px';
        break;
      case 'sm':
        computedWidth = isArticulated ? '46px' : '34px';
        computedHeight = '17px';
        break;
      case 'md':
        computedWidth = isArticulated ? '58px' : '44px';
        computedHeight = '22px';
        break;
      case 'lg':
        computedWidth = isArticulated ? '80px' : '60px';
        computedHeight = '30px';
        break;
    }
  }

  const svgString = getBusSvgIllustration({
    fleet,
    lineName,
    routeColor,
    routeTextColor,
    vehicleId,
  });

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: computedWidth, height: computedHeight }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
