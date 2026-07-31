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

  // The dashboard's flat routes (`/people`, `/profiles`, `/users`) moved under
  // the hierarchical Module/Group/Routine paths the sidebar now uses
  // (`lib/navigation/catalog.ts`). The catalog itself was originally in
  // Portuguese (`/cadastros/pessoas/...`, in both a 4-segment and later
  // 3-segment form) before the project's Language Standard
  // (`.claude/rules/rules-global.md`) translated it to English — this is a
  // pre-production project, so those Portuguese-era paths were dropped rather
  // than kept redirecting forever. Only the flat English paths still redirect.
  async redirects() {
    return [
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
