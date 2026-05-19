/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lotto-emr/core', '@lotto-emr/ui'],
  experimental: { typedRoutes: true },
  env: {
    NEXT_PUBLIC_MEDPLUM_BASE_URL: process.env.MEDPLUM_BASE_URL,
    NEXT_PUBLIC_MEDPLUM_CLIENT_ID: process.env.MEDPLUM_CLIENT_ID,
  },
};
export default nextConfig;
