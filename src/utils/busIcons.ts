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
 * Generates high-visibility SVG illustration for AUVASA bus models
 * with large, prominent line numbers that remain crystal clear at any zoom level.
 */
export function getBusSvgIllustration({
  fleet,
  lineName,
  routeColor,
  routeTextColor = '#FFFFFF',
  vehicleId: _vehicleId,
}: BusMarkerRenderOptions): string {
  const isArticulated = fleet.isArticulated || fleet.typeKey === 'irizar-ie-tram-articulated' || fleet.typeKey === 'articulated-gnc';
  const viewBox = isArticulated ? '0 0 76 30' : '0 0 54 30';

  // Safe line name and colors
  const cleanLine = (lineName || '?').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanColor = routeColor || '#008075';
  const cleanTextColor = routeTextColor || '#FFFFFF';

  // Compute badge width according to character count for perfect fit
  const badgeWidth = isArticulated 
    ? (cleanLine.length > 2 ? 26 : 22)
    : (cleanLine.length > 2 ? 28 : 22);

  if (fleet.typeKey === 'irizar-ie-tram-articulated') {
    // 1. IRIZAR IE TRAM 18M ARTICULADO (100% Eléctrico con fuelle)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <defs>
        <linearGradient id="ieBodyA" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="ieGlassA" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Front Car Body -->
      <path d="M3 12 C3 7, 10 5, 18 5 L32 5 L32 24 L5 24 C3 24, 3 18, 3 14 Z" fill="url(#ieBodyA)" stroke="#64748b" stroke-width="0.8"/>
      
      <!-- Rear Car Body -->
      <path d="M38 5 L70 5 C73 5, 74 8, 74 13 L74 24 L38 24 Z" fill="url(#ieBodyA)" stroke="#64748b" stroke-width="0.8"/>

      <!-- Roof Fairing / Pantograph Pod (100% Electric Turquoise) -->
      <path d="M8 5 C12 2, 24 2, 30 4 L32 5 L8 5 Z" fill="#10b981" opacity="0.95"/>
      <path d="M38 5 L64 4 C69 2, 72 4, 73 5 Z" fill="#10b981" opacity="0.95"/>

      <!-- Central Accordion Bellows / Fuelle -->
      <g fill="#18181b" stroke="#000000" stroke-width="0.5">
        <rect x="32" y="5" width="2" height="19" rx="0.5"/>
        <rect x="34" y="4.5" width="2" height="20" rx="0.5" fill="#27272a"/>
        <rect x="36" y="5" width="2" height="19" rx="0.5"/>
      </g>

      <!-- Aerodynamic Front Windshield -->
      <path d="M4 14 C4 9, 8 7, 13 7 L14 17 L4 17 Z" fill="url(#ieGlassA)"/>

      <!-- Windows -->
      <rect x="42" y="7" width="13" height="9" rx="1.5" fill="url(#ieGlassA)"/>
      <rect x="58" y="7" width="13" height="9" rx="1.5" fill="url(#ieGlassA)"/>

      <!-- Electric Zap Icon -->
      <circle cx="6.5" cy="9.5" r="2.5" fill="#10b981"/>
      <path d="M6.5 8 L5.5 9.7 L6.5 9.7 L6.3 11 L7.5 9.3 L6.5 9.3 Z" fill="#ffffff"/>

      <!-- 3 Axle Wheels -->
      <circle cx="12" cy="24" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>
      
      <circle cx="46" cy="24" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="46" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="65" cy="24" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="65" cy="24" r="1.5" fill="#cbd5e1"/>

      <!-- Large Prominent Line Number Badge -->
      <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
      <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
    </svg>`;
  }

  if (fleet.typeKey === 'irizar-ie-tram-standard') {
    // 2. IRIZAR IE TRAM 12M ESTÁNDAR (100% Eléctrico)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <defs>
        <linearGradient id="ieBodyS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="ieGlassS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Main Tram Body -->
      <path d="M3 13 C3 7, 9 5, 17 5 L49 5 C51 5, 52 7, 52 11 L52 24 L5 24 C3 24, 3 18, 3 14 Z" fill="url(#ieBodyS)" stroke="#64748b" stroke-width="0.8"/>

      <!-- Roof Battery Fairing -->
      <path d="M9 5 C13 2, 34 2, 44 3 L49 5 L9 5 Z" fill="#10b981" opacity="0.95"/>

      <!-- Front Windshield -->
      <path d="M4 14 C4 9, 8 7, 13 7 L14 17 L4 17 Z" fill="url(#ieGlassS)"/>

      <!-- Rear Windows -->
      <rect x="38" y="7" width="12" height="9" rx="1.5" fill="url(#ieGlassS)"/>

      <!-- Electric Zap Icon -->
      <circle cx="6.5" cy="9.5" r="2.5" fill="#10b981"/>
      <path d="M6.5 8 L5.5 9.7 L6.5 9.7 L6.3 11 L7.5 9.3 L6.5 9.3 Z" fill="#ffffff"/>

      <!-- Wheels -->
      <circle cx="12" cy="24" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="43" cy="24" r="3.5" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="43" cy="24" r="1.5" fill="#cbd5e1"/>

      <!-- Large Prominent Line Number Badge -->
      <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
      <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
    </svg>`;
  }

  if (fleet.typeKey === 'solaris-urbino-hybrid') {
    // 3. SOLARIS URBINO HÍBRIDO
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <defs>
        <linearGradient id="solBodyS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="solGlassS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Roof Hybrid Pack -->
      <rect x="18" y="2" width="18" height="3.5" rx="1.5" fill="#8b5cf6" stroke="#6d28d9" stroke-width="0.5"/>

      <!-- Body with Asymmetric Front Cut -->
      <path d="M3 12 L6 5 L49 5 C51 5, 52 7, 52 10 L52 24 L4 24 C3 24, 2 20, 3 12 Z" fill="url(#solBodyS)" stroke="#94a3b8" stroke-width="0.8"/>
      <!-- Lower Turquoise Stripe -->
      <path d="M3 20 L52 20 L52 24 L3 24 Z" fill="#008075"/>

      <!-- Solaris Windshield -->
      <path d="M4 12 L6 6 L13 6 L12 16 L4 16 Z" fill="url(#solGlassS)"/>

      <!-- Rear Window -->
      <rect x="38" y="7" width="12" height="9" rx="1.5" fill="url(#solGlassS)"/>

      <!-- Wheels -->
      <circle cx="12" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="43" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="43" cy="24" r="1.5" fill="#cbd5e1"/>

      <!-- Large Prominent Line Number Badge -->
      <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
      <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
    </svg>`;
  }

  if (fleet.typeKey === 'man-lions-city-gnc') {
    // 4. MAN LION'S CITY GNC
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <defs>
        <linearGradient id="manBodyS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="manGlassS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Roof GNC Gas Tank Dome -->
      <path d="M8 5 C8 1.5, 28 1.5, 34 5 Z" fill="#06b6d4" stroke="#0891b2" stroke-width="0.5"/>

      <!-- Main Body -->
      <rect x="3" y="5" width="49" height="19" rx="2.5" fill="url(#manBodyS)" stroke="#94a3b8" stroke-width="0.8"/>
      <!-- Lower Turquoise Stripe -->
      <path d="M3 20 L52 20 L52 24 L3 24 Z" fill="#008075"/>

      <!-- Front Mask & Windshield -->
      <path d="M3 7 L12 7 L12 16 L3 16 Z" fill="url(#manGlassS)"/>

      <!-- Rear Window -->
      <rect x="38" y="7" width="12" height="9" rx="1.5" fill="url(#manGlassS)"/>

      <!-- Wheels -->
      <circle cx="12" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="43" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="43" cy="24" r="1.5" fill="#cbd5e1"/>

      <!-- Large Prominent Line Number Badge -->
      <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
      <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
    </svg>`;
  }

  if (fleet.typeKey === 'articulated-gnc') {
    // 5. ARTICULADO ORUGA 18M
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <defs>
        <linearGradient id="artBodyS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="artGlassS" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Front Body -->
      <rect x="3" y="5" width="29" height="19" rx="2.5" fill="url(#artBodyS)" stroke="#94a3b8" stroke-width="0.8"/>
      <!-- Rear Body -->
      <rect x="38" y="5" width="36" height="19" rx="2.5" fill="url(#artBodyS)" stroke="#94a3b8" stroke-width="0.8"/>

      <!-- Roof Gas Dome -->
      <path d="M8 5 C8 2, 22 2, 26 5 Z" fill="#0284c7" opacity="0.9"/>

      <!-- Central Fuelle -->
      <g fill="#18181b" stroke="#000000" stroke-width="0.5">
        <rect x="32" y="5" width="2" height="19" rx="0.5"/>
        <rect x="34" y="4.5" width="2" height="20" rx="0.5" fill="#27272a"/>
        <rect x="36" y="5" width="2" height="19" rx="0.5"/>
      </g>

      <!-- Windshield & Windows -->
      <path d="M4 7 L12 7 L12 16 L4 16 Z" fill="url(#artGlassS)"/>
      <rect x="42" y="7" width="13" height="9" rx="1.5" fill="url(#artGlassS)"/>
      <rect x="58" y="7" width="13" height="9" rx="1.5" fill="url(#artGlassS)"/>

      <!-- Lower Turquoise Stripe -->
      <path d="M3 20 L32 20 L32 24 L3 24 Z" fill="#008075"/>
      <path d="M38 20 L74 20 L74 24 L38 24 Z" fill="#008075"/>

      <!-- 3 Axles -->
      <circle cx="12" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="46" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="46" cy="24" r="1.5" fill="#cbd5e1"/>

      <circle cx="65" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="65" cy="24" r="1.5" fill="#cbd5e1"/>

      <!-- Large Prominent Line Number Badge -->
      <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
      <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
    </svg>`;
  }

  // 6. DEFAULT / CASTROSUA / MERCEDES GNC URBANO ESTÁNDAR
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
    <defs>
      <linearGradient id="stdBodyS" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="#f1f5f9"/>
        <stop offset="100%" stop-color="#008075"/>
      </linearGradient>
      <linearGradient id="stdGlassS" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>

    <!-- Roof Gas Tank Container -->
    <rect x="16" y="2.5" width="22" height="3" rx="1.5" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5"/>

    <!-- Main Bus Body -->
    <rect x="3" y="5" width="49" height="19" rx="2.5" fill="url(#stdBodyS)" stroke="#94a3b8" stroke-width="0.8"/>
    <!-- Lower Turquoise Stripe -->
    <path d="M3 20 L52 20 L52 24 L3 24 Z" fill="#008075"/>

    <!-- Front Windshield -->
    <path d="M4 7 L12 7 L12 16 L4 16 Z" fill="url(#stdGlassS)"/>

    <!-- Rear Window -->
    <rect x="38" y="7" width="12" height="9" rx="1.5" fill="url(#stdGlassS)"/>

    <!-- Wheels -->
    <circle cx="12" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
    <circle cx="12" cy="24" r="1.5" fill="#cbd5e1"/>

    <circle cx="43" cy="24" r="3.5" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
    <circle cx="43" cy="24" r="1.5" fill="#cbd5e1"/>

    <!-- Large Prominent Line Number Badge -->
    <rect x="14" y="5" width="${badgeWidth}" height="14.5" rx="3.5" fill="${cleanColor}" stroke="#ffffff" stroke-width="1.6"/>
    <text x="${14 + badgeWidth / 2}" y="13" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', Roboto, sans-serif" font-size="11" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>
  </svg>`;
}

/**
 * Creates the HTML wrapper for Leaflet DivIcon with prominent, high-legibility numbers
 */
export function getBusMarkerHtml(opts: BusMarkerRenderOptions): string {
  const isArticulated = opts.fleet.isArticulated || opts.fleet.typeKey === 'irizar-ie-tram-articulated' || opts.fleet.typeKey === 'articulated-gnc';
  const width = isArticulated ? 62 : 46;
  const height = 26;
  const svg = getBusSvgIllustration(opts);

  return `
    <div class="bus-custom-marker-wrap" style="
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: ${width}px;
      height: ${height}px;
      cursor: pointer;
      transform-origin: center center;
      transition: transform 0.15s ease-out;
      user-select: none;
    ">
      ${svg}
    </div>
  `;
}
