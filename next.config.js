/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    // https://github.com/scttcper/qbittorrent/issues/106#issuecomment-1166186829
    config.resolve.alias = {
      ...config.resolve.alias,
      keyv: false,
    };
    return config;
  },
};

module.exports = nextConfig;
