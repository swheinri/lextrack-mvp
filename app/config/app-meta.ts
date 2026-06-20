// app/config/app-meta.ts
import { APP_VERSION } from './app-version';

export const APP_BUILD_DATE =
  process.env.NEXT_PUBLIC_APP_BUILD_DATE || 'unknown';

export { APP_VERSION };