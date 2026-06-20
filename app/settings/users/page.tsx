// app/settings/users/page.tsx
'use client';

import React from 'react';
import { useLanguage } from '../../components/i18n/language';
import UsersRolesSection from '../sections/users-roles-section';

export default function UsersPage() {
  const { language } = useLanguage();
  const isDe = language === 'de';

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <UsersRolesSection />
    </div>
  );
}