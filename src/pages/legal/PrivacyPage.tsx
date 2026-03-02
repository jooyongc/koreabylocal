import PageSEO from "@/components/common/PageSEO";

export default function PrivacyPage() {
  return (
    <>
      <PageSEO
        title="Privacy Policy | Korea By Local"
        description="Read our privacy policy to understand how we handle your data."
        path="/privacy"
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
      </div>
    </>
  );
}
