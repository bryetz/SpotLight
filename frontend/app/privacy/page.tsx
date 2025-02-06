export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="space-y-6 text-[#d7dadc]">
          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Data Collection</h2>
            <p className="leading-relaxed">
              We collect information that you provide directly to us, including location data, account information, and content you post on SpotLight.
            </p>
          </section>

          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Data Usage</h2>
            <p className="leading-relaxed">
              Your data is used to provide and improve our services, personalize your experience, and enable location-based features.
            </p>
          </section>

          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Data Protection</h2>
            <p className="leading-relaxed">
              We implement appropriate security measures to protect your personal information from unauthorized access or disclosure.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
} 