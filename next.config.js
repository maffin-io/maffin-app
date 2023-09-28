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
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'react-native-sqlite-storage': false,
      };

      config.plugins = [
        ...config.plugins,
        // This helps typeorm find sql.js driver. If we remove this then we
        // need to pass the driver in datasource initialization.
        new webpack.ProvidePlugin({
          'window.SQL': 'sql.js/dist/sql-wasm.js'
        }),
        new FilterWarningsPlugin({
          exclude: [
            /mongodb/,
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
            /typeorm-aurora-data-api-driver/
          ],
        }),
      ];
    }

    return config;
  },
}

module.exports = nextConfig
