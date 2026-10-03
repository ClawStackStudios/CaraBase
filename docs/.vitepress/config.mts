import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CaraBase',
  description: 'The Lobsterized©™ BaaS — SQLite-backed Database-as-a-Service',
  base: process.env.GITHUB_ACTIONS ? '/CaraBase/' : '/',
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#14b8a6' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'CaraBase',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Architecture', link: '/architecture' },
      {
        text: 'Guide',
        items: [
          { text: 'Installation', link: '/installation' },
          { text: 'Cloudflare Tunnels', link: '/cloudflare-tunnel' },
          { text: 'API Keys & Auth', link: '/api-keys' },
          { text: 'Row-Level Security', link: '/rls' },
          { text: 'Storage Engine', link: '/storage' },
          { text: 'Realtime SSE', link: '/realtime' },
        ],
      },
      {
        text: 'Operations',
        items: [
          { text: 'Admin Setup & RBAC', link: '/admin-setup' },
          { text: 'SuperAdmin Portal', link: '/superadmin' },
          { text: 'Dashboard Tools', link: '/dashboard' },
        ],
      },
      {
        text: 'SDKs',
        items: [
          { text: 'TypeScript / React', link: '/react-integration' },
          { text: 'Android / Kotlin', link: '/android-sdk' },
          { text: 'Realtime Example App', link: '/realtime-example' },
        ],
      },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Overview',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Architecture & Philosophy', link: '/architecture' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation & Hosting', link: '/installation' },
          { text: 'Cloudflare Tunnels', link: '/cloudflare-tunnel' },
        ],
      },
      {
        text: 'Database & Security',
        items: [
          { text: 'Authentication & API Keys', link: '/api-keys' },
          { text: 'Row-Level Security (RLS)', link: '/rls' },
          { text: 'Custom Dynamic API Builder', link: '/api-builder' },
          { text: 'RLS Integration Guides', link: '/rls-integration-guides' },
        ],
      },
      {
        text: 'Storage & Realtime',
        items: [
          { text: 'Storage Engine & Membrane', link: '/storage' },
          { text: 'Realtime Event Streaming', link: '/realtime' },
          { text: 'Realtime Example App', link: '/realtime-example' },
        ],
      },
      {
        text: 'Administration & Operations',
        items: [
          { text: 'Administrator Setup & RBAC', link: '/admin-setup' },
          { text: 'SuperAdmin Operations', link: '/superadmin' },
          { text: 'Advanced Dashboard Tools', link: '/dashboard' },
        ],
      },
      {
        text: 'Client SDKs',
        items: [
          { text: 'TypeScript / React SDK', link: '/react-integration' },
          { text: 'Android / Kotlin SDK', link: '/android-sdk' },
        ],
      },
      {
        text: 'Legal',
        items: [
          { text: 'Terms of Service', link: '/tos' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/ClawStackStudios/CaraBase' },
    ],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'CaraBase: The Core You Actually Use — LAN-First, Self-Hosted SQLite DBaaS',
      copyright: 'Copyright © 2026 ClawStack Studios©™',
    },
  },
});
