// app/components/greeting-banner.tsx
'use client';

import { useLanguage } from './i18n/language';
import { useUserPreferences } from './userpreferences';

function getTimeGreeting(lang: 'de' | 'en') {
  const hour = new Date().getHours(); // lokale Browser-Zeit

  if (hour >= 5 && hour < 11) {
    return lang === 'de' ? 'Guten Morgen' : 'Good morning';
  }
  if (hour >= 11 && hour < 17) {
    return lang === 'de' ? 'Guten Tag' : 'Good afternoon';
  }
  if (hour >= 17 && hour < 22) {
    return lang === 'de' ? 'Guten Abend' : 'Good evening';
  }
  // späte Nacht
  return lang === 'de' ? 'Guten Abend' : 'Good evening';
}

export default function GreetingBanner() {
  const { language } = useLanguage();
  const { displayName, personalGreeting } = useUserPreferences();

  const lang: 'de' | 'en' = language === 'en' ? 'en' : 'de';

  // Wenn persönliche Begrüßung ausgeschaltet ist → nichts anzeigen
  if (!personalGreeting) return null;

  const timeGreeting = getTimeGreeting(lang);

  const name =
    displayName && displayName.trim().length > 0
      ? displayName.trim()
      : lang === 'de'
      ? 'LexTrack-Nutzer:in'
      : 'LexTrack user';

  const subtitle =
    lang === 'de'
      ? 'Hier hast du deine wichtigsten Compliance-Themen im Blick.'
      : 'Here you keep an eye on your key compliance topics.';

  return (
    <div className="rounded-xl bg-gradient-to-r from-[#041225] via-[#006173] to-[#009A93] px-4 py-3 text-white shadow-sm">
      <p className="text-sm sm:text-base font-semibold">
        {timeGreeting}, {name}.
      </p>
      <p className="mt-1 text-xs sm:text-sm text-white/80">{subtitle}</p>
    </div>
  );
}
