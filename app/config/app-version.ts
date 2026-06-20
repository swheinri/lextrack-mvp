// app/config/app-version.ts
const raw = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0';

export const APP_VERSION = raw.startsWith('v') ? raw : `v${raw}`;
export const APP_VERSION_LABEL = `LexTrack ${APP_VERSION}`;