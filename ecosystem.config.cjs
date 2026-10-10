module.exports = {
  apps: [
    {
      name: "acrapath_server",
      script: "npm",
      args: "run start",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      // You can add more PM2 configuration here if needed
      // instances: 1,
      // autorestart: true,
      // watch: false,
    },
  ],
};
