import * as THREE from 'three';

/**
 * Generates Float32Arrays for the Tree configuration and the Sphere configuration.
 * 
 * @param count Number of particles
 * @param treeHeight Height of the spiral cone
 * @param treeRadius Base radius of the cone
 */
export const generateTreeData = (count: number, treeHeight: number = 15, treeRadius: number = 6) => {
  const positionsTree = new Float32Array(count * 3);
  const positionsSphere = new Float32Array(count * 3);
  const randoms = new Float32Array(count); // For twinkling offsets

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    // --- Randoms ---
    randoms[i] = Math.random();

    // --- Sphere Logic (Target Shape) ---
    // Uniform distribution on a sphere
    const theta = Math.random() * Math.PI * 2;
    const v = Math.random();
    const phi = Math.acos(2 * v - 1);
    const rSphere = 8 + Math.random() * 2; // Radius approx 8-10

    const sx = rSphere * Math.sin(phi) * Math.cos(theta);
    const sy = rSphere * Math.sin(phi) * Math.sin(theta);
    const sz = rSphere * Math.cos(phi);

    positionsSphere[i3] = sx;
    positionsSphere[i3 + 1] = sy;
    positionsSphere[i3 + 2] = sz;

    // --- Tree Logic (Organic "Vine" Spirals) ---
    // Instead of random noise, we use structured noise (sine waves) to create
    // coherent, curly strands that look like organic vines wrapping up the cone.
    
    const yPct = i / count; // 0 (bottom) to 1 (top)
    const y = (yPct - 0.5) * treeHeight; 

    // Define "Strands" or "Vines"
    // We modulo the index to assign this particle to one of several strands
    const strandCount = 12; 
    const strandId = i % strandCount;
    
    // Main Geometry: Cone tapering upwards
    const radiusPct = 1.0 - yPct;
    const baseRadius = radiusPct * treeRadius;

    // 1. Major Rotation (The main spiral path of the vine)
    // How many times the vines wrap around the tree height
    const majorTurns = 3.0; 
    const majorAngle = yPct * Math.PI * 2 * majorTurns;
    
    // 2. Strand Distribution
    // Offset each strand around the cylinder so they don't overlap
    const strandOffset = (strandId / strandCount) * Math.PI * 2;
    
    // 3. Minor Curl (The "Organic" wiggles)
    // Add sinusoidal offsets to radius and angle to create curly, wavy lines
    // Frequency increases slightly towards top for detail
    const curlFreq = 8.0 + (yPct * 4.0); 
    const curlPhase = strandId * 135.5; // Random phase per strand
    
    // Wiggle strength
    const rWiggleAmp = 0.8 * radiusPct; // Radial wiggle
    const angleWiggleAmp = 0.4 * radiusPct; // Angular wiggle (snake movement)
    
    const rWiggle = Math.sin(yPct * Math.PI * 2 * curlFreq + curlPhase) * rWiggleAmp;
    const angleWiggle = Math.cos(yPct * Math.PI * 2 * curlFreq + curlPhase) * angleWiggleAmp;
    
    // Combine Coordinates
    const rFinal = baseRadius + rWiggle;
    const thetaFinal = majorAngle + strandOffset + angleWiggle;
    
    const tx = rFinal * Math.cos(thetaFinal);
    const tz = rFinal * Math.sin(thetaFinal);
    
    // Vertical Noise
    // Less random scatter, more smooth flow. Just a tiny bit of jitter for organic feel.
    const scatter = 0.1;
    const jitterX = (Math.random() - 0.5) * scatter;
    const jitterY = (Math.random() - 0.5) * scatter;
    const jitterZ = (Math.random() - 0.5) * scatter;

    positionsTree[i3] = tx + jitterX;
    positionsTree[i3 + 1] = y + jitterY;
    positionsTree[i3 + 2] = tz + jitterZ;
  }

  return {
    positionsTree,
    positionsSphere,
    randoms
  };
};