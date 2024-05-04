/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    experimental: {
        serverComponentsExternalPackages: ['sharp', 'onnxruntime-node'],
    },
};

export default nextConfig;
