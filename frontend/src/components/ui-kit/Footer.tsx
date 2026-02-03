"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-600 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
            <a
              href="mailto:contact@buildtrack.app"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} BuildTrack. All rights reserved.
          </div>

          {/* Date */}
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
