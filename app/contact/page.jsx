"use client"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { Mail, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
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

      toast.success("Your message has been sent successfully! We will get back to you soon.")
      setFormData({ name: "", email: "", message: "" })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("There was an error sending your message. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Contact Us</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions about our products or services? Get in touch with us and we'll be happy to assist you.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Information */}
            <Card className="h-fit">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Contact Information</h2>
                <p className="text-gray-600 mb-8">
                  Fill out the form and our team will get back to you within 24 hours.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                      <MapPin className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Our Location</h3>
                      <p className="text-gray-600">H# DNCC-72, Rd# Bata goli, Shahjadpur(30 acre), Gulshan, Dhaka 1212</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                      <Phone className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Phone Numbers</h3>
                      <p className="text-gray-600">+8801757-377494</p>
                      <p className="text-gray-600 text-sm">+8801674766815 (Delivery Query)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="bg-amber-100 p-3 rounded-lg">
                      <Mail className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Email Address</h3>
                      <p className="text-gray-600">Eighthandswork@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">Business Hours</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tuesday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Wednesday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thursday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Friday:</span>
                      <span className="font-medium">CLOSED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saturday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunday:</span>
                      <span className="font-medium">10:00 AM - 9:00 PM</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your full name"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email *
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email address"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us about your furniture needs or any questions you have..."
                      className="w-full resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3"
                    size="lg"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Map Section */}
          <Card className="mt-8">
            <CardContent className="p-0">
              <div className="p-6 bg-gray-50 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Visit Our Workshop</h2>
                <p className="text-gray-600 mt-1">
                  Come see our craftsmen at work and explore our furniture collection
                </p>
              </div>
              <div className="h-96">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.0977!2d90.4125096!3d23.7808875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c09e5d88e24b%3A0xb19c1b2dc8c7b45a!2sGulshan%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1715511568!5m2!1sen!2sbd"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
