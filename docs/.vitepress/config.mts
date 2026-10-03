import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CaraBase',
  description: 'The Lobsterized©™ BaaS — SQLite-backed Database-as-a-Service',
  base: process.env.GITHUB_ACTIONS ? '/CaraBase/' : '/',
  ignoreDeadLinks: true,
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['meta', { name: 'theme-color', content: '#14b8a6' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    siteTitle: 'CaraBase',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guides', link: '/tables' },
      { text: 'Reference', link: '/api-reference' },
      { text: 'SDKs', link: '/react-integration' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quickstart (5-minute path)', link: '/quickstart' },
          { text: 'Generate your secrets', link: '/generate-secrets' },
          { text: 'Installation', link: '/installation' },
          { text: 'First login and roles', link: '/first-login' },
          { text: 'Setup Wizard walkthrough', link: '/setup-wizard' },
        ],
      },
      {
        text: 'Core Concepts',
        items: [
          { text: 'Key types and prefixes', link: '/key-types' },
          { text: 'Roles and the dashboard split', link: '/roles-dashboard' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Tables and Table Editor', link: '/tables' },
          { text: 'SQL Editor', link: '/sql-editor' },
          { text: 'Views / Indexes / Triggers', link: '/views-indexes-triggers' },
          { text: 'Row-Level Security (RLS)', link: '/rls' },
          { text: 'RLS policies in the UI', link: '/rls-ui' },
          { text: 'Custom API Builder', link: '/api-builder' },
          { text: 'Storage Engine', link: '/storage' },
          { text: 'Realtime SSE', link: '/realtime' },
          { text: 'Backups and restore', link: '/backups' },
          { text: 'SuperAdmin portal and audit', link: '/superadmin' },
        ],
      },
      {
        text: 'Client Libraries',
        items: [
          { text: 'REST API quickstart', link: '/rest-quickstart' },
          { text: 'JS/TS SDK & React', link: '/react-integration' },
          { text: 'Realtime Example App', link: '/realtime-example' },
          { text: 'Android / Kotlin SDK', link: '/android-sdk' },
        ],
      },
      {
        text: 'Production',
        items: [
          { text: 'Cloudflare Tunnel', link: '/cloudflare-tunnel' },
          { text: 'Security checklist', link: '/security-checklist' },
          { text: 'Upgrading', link: '/upgrading' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Environment variables', link: '/env-vars' },
          { text: 'API reference', link: '/api-reference' },
          { text: 'Error codes', link: '/error-codes' },
          { text: 'Changelog', link: '/changelog' },
        ],
      },
      {
        text: 'Help',
        items: [
          { text: 'Troubleshooting and FAQ', link: '/troubleshooting' },
        ],
      },
      {
        text: 'Contribute',
        items: [
          { text: 'Architecture deep-dive', link: '/architecture' },
          { text: 'Contributing', link: '/contributing' },
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
