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
 * Generates an SVG illustration customized for each specific AUVASA bus model.
 * Width & height are responsive, with standard buses at 76x38 and articulated at 104x38.
 */
export function getBusSvgIllustration({
  fleet,
  lineName,
  routeColor,
  routeTextColor = '#FFFFFF',
  vehicleId,
}: BusMarkerRenderOptions): string {
  const isArticulated = fleet.isArticulated || fleet.typeKey === 'irizar-ie-tram-articulated' || fleet.typeKey === 'articulated-gnc';
  const width = isArticulated ? 98 : 72;
  const height = 36;
  const unitNum = vehicleId ? `#${vehicleId}` : '';

  // Safe XML lineName
  const cleanLine = (lineName || '?').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanColor = routeColor || '#008075';
  const cleanTextColor = routeTextColor || '#FFFFFF';

  if (fleet.typeKey === 'irizar-ie-tram-articulated') {
    // IRIZAR IE TRAM 18M ARTICULADO (Futurista 100% Eléctrico con fuelle)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <defs>
        <linearGradient id="ieTramBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="40%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="ieTramGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="ieTramSilver" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#008075"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
      </defs>

      <!-- Front Car Body -->
      <path d="M4 12 C4 8, 12 5, 22 5 L44 5 L44 29 L7 29 C4 29, 4 22, 4 18 Z" fill="url(#ieTramBody)" stroke="#475569" stroke-width="0.7"/>
      
      <!-- Rear Car Body -->
      <path d="M52 5 L88 5 C94 5, 96 9, 96 15 L96 29 L52 29 Z" fill="url(#ieTramBody)" stroke="#475569" stroke-width="0.7"/>

      <!-- Roof Fairing / Pantograph Pod (100% Electric Aerodynamic Dome) -->
      <path d="M10 5 C14 2, 28 2, 38 4 L44 5 L10 5 Z" fill="url(#ieTramSilver)" opacity="0.95"/>
      <path d="M52 5 L82 4 C88 2, 92 4, 94 5 Z" fill="url(#ieTramSilver)" opacity="0.95"/>

      <!-- Accordion Bellows / Fuelle Articulado -->
      <g fill="#111827" stroke="#000000" stroke-width="0.6">
        <rect x="44" y="5" width="2" height="24" rx="0.5"/>
        <rect x="46" y="4.5" width="2" height="25" rx="0.5" fill="#1f2937"/>
        <rect x="48" y="4.5" width="2" height="25" rx="0.5" fill="#111827"/>
        <rect x="50" y="5" width="2" height="24" rx="0.5" fill="#1f2937"/>
      </g>

      <!-- Streamlined Tram Front Windshield -->
      <path d="M5 16 C5 10, 11 7, 18 7 L20 18 L6 18 Z" fill="url(#ieTramGlass)"/>
      <path d="M5 18 L5 21 C5 22, 7 23, 9 23 L9 18 Z" fill="#67e8f9" opacity="0.7"/>

      <!-- Passenger Windows Front & Rear -->
      <rect x="22" y="7" width="10" height="11" rx="1.5" fill="url(#ieTramGlass)"/>
      <rect x="33" y="7" width="9" height="11" rx="1.5" fill="url(#ieTramGlass)"/>
      <rect x="54" y="7" width="12" height="11" rx="1.5" fill="url(#ieTramGlass)"/>
      <rect x="68" y="7" width="12" height="11" rx="1.5" fill="url(#ieTramGlass)"/>
      <rect x="82" y="7" width="12" height="11" rx="1.5" fill="url(#ieTramGlass)"/>

      <!-- Electric 100% Badge (Zap) -->
      <circle cx="8" cy="11" r="3" fill="#10b981"/>
      <path d="M8 9.2 L6.8 11.2 L8 11.2 L7.8 12.8 L9.2 10.8 L8 10.8 Z" fill="#ffffff"/>

      <!-- Wheels with Aero Skirts -->
      <circle cx="17" cy="29" r="4.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="17" cy="29" r="2" fill="#94a3b8"/>
      
      <circle cx="60" cy="29" r="4.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="60" cy="29" r="2" fill="#94a3b8"/>

      <circle cx="84" cy="29" r="4.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="84" cy="29" r="2" fill="#94a3b8"/>

      <!-- Line Badge & Destination display -->
      <rect x="21" y="8" width="21" height="9.5" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="31.5" y="15.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

      <!-- Unit ID -->
      ${unitNum ? `<text x="74" y="25" font-family="monospace" font-size="5.5" font-weight="700" fill="#94a3b8" text-anchor="middle">${unitNum}</text>` : ''}
    </svg>`;
  }

  if (fleet.typeKey === 'irizar-ie-tram-standard') {
    // IRIZAR IE TRAM 12M ESTÁNDAR (100% Eléctrico diseño tranvía)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <defs>
        <linearGradient id="ieTramStdBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="45%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="ieGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#0284c7" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="ieEcoGreen" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#008075"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
      </defs>

      <!-- Aerodynamic Main Tram-Bus Body -->
      <path d="M4 13 C4 8, 11 5, 20 5 L64 5 C68 5, 70 8, 70 13 L70 29 L7 29 C4 29, 4 22, 4 17 Z" fill="url(#ieTramStdBody)" stroke="#475569" stroke-width="0.7"/>

      <!-- Roof Battery Fairing -->
      <path d="M12 5 C16 2, 40 2, 58 3 L65 5 L12 5 Z" fill="url(#ieEcoGreen)" opacity="0.95"/>

      <!-- Panoramic Curved Windshield -->
      <path d="M5 16 C5 10, 10 7, 17 7 L19 18 L6 18 Z" fill="url(#ieGlass)"/>

      <!-- Side Windows -->
      <rect x="21" y="7" width="14" height="11" rx="1.5" fill="url(#ieGlass)"/>
      <rect x="37" y="7" width="14" height="11" rx="1.5" fill="url(#ieGlass)"/>
      <rect x="53" y="7" width="14" height="11" rx="1.5" fill="url(#ieGlass)"/>

      <!-- Electric 100% Symbol -->
      <circle cx="8" cy="11" r="3" fill="#10b981"/>
      <path d="M8 9.2 L6.8 11.2 L8 11.2 L7.8 12.8 L9.2 10.8 L8 10.8 Z" fill="#ffffff"/>

      <!-- Wheels with Sleek Rims -->
      <circle cx="17" cy="29" r="4.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="17" cy="29" r="2" fill="#94a3b8"/>

      <circle cx="57" cy="29" r="4.5" fill="#0f172a" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="57" cy="29" r="2" fill="#94a3b8"/>

      <!-- Line Badge Display -->
      <rect x="21" y="8" width="22" height="9.5" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="32" y="15.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

      <!-- Unit ID -->
      ${unitNum ? `<text x="50" y="25" font-family="monospace" font-size="5.5" font-weight="700" fill="#94a3b8" text-anchor="middle">${unitNum}</text>` : ''}
    </svg>`;
  }

  if (fleet.typeKey === 'solaris-urbino-hybrid') {
    // SOLARIS URBINO HÍBRIDO (Diseño asimétrico con ceja Solaris y pack híbrido en techo)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <defs>
        <linearGradient id="solarisBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="60%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="solarisGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
      </defs>

      <!-- Solaris Roof Hybrid Unit -->
      <rect x="24" y="2" width="24" height="4" rx="2" fill="#8b5cf6" stroke="#6d28d9" stroke-width="0.6"/>
      <!-- Hybrid Leaf Emblem -->
      <circle cx="36" cy="4" r="1.5" fill="#a78bfa"/>

      <!-- Bus Body with Solaris Asymmetric Front Cut -->
      <path d="M4 14 L8 6 L66 6 C69 6, 70 8, 70 12 L70 29 L5 29 C4 29, 3 25, 4 14 Z" fill="url(#solarisBody)" stroke="#94a3b8" stroke-width="0.7"/>

      <!-- Lower AUVASA Valladolid Color Strip -->
      <path d="M4 23 L70 23 L70 29 L4 29 Z" fill="#008075"/>

      <!-- Distinctive Solaris Eyebrow Asymmetric Windshield -->
      <path d="M5 14 L8 7 L18 7 L17 18 L5 18 Z" fill="url(#solarisGlass)"/>

      <!-- Side Windows -->
      <rect x="20" y="7" width="13" height="11" rx="1.5" fill="url(#solarisGlass)"/>
      <rect x="35" y="7" width="14" height="11" rx="1.5" fill="url(#solarisGlass)"/>
      <rect x="51" y="7" width="16" height="11" rx="1.5" fill="url(#solarisGlass)"/>

      <!-- Eco Hybrid Badge -->
      <circle cx="8" cy="21" r="2.5" fill="#8b5cf6"/>
      <text x="8" y="22.5" font-family="sans-serif" font-size="3.5" font-weight="900" fill="#ffffff" text-anchor="middle">H</text>

      <!-- Wheels -->
      <circle cx="16" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="16" cy="29" r="2" fill="#cbd5e1"/>

      <circle cx="56" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="56" cy="29" r="2" fill="#cbd5e1"/>

      <!-- Line Badge -->
      <rect x="21" y="8" width="21" height="9.5" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="31.5" y="15.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

      <!-- Unit ID -->
      ${unitNum ? `<text x="50" y="26.5" font-family="monospace" font-size="5" font-weight="800" fill="#ffffff" text-anchor="middle">${unitNum}</text>` : ''}
    </svg>`;
  }

  if (fleet.typeKey === 'man-lions-city-gnc') {
    // MAN LION'S CITY GNC (Cúpula de gas GNC aerodinámica en techo + máscara negra MAN)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <defs>
        <linearGradient id="manBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="manGncDome" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
        <linearGradient id="manGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Roof CNG Gas Tank Dome -->
      <path d="M12 6 C12 2, 38 2, 44 6 Z" fill="url(#manGncDome)" stroke="#0e7490" stroke-width="0.6"/>
      <text x="28" y="4.5" font-family="sans-serif" font-size="3" font-weight="900" fill="#ffffff" text-anchor="middle">ECO GNC</text>

      <!-- Main Bus Body -->
      <rect x="4" y="6" width="66" height="23" rx="3" fill="url(#manBody)" stroke="#94a3b8" stroke-width="0.7"/>

      <!-- MAN Black Gloss Front Mask -->
      <path d="M4 12 L14 12 L14 26 L4 26 Z" fill="#0f172a"/>
      <!-- Windshield -->
      <path d="M4 8 L14 8 L14 18 L4 18 Z" fill="url(#manGlass)"/>

      <!-- Side Windows -->
      <rect x="16" y="8" width="15" height="10" rx="1.5" fill="url(#manGlass)"/>
      <rect x="33" y="8" width="16" height="10" rx="1.5" fill="url(#manGlass)"/>
      <rect x="51" y="8" width="16" height="10" rx="1.5" fill="url(#manGlass)"/>

      <!-- Lower AUVASA Stripe -->
      <path d="M4 24 L70 24 L70 29 L4 29 Z" fill="#008075"/>

      <!-- Wheels -->
      <circle cx="16" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="16" cy="29" r="2" fill="#cbd5e1"/>

      <circle cx="56" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="56" cy="29" r="2" fill="#cbd5e1"/>

      <!-- Line Badge -->
      <rect x="19" y="8.5" width="22" height="9" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="30" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

      <!-- Unit ID -->
      ${unitNum ? `<text x="50" y="27" font-family="monospace" font-size="5" font-weight="800" fill="#ffffff" text-anchor="middle">${unitNum}</text>` : ''}
    </svg>`;
  }

  if (fleet.typeKey === 'articulated-gnc') {
    // ARTICULADO ORUGA 18M (Fuelle central, 3 ejes)
    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
      <defs>
        <linearGradient id="artBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#008075"/>
        </linearGradient>
        <linearGradient id="artGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>

      <!-- Front Section -->
      <rect x="4" y="6" width="40" height="23" rx="3" fill="url(#artBody)" stroke="#94a3b8" stroke-width="0.7"/>
      <!-- Rear Section -->
      <rect x="52" y="6" width="42" height="23" rx="3" fill="url(#artBody)" stroke="#94a3b8" stroke-width="0.7"/>

      <!-- Roof CNG Tank -->
      <path d="M12 6 C12 3, 30 3, 36 6 Z" fill="#0284c7" opacity="0.9"/>

      <!-- Accordion Bellows / Fuelle -->
      <g fill="#18181b" stroke="#09090b" stroke-width="0.5">
        <rect x="44" y="5.5" width="2" height="23.5" rx="0.5"/>
        <rect x="46" y="5" width="2" height="24.5" rx="0.5" fill="#27272a"/>
        <rect x="48" y="5" width="2" height="24.5" rx="0.5" fill="#18181b"/>
        <rect x="50" y="5.5" width="2" height="23.5" rx="0.5" fill="#27272a"/>
      </g>

      <!-- Windows Front & Back -->
      <path d="M5 8 L14 8 L14 18 L5 18 Z" fill="url(#artGlass)"/>
      <rect x="16" y="8" width="12" height="10" rx="1.5" fill="url(#artGlass)"/>
      <rect x="30" y="8" width="12" height="10" rx="1.5" fill="url(#artGlass)"/>
      
      <rect x="54" y="8" width="12" height="10" rx="1.5" fill="url(#artGlass)"/>
      <rect x="68" y="8" width="12" height="10" rx="1.5" fill="url(#artGlass)"/>
      <rect x="82" y="8" width="10" height="10" rx="1.5" fill="url(#artGlass)"/>

      <!-- Lower Turquoise Skirt -->
      <path d="M4 24 L44 24 L44 29 L4 29 Z" fill="#008075"/>
      <path d="M52 24 L94 24 L94 29 L52 29 Z" fill="#008075"/>

      <!-- 3 Axle Wheels -->
      <circle cx="15" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="15" cy="29" r="2" fill="#cbd5e1"/>

      <circle cx="60" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="60" cy="29" r="2" fill="#cbd5e1"/>

      <circle cx="84" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
      <circle cx="84" cy="29" r="2" fill="#cbd5e1"/>

      <!-- Line Badge -->
      <rect x="17" y="8.5" width="21" height="9" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
      <text x="27.5" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

      <!-- Unit ID -->
      ${unitNum ? `<text x="74" y="27" font-family="monospace" font-size="5" font-weight="800" fill="#ffffff" text-anchor="middle">${unitNum}</text>` : ''}
    </svg>`;
  }

  // DEFAULT / MERCEDES CITARO / CASTROSUA GNC URBANO ESTÁNDAR
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 36" width="${width}" height="${height}" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));">
    <defs>
      <linearGradient id="stdBody" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="65%" stop-color="#f1f5f9"/>
        <stop offset="100%" stop-color="#008075"/>
      </linearGradient>
      <linearGradient id="stdGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8"/>
        <stop offset="100%" stop-color="#0284c7"/>
      </linearGradient>
    </defs>

    <!-- Roof Gas Tank Container -->
    <rect x="22" y="3.5" width="28" height="3" rx="1.5" fill="#38bdf8" stroke="#0284c7" stroke-width="0.5"/>

    <!-- Main Bus Body -->
    <rect x="4" y="6" width="66" height="23" rx="3" fill="url(#stdBody)" stroke="#94a3b8" stroke-width="0.7"/>

    <!-- Front Windshield -->
    <path d="M5 8 L16 8 L16 18 L5 18 Z" fill="url(#stdGlass)"/>

    <!-- Windows -->
    <rect x="18" y="8" width="15" height="10" rx="1.5" fill="url(#stdGlass)"/>
    <rect x="35" y="8" width="16" height="10" rx="1.5" fill="url(#stdGlass)"/>
    <rect x="53" y="8" width="15" height="10" rx="1.5" fill="url(#stdGlass)"/>

    <!-- Lower AUVASA Strip -->
    <path d="M4 24 L70 24 L70 29 L4 29 Z" fill="#008075"/>

    <!-- Wheels -->
    <circle cx="16" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <circle cx="16" cy="29" r="2" fill="#cbd5e1"/>

    <circle cx="56" cy="29" r="4.5" fill="#1e293b" stroke="#64748b" stroke-width="1.2"/>
    <circle cx="56" cy="29" r="2" fill="#cbd5e1"/>

    <!-- Line Badge -->
    <rect x="20" y="8.5" width="22" height="9" rx="3" fill="${cleanColor}" stroke="#ffffff" stroke-width="1"/>
    <text x="31" y="15" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7.5" font-weight="900" fill="${cleanTextColor}" text-anchor="middle" dominant-baseline="central">${cleanLine}</text>

    <!-- Unit ID -->
    ${unitNum ? `<text x="50" y="27" font-family="monospace" font-size="5" font-weight="800" fill="#ffffff" text-anchor="middle">${unitNum}</text>` : ''}
  </svg>`;
}

/**
 * Creates the HTML wrapper for Leaflet DivIcon
 */
export function getBusMarkerHtml(opts: BusMarkerRenderOptions): string {
  const isArticulated = opts.fleet.isArticulated || opts.fleet.typeKey === 'irizar-ie-tram-articulated' || opts.fleet.typeKey === 'articulated-gnc';
  const width = isArticulated ? 98 : 72;
  const height = 36;
  const svg = getBusSvgIllustration(opts);

  return `
    <div class="bus-custom-marker-wrap" style="
      display: inline-block;
      width: ${width}px;
      height: ${height}px;
      cursor: pointer;
      transform-origin: center center;
      transition: transform 0.2s ease-out;
      user-select: none;
    ">
      ${svg}
    </div>
  `;
}
