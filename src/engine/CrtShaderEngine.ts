import { CrtConfig } from '../types/crt';

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  // Flip Y because WebGL textures are typically inverted compared to canvas
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;

// Distortion & Geometry
uniform float u_curvature;
uniform float u_corner_rounding;
uniform float u_vignette;

// Scanlines
uniform float u_scanline_intensity;
uniform float u_scanline_count;
uniform float u_scanline_beam;
uniform float u_scanline_jitter;

// Color & Phosphors
uniform float u_rgb_mask_intensity;
uniform int u_rgb_mask_type;
uniform float u_chromatic_aberration;
uniform float u_bloom;

// Artifacts
uniform float u_noise;
uniform float u_flicker;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform int u_color_tint;

// Pseudo-random hash
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Barrel distortion (CRT curvature)
vec2 warpUV(vec2 uv, float curveAmount) {
  if (curveAmount <= 0.001) return uv;
  vec2 coord = uv * 2.0 - 1.0;
  vec2 offset = coord.yx / (3.2 / curveAmount);
  coord = coord + coord * offset * offset;
  return coord * 0.5 + 0.5;
}

// Corner cut / bezel vignette
float cornerBezel(vec2 uv, float roundness) {
  if (roundness <= 0.001) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return 1.0;
  }
  vec2 d = abs(uv - 0.5) * 2.0;
  d = max(d - (1.0 - roundness), 0.0);
  float dist = length(d);
  return smoothstep(roundness, roundness - 0.015, dist);
}

