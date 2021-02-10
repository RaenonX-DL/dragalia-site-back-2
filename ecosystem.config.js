module.exports = {
  apps: [{
    name: 'dragalia-site-back-2',
    script: './dist/src/main.js',
    instances: 'max',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
