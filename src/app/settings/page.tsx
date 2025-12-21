import { PageHeader } from "@/components/shared/page-header";
import { SettingsClient } from "@/components/settings/settings-client";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Configuración"
        description="Gestiona la configuración y los datos de la aplicación."
      />
      <div className="space-y-8">
        <SettingsClient />
      </div>
    </>
  );
}
