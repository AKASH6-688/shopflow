import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-100">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SF</span>
          </div>
          <span className="text-xl font-bold text-gray-900">ShopFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Log In
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            🚀 Works with Shopify, WooCommerce, Wix & Custom Stores
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Your All-in-One<br />
            <span className="text-brand-700">E-Commerce Command Center</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Track inventory, monitor profits, manage customers, automate WhatsApp & email notifications,
            AI-powered customer support, and find winning products — all from one dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register" className="bg-brand-700 text-white px-8 py-3 rounded-lg hover:bg-brand-800 transition-colors font-semibold text-lg">
              Start Free Trial
            </Link>
            <Link href="#features" className="bg-white text-gray-700 px-8 py-3 rounded-lg border hover:bg-gray-50 transition-colors font-semibold text-lg">
              See Features
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="card p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Plugin Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Drop-in Plugin for Any Store</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Add ShopFlow to your store with a single line of code. Works with Shopify, WooCommerce, Wix, and any custom platform.
          </p>
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 max-w-2xl mx-auto text-left font-mono text-sm">
            <p className="text-gray-500">{"<!-- Add this to your store's HTML -->"}</p>
            <p className="mt-2">
              <span className="text-purple-400">{"<script"}</span>
              <span className="text-blue-300">{" src"}</span>
              <span className="text-white">{"="}</span>
              <span className="text-green-300">{'"https://your-shopflow.com/embed.js"'}</span>
            </p>
            <p className="ml-8">
              <span className="text-blue-300">{"data-token"}</span>
              <span className="text-white">{"="}</span>
              <span className="text-green-300">{'"YOUR_PLUGIN_TOKEN"'}</span>
              <span className="text-purple-400">{"></script>"}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-500 text-sm">
          © 2026 ShopFlow. All-in-one e-commerce management.
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "📦",
    title: "Inventory Tracking",
    description: "Real-time stock levels, low-stock alerts, warehouse management, and automatic sync with your platform.",
  },
  {
    icon: "🏆",
    title: "Winning Products",
    description: "AI-powered scoring identifies your top performers based on sales velocity, profit margin, and trends.",
  },
  {
    icon: "📊",
    title: "Profit & Loss Analytics",
    description: "Beautiful graphs for 15-day, monthly, yearly, 2-year, and 5-year performance tracking.",
  },
  {
    icon: "🚫",
    title: "Customer Blacklist",
    description: "Auto-track non-receiving customers. Get alerts when blacklisted customers order again.",
  },
  {
    icon: "💬",
    title: "WhatsApp & Email Automation",
    description: "Auto-send order confirmations, tracking numbers, and thank-you notes via WhatsApp and email.",
  },
  {
    icon: "📞",
    title: "Call Confirmation",
    description: "Automated phone calls to confirm orders. Reduce returns and improve delivery rates.",
  },
  {
    icon: "🤖",
    title: "AI Customer Support",
    description: "AI chatbot answers product questions, compares pricing, and provides instant support.",
  },
  {
    icon: "💬",
    title: "Conversation Dashboard",
    description: "View all AI-customer conversations. Jump in manually anytime you spot something wrong.",
  },
  {
    icon: "🔌",
    title: "Multi-Platform Plugin",
    description: "One-line embed works on Shopify, WooCommerce, Wix, and any custom store platform.",
  },
];
