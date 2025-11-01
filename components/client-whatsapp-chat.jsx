"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X, Phone, Send } from "lucide-react"

export default function ClientWhatsAppChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [customMessage, setCustomMessage] = useState("")

  // WhatsApp number - Update this with your actual WhatsApp business number
  const whatsappNumber = "+8801757377494"
  
  // Pre-defined message
  const defaultMessage = "Hello! I'm interested in your furniture products. Can you help me?"

  useEffect(() => {
    // Show the chat button after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const openWhatsApp = (message = defaultMessage) => {
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
    setIsOpen(false)
  }

  const quickMessages = [
    "I want to know about your products",
    "What are your prices?", 
    "Do you deliver to my area?",
    "I need custom furniture",
    "What's your delivery time?"
  ]

  if (!isVisible) return null

  return (
    <>
      {/* Chat Widget */}
      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'transform scale-100' : 'transform scale-100'}`}>
        
        {/* Chat Box */}
        {isOpen && (
          <div className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 max-w-[calc(100vw-3rem)]">
            {/* Header */}
            <div className="bg-green-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <MessageCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Eight Hands Work</h3>
                  <p className="text-xs opacity-90">Typically replies instantly</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-600 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-700">
                    👋 Hi there! How can we help you today?
                  </p>
                </div>
              </div>

              {/* Quick Messages */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Quick messages:</p>
                {quickMessages.map((message, index) => (
                  <button
                    key={index}
                    onClick={() => openWhatsApp(message)}
                    className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200"
                  >
                    {message}
                  </button>
                ))}
              </div>

              {/* Custom Message Input */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 mb-2 block">Or type your own message:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customMessage.trim()) {
                        openWhatsApp(customMessage)
                        setCustomMessage('')
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (customMessage.trim()) {
                        openWhatsApp(customMessage)
                        setCustomMessage('')
                      }
                    }}
                    disabled={!customMessage.trim()}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-2 rounded-lg transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Direct Chat Button */}
              <button
                onClick={() => openWhatsApp()}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Start Chat on WhatsApp
              </button>

              {/* Phone Number */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">Or call us directly:</p>
                <a 
                  href={`tel:${whatsappNumber}`}
                  className="text-sm font-medium text-green-600 hover:text-green-700 flex items-center justify-center mt-1"
                >
                  <Phone className="h-4 w-4 mr-1" />
                  {whatsappNumber}
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Chat Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 ${
            isOpen ? 'rotate-0' : 'rotate-0 hover:rotate-12'
          }`}
          aria-label="Open WhatsApp Chat"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </button>

        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            1
          </div>
        )}
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
