/**
 * Configurações globais e funções de utilidade para o mundo.
 */

export const WORLD_CONFIG = {
    width: 120,      
    depth: 120,      
    baseHeight: 5,
    sw: 6,           
    streetW: 30,     
    curbH: 0.2,     
    streetY: -0.1,  
    hillIntensity: 18,
    pathW: 2.5,      
    pathRectW: 25,   // Um pouco mais largo para preencher o centro
    pathRectD: 80,   // Longo ao longo do centro
    pathXOffset: 0   // AGORA NO CENTRO REAL (0, 0)
};

/**
 * Calcula o efeito de morro orgânico e suave.
 */
export function getHillEffect(x) {
    const w = WORLD_CONFIG.width;
    const startX = 25; // O morro agora começa DEPOIS do centro (X=25)
    const endX = w / 2;
    if (x < startX) return 0;
    const t = (x - startX) / (endX - startX);
    const clampedT = Math.min(1, Math.max(0, t));
    const curve = (1 - Math.cos(clampedT * Math.PI)) / 2;
    return curve * WORLD_CONFIG.hillIntensity;
}

/**
 * Ruído da grama sutil.
 */
export function getNoise(x, z, width, depth) {
    const wave1 = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.8;
    const wave2 = Math.sin(x * 0.04) * 0.5;
    const edgeThreshold = 6;
    const factorX = Math.min(1, (width/2 - Math.abs(x)) / edgeThreshold);
    const factorZ = Math.min(1, (depth/2 - Math.abs(z)) / edgeThreshold);
    const smoothFactor = Math.max(0, factorX * factorZ);
    return (wave1 + wave2) * smoothFactor;
}
