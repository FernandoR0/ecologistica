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
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'total-byte-weight': ['error', { maxNumericValue: 500000 }],
        'uses-text-compression': ['error', { minScore: 1 }],
        'uses-long-cache-ttl': ['warn', { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
