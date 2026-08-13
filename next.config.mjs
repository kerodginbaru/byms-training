/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }
    ]
  },
  eslint: {
    // Lint runs in CI separately; do not let warnings block prod builds.
    ignoreDuringBuilds: false
  }
};

export default nextConfig;
