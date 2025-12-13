import React from "react";
import type { ProfileSettingsPageVM } from "../types";
import { EditProfileSection } from "./EditProfileSection";
import { DeleteAccountSection } from "./DeleteAccountSection";

interface ProfileSettingsViewProps {
  userProfile: ProfileSettingsPageVM;
}

/**
 * Main component for the Profile Settings view.
 * Organizes and renders two main sections: profile editing and account deletion.
 */
export default function ProfileSettingsView({ userProfile }: ProfileSettingsViewProps) {
  return (
    <div className="space-y-8">
      {/* Edit Profile Section */}
      <EditProfileSection
        initialNickname={userProfile.nickname}
        onProfileUpdated={(updatedNickname) => {
          console.log("Profile updated:", updatedNickname);
        }}
      />

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Delete Account Section */}
      <DeleteAccountSection />
    </div>
  );
}
