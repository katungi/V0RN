/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    }, 
    images: {
        domains: ["avatars.githubusercontent.com"]
    }
};

export default nextConfig;
