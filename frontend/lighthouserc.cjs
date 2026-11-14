// Configuracion de Lighthouse CI (workflow green-audit.yml)
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/servidor-estatico.mjs dist 4173',
      startServerReadyPattern: 'Sirviendo',
      url: ['http://localhost:4173/login'],
      numberOfRuns: 3,
      settings: { preset: 'desktop' },
    },
    assert: {
      assertions: {
        // Umbrales de la consigna (Inspección 04, perfil escritorio)
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1400 }],
        'total-blocking-time': ['error', { maxNumericValue: 85 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02 }],
        'total-byte-weight': ['error', { maxNumericValue: 1100000 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'uses-text-compression': ['error', { minScore: 1 }],
        'uses-long-cache-ttl': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
