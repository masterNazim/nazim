"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Search, Mail, Calendar, User, Trash2, Eye, MailOpen, Star } from "lucide-react"

export const dynamic = "force-dynamic"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
  })

  useEffect(() => {
    fetchMessages()
    fetchStats()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/messages")
      const result = await response.json()

      if (!result.success) throw new Error(result.error)
      setMessages(result.data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast.error("Failed to fetch messages")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/messages")
      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      const today = new Date().toDateString()
      const todayMessages = result.data.filter((msg) => new Date(msg.created_at).toDateString() === today).length || 0

      const unreadMessages = result.data.filter((msg) => !msg.is_read).length || 0

      setStats({
        total: result.data.length || 0,
        unread: unreadMessages,
        today: todayMessages,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_read: true }),
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, is_read: true } : msg)))
      fetchStats()
    } catch (error) {
      console.error("Error marking as read:", error)
      toast.error("Failed to mark as read")
    }
  }

  const deleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return

    try {
      const response = await fetch(`/api/admin/messages/${messageId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) throw new Error(result.error)

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
      setSelectedMessage(null)
      fetchStats()
      toast.success("Message deleted successfully")
    } catch (error) {
      console.error("Error deleting message:", error)
      toast.error("Failed to delete message")
    }
  }

  const filteredMessages = messages.filter(
    (message) =>
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contact Messages</h1>
        <Button onClick={fetchMessages} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
              </div>
              <MailOpen className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <Card
              key={message.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMessage?.id === message.id ? "ring-2 ring-amber-500" : ""
              } ${!message.is_read ? "bg-blue-50 border-blue-200" : ""}`}
              onClick={() => {
                setSelectedMessage(message)
                if (!message.is_read) {
                  markAsRead(message.id)
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold">{message.name}</span>
                    {!message.is_read && (
                      <Badge variant="destructive" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
                </div>

                <p className="text-sm text-gray-600 mb-2">{message.email}</p>
                <p className="text-sm line-clamp-2">{message.message}</p>
              </CardContent>
            </Card>
          ))}

          {filteredMessages.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No messages found</h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try adjusting your search terms" : "No contact messages yet"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Message Detail */}
        <div>
          {selectedMessage ? (
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Message Details</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">From:</label>
                  <p className="font-semibold">{selectedMessage.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email:</label>
                  <p>{selectedMessage.email}</p>
                </div>

                {selectedMessage.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone:</label>
                    <p>{selectedMessage.phone}</p>
                  </div>
                )}

                {selectedMessage.subject && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Subject:</label>
                    <p>{selectedMessage.subject}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Date:</label>
                  <p>{formatDate(selectedMessage.created_at)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Message:</label>
                  <div className="bg-gray-50 p-4 rounded-lg mt-2">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button className="w-full" onClick={() => (window.location.href = `mailto:${selectedMessage.email}`)}>
                    Reply via Email
                  </Button>
                  <Button
                    className="w-full mt-2 bg-amber-600 hover:bg-amber-700"
                    onClick={() => window.open("/admin/reviews", "_blank")}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Admin Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="sticky top-6">
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Select a message</h3>
                <p className="text-gray-500">Click on a message to view its details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
