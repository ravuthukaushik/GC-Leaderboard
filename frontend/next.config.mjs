/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev double-invokes effects, which fights the imperative GSAP timelines
  // (production renders once). Keep dev behaviour identical to production.
  reactStrictMode: false,
  experimental: {
    typedRoutes: false
  }
};

export default nextConfig;
