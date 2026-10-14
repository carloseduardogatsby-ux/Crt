import React, { useMemo } from 'react';
import { CrtConfig } from '../types/crt';

interface CrtOverlayLayerProps {
  config: CrtConfig;
  isFullScreenMode?: boolean;
}

export const CrtOverlayLayer: React.FC<CrtOverlayLayerProps> = ({ config, isFullScreenMode = false }) => {
  if (!config.overlayEnabled) return null;

  // Generate repeating SVG scanline data URI based on line count/intensity
  const scanlinePatternUri = useMemo(() => {
    const spacing = Math.max(2, Math.round(1080 / Math.max(100, config.scanlineCount)));
    const lineHeight = Math.max(1, Math.round(spacing * 0.45));
    const opacity = (config.scanlineIntensity * 0.95).toFixed(3);
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="${spacing}">
      <rect width="4" height="${lineHeight}" fill="black" opacity="${opacity}" />
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }, [config.scanlineCount, config.scanlineIntensity]);

  // Generate RGB phosphor mask data URI
  const rgbMaskPatternUri = useMemo(() => {
    if (config.rgbMaskIntensity <= 0.05) return null;
    const op = (config.rgbMaskIntensity * 0.45).toFixed(3);

    if (config.rgbMaskType === 'aperture') {
      // 3px vertical stripes: Red, Green, Blue (Sony Trinitron)
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3" height="1">
        <rect x="0" y="0" width="1" height="1" fill="#ff2222" opacity="${op}" />
        <rect x="1" y="0" width="1" height="1" fill="#22ff22" opacity="${op}" />
        <rect x="2" y="0" width="1" height="1" fill="#2222ff" opacity="${op}" />
      </svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } else {
      // Triad staggered dots
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="4">
        <rect x="0" y="0" width="2" height="2" fill="#ff3333" opacity="${op}" />
        <rect x="2" y="0" width="2" height="2" fill="#33ff33" opacity="${op}" />
        <rect x="4" y="0" width="2" height="2" fill="#3333ff" opacity="${op}" />
        <rect x="1" y="2" width="2" height="2" fill="#ff3333" opacity="${op}" />
        <rect x="3" y="2" width="2" height="2" fill="#33ff33" opacity="${op}" />
        <rect x="5" y="2" width="2" height="2" fill="#3333ff" opacity="${op}" />
      </svg>`;
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
  }, [config.rgbMaskIntensity, config.rgbMaskType]);

  // Color temperature & contrast filter values
  const colorFilter = useMemo(() => {
    let contrast = `contrast(${config.contrast})`;
    let brightness = `brightness(${config.brightness})`;
    let saturation = `saturate(${config.saturation})`;
    let hue = '';
    let sepia = '';

    if (config.colorWarmth === 'warm80s') {
      sepia = 'sepia(0.18)';
      hue = 'hue-rotate(-5deg)';
    } else if (config.colorWarmth === 'trinitron') {
      hue = 'hue-rotate(5deg)';
      saturation = `saturate(${(config.saturation * 1.1).toFixed(2)})`;
    } else if (config.colorWarmth === 'green') {
      hue = 'hue-rotate(85deg)';
      saturation = 'saturate(2.2)';
    } else if (config.colorWarmth === 'amber') {
      sepia = 'sepia(0.85)';
      hue = 'hue-rotate(15deg)';
    }

    return `${brightness} ${contrast} ${saturation} ${sepia} ${hue}`.trim();
  }, [config.brightness, config.contrast, config.saturation, config.colorWarmth]);

  // Curvature vignette shadow
  const vignetteRadius = (75 - config.vignette * 30).toFixed(1);
  const vignetteFalloff = (100 - config.vignette * 15).toFixed(1);

  return (
    <div
      className={`pointer-events-none select-none transition-opacity duration-200 ${
        isFullScreenMode ? 'fixed inset-0 z-50 overflow-hidden' : 'absolute inset-0 z-20 overflow-hidden'
      }`}
      style={{
        opacity: config.overlayOpacity,
      }}
    >
      {/* 1. Underlying Video Color Tuning (Backdrop Filter) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: colorFilter,
          WebkitBackdropFilter: colorFilter,
        }}
      />

      {/* 2. Horizontal CRT Scanlines Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("${scanlinePatternUri}")`,
          backgroundRepeat: 'repeat',
          mixBlendMode: config.blendMode === 'multiply' ? 'multiply' : 'normal',
        }}
      />

      {/* 3. RGB Phosphor Subpixel Aperture Grille Layer */}
      {rgbMaskPatternUri && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("${rgbMaskPatternUri}")`,
            backgroundRepeat: 'repeat',
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* 4. Curvature & Vignette Tube Shadow (Radial Barrel Gradient) */}
      {config.vignette > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) ${vignetteRadius}%, rgba(0,0,0,${(
              config.vignette * 0.85
            ).toFixed(2)}) ${vignetteFalloff}%, rgba(0,0,0,0.98) 100%)`,
            boxShadow:
              config.curvature > 0.1
                ? `inset 0 0 ${Math.round(config.curvature * 80)}px rgba(0,0,0,0.9)`
                : 'none',
          }}
        />
      )}

      {/* 5. Glass Reflection Glare */}
      {config.curvature > 0.15 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.06) 30%, transparent 65%)',
          }}
        />
      )}

      {/* 6. Subtle 60Hz Refresh Flicker */}
      {config.flicker > 0.002 && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse"
          style={{
            backgroundColor: `rgba(255, 255, 255, ${(config.flicker * 0.4).toFixed(3)})`,
            mixBlendMode: 'overlay',
            animationDuration: '0.08s',
          }}
        />
      )}

      {/* 7. Rounded Bezel Corners (if applicable) */}
      {config.cornerRounding > 0.01 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 ${Math.round(
              config.cornerRounding * 40
            )}px rgba(5, 7, 13, 0.98)`,
            borderRadius: `${Math.round(config.cornerRounding * 120)}px`,
          }}
        />
      )}
    </div>
  );
};
