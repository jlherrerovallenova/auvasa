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
  width,
  height,
}) => {
  const svgString = getBusSvgIllustration({
    fleet,
    lineName,
    routeColor,
    routeTextColor,
    vehicleId,
  });

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
