const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/*',
      },
    ],
  },
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      'react-native-sqlite-storage': false,
    };

    config.ignoreWarnings = [
      { module: /node_modules\/typeorm\/util\/ImportUtils\.js/ },
      { module: /node_modules\/typeorm\/util\/DirectoryExportedClassesLoader\.js/ },
      { module: /node_modules\/typeorm\/platform\/PlatformTools\.js/ },
      { module: /node_modules\/typeorm\/connection\/ConnectionOptionsReader\.js/ },
      { module: /node_modules\/app-root-path\/lib\/app-root-path\.js/ },
    ];

    config.plugins = [
      ...config.plugins,
      // This helps typeorm find sql.js driver. If we remove this then we
      // need to pass the driver in datasource initialization.
      new webpack.ProvidePlugin({
        'window.SQL': 'sql.js/dist/sql-wasm.js'
      }),
      new FilterWarningsPlugin({
        exclude: [
          /aws-crt/,
          /mongodb/,
          /encoding/,
          /mssql/,
          /mysql/,
          /mysql2/,
          /oracledb/,
          /pg/,
          /pg-native/,
          /pg-query-stream/,
          /react-native-sqlite-storage/,
          /redis/,
          /sqlite3/,
          /sql.js/,
          /typeorm-aurora-data-api-driver/,
          /hdb-pool/,
          /spanner/,
          /hana-client/,
        ],
      }),
    ];

    return config;
  },
}

module.exports = nextConfig
