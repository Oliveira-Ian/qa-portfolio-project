import type { NextConfig } from 'next';
import { ROUTES } from './lib/navigation/routes';

const nextConfig: NextConfig = {
  // Minimal self-contained server + node_modules for the Docker image.
  output: 'standalone',

  experimental: {
    // Both ship a barrel entry with thousands of re-exports; without this the
    // dev server and every cold start pay to load all of them to use a handful.
    optimizePackageImports: ['lucide-react', 'radix-ui'],
  },

  // The ERP's screens moved under its own `/erp` area (docs/adr/0019), keeping
  // the Module/Group/Routine shape inside it (docs/adr/0007): `/records/…` and
  // `/administration/…` are now `/erp/records/…` and `/erp/administration/…`, and
  // the older flat paths (`/people`, `/profiles`, `/users`) go straight to today's.
  // The catalog was originally in Portuguese (`/cadastros/pessoas/...`) before
  // the project's Language Standard (`.claude/rules/rules-global.md`) translated
  // it — this is a pre-production project, so those paths were dropped rather
  // than kept redirecting forever. Every path a bookmark could still hold
  // redirects permanently.
  async redirects() {
    return [
      {
        source: '/records/:path*',
        destination: '/erp/records/:path*',
        permanent: true,
      },
      {
        source: '/administration/:path*',
        destination: '/erp/administration/:path*',
        permanent: true,
      },
      {
        source: '/people/:path*',
        destination: `${ROUTES.people.list}/:path*`,
        permanent: true,
      },
      {
        source: '/profiles/:path*',
        destination: `${ROUTES.profiles.list}/:path*`,
        permanent: true,
      },
      {
        source: '/users/:path*',
        destination: `${ROUTES.accounts.list}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
