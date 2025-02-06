export default function TermsPage() {
  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="space-y-6 text-[#d7dadc]">
          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using SpotLight, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">2. User Conduct</h2>
            <p className="leading-relaxed">
              Users are expected to maintain respectful and appropriate behavior. Content that is harmful, threatening, abusive, or otherwise objectionable is prohibited.
            </p>
          </section>

          <section className="bg-black/20 backdrop-blur-[4px] border border-[#343536] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">3. Content Guidelines</h2>
            <p className="leading-relaxed">
              Users retain ownership of their content but grant SpotLight a license to use, distribute, and display this content on our platform.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
} 