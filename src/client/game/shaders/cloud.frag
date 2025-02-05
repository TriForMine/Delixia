precision highp float;

varying vec3 vWorldNormal;

// Uniforms (add any you want, for time etc.)
uniform float iTime;
uniform float sunx;   // added for directional lighting
uniform float suny;   // added for directional lighting

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 3D Simplex Noise Implementation
// (adapted from Ashima / IQ / etc. compact versions)
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
float permute(float x){return floor(mod(((x*34.0)+1.0)*x, 289.0));}

vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float taylorInvSqrt(float r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0. + 0.0 * C
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0 );
    vec4 p = permute( permute( permute(
                                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                               + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                      + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    // ( N*N points uniformly over a square, mapped onto an octahedron.)
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
    dot(p2,x2), dot(p3,x3) ) );
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Fractal Brownian Motion in 3D
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
float fbm(vec3 p) {
    float sum  = 0.0;
    float amp  = 0.5;
    for(int i=0; i<5; i++) {
        sum += amp * snoise(p);
        p   = 2.02 * p;   // frequency boost each octave
        amp *= 0.5;       // amplitude halves each octave
    }
    return sum;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Main
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
void main() {
    // Normalized direction from the sphere
    vec3 N = normalize(vWorldNormal);

    // A sun direction from the user uniforms
    // (Assumes you animate sunx / suny in registerBeforeRender)
    vec3 sunDir = normalize(vec3(sunx, suny, 0.7));

    // Sample fractal noise
    float cloudScale = 8.0;
    float speed = 0.1;
    float n = fbm(N * cloudScale + iTime * speed);

    // Shape the noise into clouds
    float coverage = 0.02;  // lower coverage => more blue sky
    float contrast = 3.2;   // how sharply we transition into cloud
    float clouds = smoothstep(coverage, 1.0, n * contrast);

    // Add extra detail
    float detail = fbm(N * (cloudScale * 4.0) + iTime * (speed * 2.0));
    float finalClouds = clamp(clouds + 0.3 * detail, 0.0, 1.0);

    // -----------------------------
    // Simple directional lighting
    // -----------------------------
    // Dot product with the sun’s direction:
    float lighting = clamp(dot(N, sunDir), 0.0, 1.0);

    // Cloud shadow color (a little bluish) and highlight color (somewhat warm)
    // Tweak these to taste.
    vec3 shadowColor   = vec3(0.7, 0.8, 0.9);
    vec3 highlightColor = vec3(1.0, 0.95, 0.88);

    // Final per-pixel cloud color combining shadow and highlight:
    // We only apply lighting where there is cloud (finalClouds).
    vec3 litCloudColor = mix(shadowColor, highlightColor, lighting);

    // Strengthen the lit areas a bit for a more dramatic effect
    // (use an exponent or extra curve if you want more punch)
    litCloudColor = litCloudColor * (0.9 + 0.4 * lighting);

    // -----------------------------
    // Sky color gradient
    // -----------------------------
    float t = 0.5 * (N.y + 1.0);
    vec3 skyColorLow  = vec3(0.3, 0.5, 0.8);
    vec3 skyColorHigh = vec3(0.7, 0.9, 1.0);
    vec3 sky = mix(skyColorLow, skyColorHigh, t);

    // -----------------------------
    // Combine sky and cloud
    // -----------------------------
    // The final cloud color is litCloudColor where clouds exist
    // and pure sky where no clouds.
    vec3 finalColor = mix(sky, litCloudColor, finalClouds);

    gl_FragColor = vec4(finalColor, 1.0);
}