void main() {
  vec2 uv = warpUV(v_uv, u_curvature);
  
  // Cut corners
  float inside = cornerBezel(uv, u_corner_rounding);
  if (inside <= 0.0 || uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.02, 0.02, 0.03, 1.0);
    return;
  }

  // Chromatic Aberration
  vec2 dir = (uv - 0.5) * u_chromatic_aberration * 2.0;
  float r = texture2D(u_texture, uv + dir).r;
  float g = texture2D(u_texture, uv).g;
  float b = texture2D(u_texture, uv - dir).b;
  vec3 color = vec3(r, g, b);

  // Subtle Bloom / Glow sampling
  if (u_bloom > 0.01) {
    vec2 blurOffset = vec2(1.5 / u_resolution.x, 1.5 / u_resolution.y);
    vec3 bloomSample = (
      texture2D(u_texture, uv + vec2(-blurOffset.x, -blurOffset.y)).rgb +
      texture2D(u_texture, uv + vec2(blurOffset.x, -blurOffset.y)).rgb +
      texture2D(u_texture, uv + vec2(-blurOffset.x, blurOffset.y)).rgb +
      texture2D(u_texture, uv + vec2(blurOffset.x, blurOffset.y)).rgb
    ) * 0.25;
    color = mix(color, max(color, bloomSample * 1.3), u_bloom * 0.7);
  }

  // Scanlines with optional jitter
  float scanlineY = uv.y * u_scanline_count + sin(u_time * 50.0) * u_scanline_jitter;
  float scanline = sin(scanlineY * 3.14159265);
  scanline = (scanline + 1.0) * 0.5;
  scanline = pow(scanline, u_scanline_beam);
  color *= mix(1.0, scanline, u_scanline_intensity);

  // RGB Phosphor Mask (Shadow Mask / Aperture Grille / Dot Matrix)
  if (u_rgb_mask_intensity > 0.01) {
    vec3 mask = vec3(1.0);
    if (u_rgb_mask_type == 0) {
      // Aperture Grille (vertical RGB stripes)
      float m = mod(gl_FragCoord.x, 3.0);
      if (m < 1.0) mask = vec3(1.0, 0.35, 0.35);
      else if (m < 2.0) mask = vec3(0.35, 1.0, 0.35);
      else mask = vec3(0.35, 0.35, 1.0);
    } else if (u_rgb_mask_type == 1) {
      // Triad Shadow Mask (honeycomb/staggered RGB)
      float x = mod(gl_FragCoord.x, 3.0);
      float y = mod(gl_FragCoord.y, 2.0);
      if (y > 1.0) x = mod(x + 1.5, 3.0);
      if (x < 1.0) mask = vec3(1.0, 0.3, 0.3);
      else if (x < 2.0) mask = vec3(0.3, 1.0, 0.3);
      else mask = vec3(0.3, 0.3, 1.0);
    } else if (u_rgb_mask_type == 2) {
      // Dot Matrix (Game Boy / LCD grid)
      vec2 grid = fract(uv * vec2(160.0, 144.0));
      float border = step(0.12, grid.x) * step(0.12, grid.y);
      mask = vec3(mix(0.65, 1.0, border));
    }
    color = mix(color, color * mask * 1.25, u_rgb_mask_intensity);
  }

  // RF Static Noise
  if (u_noise > 0.001) {
    float n = (hash(uv * 100.0 + fract(u_time * 17.3)) - 0.5) * 2.0;
    color += n * u_noise;
  }

  // 60Hz Refresh Flicker
  if (u_flicker > 0.001) {
    float f = sin(u_time * 120.0) * u_flicker;
    color += f;
  }

  // Vignette (darkened edges)
  if (u_vignette > 0.01) {
    vec2 vuv = uv * (1.0 - uv.xy);
    float vig = vuv.x * vuv.y * 15.0;
    vig = clamp(pow(vig, u_vignette * 0.8), 0.0, 1.0);
    color *= vig;
  }

  // Brightness, Contrast & Saturation
  color *= u_brightness;
  color = (color - 0.5) * u_contrast + 0.5;

  // Saturation
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(lum), color, u_saturation);

  // Color Tints (Phosphor / Retro styles)
  if (u_color_tint == 1) {
    // Green Phosphor (P1/Pip-Boy)
    vec3 greenPhosphor = vec3(0.1, 1.0, 0.3) * lum * 1.25;
    color = mix(color, greenPhosphor, 0.95);
  } else if (u_color_tint == 2) {
    // Amber Phosphor (VT220)
    vec3 amberPhosphor = vec3(1.0, 0.72, 0.12) * lum * 1.2;
    color = mix(color, amberPhosphor, 0.95);
  } else if (u_color_tint == 3) {
    // Game Boy DMG (Olive greens)
    float steps = floor(lum * 4.0) / 3.0;
    vec3 gbColor = mix(vec3(0.06, 0.15, 0.06), vec3(0.61, 0.74, 0.06), steps);
    color = mix(color, gbColor, 0.92);
  } else if (u_color_tint == 4) {
    // Warm Analog CRT (80s TV)
    color *= vec3(1.05, 0.98, 0.92);
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0) * inside, 1.0);
}
`;

export class CrtShaderEngine {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private buffer: WebGLBuffer | null = null;
  private animFrameId: number | null = null;
  private startTime = performance.now();

  // Uniform locations
  private locs: { [key: string]: WebGLUniformLocation | null } = {};

  constructor(private canvas: HTMLCanvasElement) {
    this.initWebGL();
  }

  private initWebGL() {
    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    this.gl = gl;

    const vertShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;
    gl.useProgram(program);

    // Quad geometry: full-screen triangle strip
    const quadVertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Create texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cache uniform locations
    const uniformNames = [
      'u_texture', 'u_resolution', 'u_time', 'u_curvature', 'u_corner_rounding',
      'u_vignette', 'u_scanline_intensity', 'u_scanline_count', 'u_scanline_beam',
      'u_scanline_jitter', 'u_rgb_mask_intensity', 'u_rgb_mask_type',
      'u_chromatic_aberration', 'u_bloom', 'u_noise', 'u_flicker',
      'u_brightness', 'u_contrast', 'u_saturation', 'u_color_tint',
    ];
    for (const name of uniformNames) {
      this.locs[name] = gl.getUniformLocation(program, name);
    }
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public render(
    source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
    config: CrtConfig,
    nowTime = performance.now()
  ) {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture) return;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.useProgram(this.program);

    // Upload texture from source
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch {
      // Can happen if video or frame isn't ready
      return;
    }

    const elapsed = (nowTime - this.startTime) / 1000.0;

    // Set uniforms
    gl.uniform1i(this.locs['u_texture'], 0);
    gl.uniform2f(this.locs['u_resolution'], this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locs['u_time'], elapsed);

    gl.uniform1f(this.locs['u_curvature'], config.curvature);
    gl.uniform1f(this.locs['u_corner_rounding'], config.cornerRounding);
    gl.uniform1f(this.locs['u_vignette'], config.vignette);

    gl.uniform1f(this.locs['u_scanline_intensity'], config.scanlineIntensity);
    gl.uniform1f(this.locs['u_scanline_count'], config.scanlineCount);
    gl.uniform1f(this.locs['u_scanline_beam'], config.scanlineBeam);
    gl.uniform1f(this.locs['u_scanline_jitter'], config.scanlineJitter);

    gl.uniform1f(this.locs['u_rgb_mask_intensity'], config.rgbMaskIntensity);
    const maskType = config.rgbMaskType === 'aperture' ? 0 : config.rgbMaskType === 'triad' ? 1 : 2;
    gl.uniform1i(this.locs['u_rgb_mask_type'], maskType);

    gl.uniform1f(this.locs['u_chromatic_aberration'], config.chromaticAberration);
    gl.uniform1f(this.locs['u_bloom'], config.bloom);
    gl.uniform1f(this.locs['u_noise'], config.noise ?? 0.0);
    gl.uniform1f(this.locs['u_flicker'], config.flicker);
    gl.uniform1f(this.locs['u_brightness'], config.brightness);
    gl.uniform1f(this.locs['u_contrast'], config.contrast);
    gl.uniform1f(this.locs['u_saturation'], config.saturation);

    const tintMap: Record<string, number> = {
      none: 0,
      green: 1,
      amber: 2,
      gameboy: 3,
      warm: 4,
    };
    gl.uniform1i(this.locs['u_color_tint'], tintMap[config.colorTint || 'none'] ?? 0);

    // Draw full-screen quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  public resize(width: number, height: number) {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
