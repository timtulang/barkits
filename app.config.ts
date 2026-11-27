import type { ExpoConfig } from 'expo/config';

const appId = 'com.timtulang.barkits';
const linkHost = process.env.BARKITS_LINK_HOST?.trim().toLowerCase();

if (linkHost && !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(linkHost)) {
  throw new Error('BARKITS_LINK_HOST must be a hostname without a scheme, port, or path.');
}

const config: ExpoConfig = {
  name: 'Barkits',
  slug: 'barkits',
  scheme: 'barkits',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-router',
    ['expo-secure-store', { faceIDPermission: false }],
    ['expo-location', {
      locationWhenInUsePermission: 'Barkits uses your location when you choose a starting point for a meetup.',
      locationAlwaysPermission: false,
      locationAlwaysAndWhenInUsePermission: false,
    }],
  ],
  web: { bundler: 'metro', output: 'single' },
  android: {
    package: appId,
    ...(linkHost && {
      intentFilters: [{
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [{ scheme: 'https', host: linkHost, pathPrefix: '/meetups/' }],
      }],
    }),
  },
  ios: {
    bundleIdentifier: appId,
    ...(linkHost && { associatedDomains: [`applinks:${linkHost}`] }),
  },
};

export default config;
