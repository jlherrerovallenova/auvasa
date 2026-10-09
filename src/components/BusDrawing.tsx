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

const PRESET_DIMENSIONS: Record<string, { std: [string, string]; art: [string, string] }> = {
  xs: { std: ['30px', '30px'], art: ['30px', '30px'] },
  sm: { std: ['44px', '44px'], art: ['44px', '44px'] },
  md: { std: ['52px', '52px'], art: ['52px', '52px'] },
  lg: { std: ['64px', '64px'], art: ['64px', '64px'] },
};

function resolveDimensions(
  size: 'xs' | 'sm' | 'md' | 'lg',
  isArticulated: boolean,
  width?: number | string,
  height?: number | string
) {
  if (width || height) {
    return { width, height };
  }
  const preset = PRESET_DIMENSIONS[size] || PRESET_DIMENSIONS.sm;
  const [w, h] = isArticulated ? preset.art : preset.std;
  return { width: w, height: h };
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
  const dimensions = resolveDimensions(size, isArticulated, width, height);

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
      style={dimensions}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
};
