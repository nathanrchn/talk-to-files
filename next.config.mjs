/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,    
    output: "export",
    distDir: "dist",
    // experimental: {
        // serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],        
    // },
    // transpilePackages: ["@tauri-apps/app"]
};

export default nextConfig;
