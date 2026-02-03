import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold text-lg mb-4">BuildTrack</h3>
              <p className="text-sm">
                Clarity and accountability for construction workflows
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">
                Email:{" "}
                <a href="mailto:hello@buildtrack.local" className="hover:text-white transition-colors">
                  hello@buildtrack.local
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-sm text-center">
              © {new Date().getFullYear()} BuildTrack. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
