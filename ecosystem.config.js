module.exports = {
  apps: [
    {
      name: "my-tg-bot",
      script: "dist/apps/app-base-tg-bot/src/main.js",
      instances: 1,
      out_file: '/dev/stdout',
      error_file: '/dev/stderr',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      exec_mode: "fork",
      env: {
        ENV: "prod"
      }
    },
    {
      name: "cron",
      script: "dist/apps/app-cron/src/main.js",
      instances: 1, // cron лучше в одном экземпляре
      exec_mode: "fork",
      env: {
        ENV: "prod"
      }
    },
    {
      name: "admin",
      script: "dist/apps/app-admin/src/main.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        ENV: "prod",
      }
    },
    {
      name: "cloud-api",
      script: "dist/apps/app-cloud-api/src/main.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        ENV: "prod",
      }
    },
    {
      name: "cloud-cron",
      script: "dist/apps/app-cloud-cron/src/main.js",
      instances: 1, // cron лучше в одном экземпляре
      exec_mode: "fork",
      env: {
        ENV: "prod"
      }
    }
  ]
}
