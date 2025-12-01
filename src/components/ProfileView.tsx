import type { ProfilePageVM } from '../types';
import ProfileCard from './ProfileCard';
import ProfileActions from './ProfileActions';
import { Breadcrumbs } from './Breadcrumbs';

interface ProfileViewProps {
  userProfile: ProfilePageVM;
}

/**
 * ProfileView component - main view for user profile page.
 * Displays user profile information and available actions.
 */
export default function ProfileView({ userProfile }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'SmartBudgetAI', href: '/dashboard' },
          { label: 'Profil' },
        ]}
        showSidebarToggle={true}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil użytkownika</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj swoim kontem i ustawieniami
        </p>
      </div>

      <ProfileCard
        email={userProfile.email}
        nickname={userProfile.nickname}
        registeredAt={userProfile.registeredAt}
      />

      <ProfileActions />
    </div>
  );
}

