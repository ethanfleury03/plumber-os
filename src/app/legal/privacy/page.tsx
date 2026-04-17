export default function PrivacyPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Privacy policy</h1>
      <p className="text-slate-600 leading-relaxed mb-4">
        This page is a placeholder for your privacy policy. It should describe what data you collect (including
        customer data processed on behalf of tenants), how it is used, retention, subprocessors (e.g. Clerk, Stripe,
        Twilio, hosting), and individual rights.
      </p>
      <p className="text-slate-600 leading-relaxed">
        Your deployed app includes privacy export/delete endpoints for customer requests; document how operators
        should use them and how end-customers can contact the shop or you for requests.
      </p>
    </>
  );
}
