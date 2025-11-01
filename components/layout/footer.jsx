import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Mail, Phone, MapPin, Youtube, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-50 text-gray-800 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image src="/logo.png" alt="Eight Hands Work" width={150} height={60} className="h-12 w-auto" />
            </Link>
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Eight Hands Work</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Premium custom epoxy furniture crafted with excellence since 2017. We are committed to delivering the
                highest quality products on time.
              </p>
            </div>

            <div className="flex space-x-3 mb-6">
              <a
                href="https://www.facebook.com/Eighthandswork"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-300"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@eighthandswork.official"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors duration-300"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white hover:bg-blue-800 transition-colors duration-300"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/collections"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  All Collections
                </Link>
              </li>
              <li>
                <Link
                  href="/interior"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Interior Design
                </Link>
              </li>
              <li>
                <Link
                  href="/resellers"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Reseller
                </Link>
              </li>
              <li>
                <Link
                  href="/epoxy-services"
                  className="text-gray-600 hover:text-gray-800 transition-colors duration-300 text-sm"
                >
                  Epoxy Service
                </Link>
              </li>
            </ul>
          </div>


        </div>

        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-600">Premium Quality Guaranteed</p>
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Eight Hands Work. All rights reserved
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 mr-2">PAYMENT</span>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  MC
                </div>
                <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
                  AE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
