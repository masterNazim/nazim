"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Mail, Phone, MapPin } from "lucide-react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)
  const { supabase } = useSupabase()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("contact_messages").insert([formData])

      if (error) throw error

      setSubmitStatus({
        type: "success",
        message: "Your message has been sent successfully! We will get back to you soon.",
      })

      setFormData({ name: "", email: "", message: "" })
    } catch (error) {
      console.error("Error submitting form:", error)
      setSubmitStatus({
        type: "error",
        message: "There was an error sending your message. Please try again later.",
      })
    } finally {
      setIsSubmitting(false)

      // Clear status after 5 seconds
      setTimeout(() => {
        setSubmitStatus(null)
      }, 5000)
    }
  }

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 to-stone-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Get In <span className="text-amber-500">Touch</span>
          </h2>
          <p className="text-gray-700 text-lg max-w-3xl mx-auto">
            Have questions about our products or services? Get in touch with us and we'll be happy to assist you.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-amber-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">Contact Information</h3>
              <p className="text-gray-600 mb-8">Fill out the form and our team will get back to you within 24 hours.</p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Our Location</h4>
                    <p className="text-gray-600">H# DNCC-72, Rd# Bata goli, Shahjadpur(30 acre), Gulshan, Dhaka 1212</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Phone Numbers</h4>
                    <p className="text-gray-600">+8801757-377494</p>
                    <p className="text-gray-600 text-sm">+8801674766815 (Delivery Query)</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">Email Address</h4>
                    <p className="text-gray-600">Eighthandswork@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg border border-amber-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-800 font-semibold mb-3">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-800 font-semibold mb-3">
                    Your Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-800 font-semibold mb-3">
                    Your Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-300 resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>

                {submitStatus && (
                  <div
                    className={`p-4 rounded-xl ${submitStatus.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                  >
                    {submitStatus.message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
