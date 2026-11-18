module.exports = {
  apps: [
    {
      name: "sams-edutech",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      node_args: "--max-http-header-size=131072",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
