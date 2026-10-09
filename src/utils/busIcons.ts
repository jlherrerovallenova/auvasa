import type { BusFleetInfo } from './fleet.ts';

export interface BusMarkerRenderOptions {
  fleet: BusFleetInfo;
  lineName: string;
  routeColor: string;
  routeTextColor?: string;
  vehicleId?: string | null;
  speed?: number;
  bearing?: number;
}

/**
 * Genera un marcador de autobús tipo badge circular compacto:
 * - Círculo coloreado con el número de línea bien visible
 * - Indicador de dirección (flecha) según el bearing
 * - Anillo animado pulsante para dar sensación de movimiento en tiempo real
 * - Sin dibujo de autobús: limpio, legible a cualquier zoom
 */
export function getBusSvgIllustration({
  lineName,
  routeColor,
  routeTextColor = '#FFFFFF',
  bearing,
}: BusMarkerRenderOptions): string {
  const cleanLine = (lineName || '?').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanColor = routeColor || '#008075';
  const cleanText = routeTextColor || '#FFFFFF';

  // Font size adaptado al largo del texto para máxima legibilidad
  const fontSize = cleanLine.length > 2 ? 14 : 18;

  // Calcular rotación de la flecha de dirección (bearing en grados, 0=norte)
  const hasBearing = typeof bearing === 'number' && !isNaN(bearing);
  const arrowRotate = hasBearing ? bearing : 0;
  const showArrow = hasBearing;

  // Degradado radial para dar volumen al círculo
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
    <defs>
      <radialGradient id="bg_${cleanLine.replace(/\s/g,'')}" cx="38%" cy="32%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.18"/>
      </radialGradient>
      <filter id="shadow_bus" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="rgba(0,0,0,0.5)"/>
      </filter>
    </defs>

    <!-- Anillo exterior pulsante (da sensación de vehículo activo) -->
    <circle cx="18" cy="18" r="17" fill="none" stroke="${cleanColor}" stroke-width="2" opacity="0.35">
      <animate attributeName="r" values="15.5;17;15.5" dur="2.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.35;0.08;0.35" dur="2.2s" repeatCount="indefinite"/>
    </circle>

    <!-- Círculo principal amplio y legible -->
    <circle cx="18" cy="18" r="15.2" fill="${cleanColor}" filter="url(#shadow_bus)"/>
    <!-- Overlay de brillo -->
    <circle cx="18" cy="18" r="15.2" fill="url(#bg_${cleanLine.replace(/\s/g,'')})"/>

    <!-- Número / nombre de línea -->
    <text
      x="18" y="18"
      font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif"
      font-size="${fontSize}"
      font-weight="900"
      fill="${cleanText}"
      text-anchor="middle"
      dominant-baseline="central"
      letter-spacing="-0.5"
    >${cleanLine}</text>

    <!-- Flecha de dirección (solo si hay bearing) -->
    ${showArrow ? `
    <g transform="rotate(${arrowRotate}, 18, 18)" opacity="0.9">
      <polygon points="18,2 21,8 18,6 15,8" fill="${cleanText}" opacity="0.85"/>
    </g>` : ''}
  </svg>`;
}

/**
 * Crea el HTML wrapper para Leaflet DivIcon con badge circular
 */
export function getBusMarkerHtml(opts: BusMarkerRenderOptions): string {
  const size = 36;
  const svg = getBusSvgIllustration(opts);

  return `
    <div class="bus-custom-marker-wrap" style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      cursor: pointer;
      transform-origin: center center;
      transition: transform 0.15s ease-out;
      user-select: none;
    ">
      ${svg}
    </div>
  `;
}
