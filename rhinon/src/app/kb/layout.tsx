import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rhinontech - Your One Stop Solution",
  description:
    "Rhinontech is your one-stop solution for all your business needs, offering a wide range of services to help you succeed.",
};

export default function KbLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center z-20 sticky top-0 justify-between px-6 py-4 bg-white border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img
            src="https://rhinontech.s3.ap-south-1.amazonaws.com/new-rhinontech/attachments/Rhino%20Logo-1758694193809.jpg"
            alt="Rhino Logo"
            className="w-8 h-8 object-contain"
          />
          <span className="text-lg font-medium text-gray-900">Help Center</span>
        </div>
        <a
          href="https://rhinontech.com"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          Visit rhinontech.com
          <ArrowRight className="w-4 h-4" />
        </a>
      </header>
      {children}
    </div>
  );
}
