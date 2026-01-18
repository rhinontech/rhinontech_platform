import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            {/* Header */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                    {/* Placeholder for Company Logo - using text as per prompt or generic icon */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-blue-900 rounded-md flex items-center justify-center text-white font-bold text-xs">
                            RT
                        </div>
                        <span className="font-semibold text-lg tracking-tight">Help Center</span>
                    </div>
                </div>
                <a
                    href="https://rhinon.tech"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                    Visit rhinon.tech
                </a>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-2xl mx-auto w-full py-20">
                <h1 className="text-blue-600 font-medium text-lg mb-4">404 error</h1>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                    Page not found
                </h2>
                <p className="text-lg text-gray-600 mb-12 max-w-lg">
                    Sorry, we can’t find the page you are looking for.
                </p>

                {/* Helpful Links */}
                <div className="w-full text-left max-w-md">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Here are some helpful links instead:</p>
                    <ul className="space-y-3">
                        <li>
                            <Link href="/" className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                                <span className="text-blue-600 font-medium">Find out more about Knowledge Base</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                            </Link>
                        </li>
                        <li>
                            <a href="#" className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                                <span className="text-blue-600 font-medium">See how to set up your Help Center</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                            </a>
                        </li>
                    </ul>

                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 mb-4">For admins:</p>
                        <Link href="/admin/help" className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                            <span className="text-blue-600 font-medium">Why do you see 404 error on your Help Center</span>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-gray-400">
                &copy; {new Date().getFullYear()} Rhinon Tech. All rights reserved.
            </footer>
        </div>
    );
}
