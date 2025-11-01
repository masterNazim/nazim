export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p className="mb-4">
            At Eight Hand Work, we collect information you provide directly to us, such as when you create an account,
            make a purchase, or contact us for support.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p className="mb-4">
            We use the information we collect to provide, maintain, and improve our services, process transactions, and
            communicate with you about your orders and our products.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information Sharing</h2>
          <p className="mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your
            consent, except as described in this privacy policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Eight Hand Work Limited</strong>
            </p>
            <p>House 27, Road No 12/A, Block H, Banani, Dhaka-1212</p>
            <p>Email: privacy@eighthandwork.com</p>
            <p>Phone: +880 01841297415</p>
          </div>
        </section>
      </div>
    </div>
  )
}
