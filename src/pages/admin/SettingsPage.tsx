import { Helmet } from "react-helmet-async";

export default function SettingsPage() {
  return (
    <>
      <Helmet>
        <title>Site Settings | Korea By Local Admin</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Site Settings</h1>
        <p className="mt-2 text-text-secondary">Configure global site settings.</p>
      </div>
    </>
  );
}
