"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"

export default function WhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const openWhatsApp = () => {
    const phoneNumber = "+8801234567890" // Replace with your actual WhatsApp number
    const message = "Hi! I'm interested in your furniture products. Can you help me?"
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 bg-white rounded-lg shadow-lg border p-4 w-80 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">EightHand Support</h3>
                <p className="text-xs text-gray-500">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={toggleChat} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-sm text-gray-700">
              👋 Hi there! Welcome to EightHand Furniture. How can we help you today?
            </p>
          </div>

          <button
            onClick={openWhatsApp}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Start Chat on WhatsApp</span>
          </button>
        </div>
      )}

      <button
        onClick={toggleChat}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}
