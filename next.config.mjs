import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    images: {
        domains: ["avatars.githubusercontent.com", "avatar.vercel.sh"]
    },
    webpack: (config) => {
        config.resolve.alias['hexoid'] = path.resolve('node_modules/hexoid/dist/index.js');
        return config;
    }
};

export default nextConfig;
