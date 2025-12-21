import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage application settings and data."
      />
      <div className="space-y-8">
        <SettingsClient />
      </div>
    </>
  );
}
