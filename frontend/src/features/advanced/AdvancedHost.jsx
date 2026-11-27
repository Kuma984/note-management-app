import React from 'react';
import NoteLockHost from './lock/NoteLockHost';
import ShareNotice from './share/ShareNotice';
import AskAI from './ai/AskAI';
import OfflineBanner from '../../offline/OfflineBanner';

/**
 * Render ONCE inside MainLayout. Provides everything that is global to Member 3's features:
 *  - password dialog for locked notes   - "note shared with you" notice
 *  - floating "Ask AI" button + panel   - offline / sync status banner
 */
export default function AdvancedHost() {
  return (
    <>
      <NoteLockHost />
      <ShareNotice />
      <AskAI />
      <OfflineBanner />
    </>
  );
}
