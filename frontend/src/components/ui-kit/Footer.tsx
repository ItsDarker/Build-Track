"use client";

import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + Links */}
          <div className="flex items-center gap-6">
            <Logo href="/" size="sm" showText={false} />
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
          </div>

          {/* Copyright */}
          <div className="text-sm text-gray-500">
            &copy; {currentYear} BuildTrack. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
