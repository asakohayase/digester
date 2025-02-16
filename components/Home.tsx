"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useStytchUser } from '@stytch/nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Initialize Supabase client with types
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Define types based on your schema
type Profile = Database['public']['Tables']['profiles']['Row']
type Request = Database['public']['Tables']['requests']['Row'] & {
  source_urls: Database['public']['Tables']['source_urls']['Row'][]
  request_content: Database['public']['Tables']['request_content']['Row'] | null
}

export default function Home() {
  const { user } = useStytchUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        if (!user?.user_id) {
          throw new Error('User not found')
        }

        // First get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user_id)
          .single()

        if (profileError) throw profileError
        setProfile(profileData)

        // Then get requests with related data
        const { data: requestsData, error: requestsError } = await supabase
          .from('requests')
          .select(`
            *,
            source_urls (*),
            request_content (*)
          `)
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })

        if (requestsError) throw requestsError
        setRequests(requestsData || [])

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load your content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (user?.user_id) {
      fetchData()
    }
  }, [user])

  // Get the latest request
  const latestRequest = requests[0]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-content">
      <div className="container max-w-5xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <header className="flex items-start gap-6 mb-12">
          <Image
            src="/avatar1.png"
            alt="Welcome avatar"
            width={64}
            height={64}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-serif mb-2">
              Welcome back, {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-primary text-lg">
              Here&apos;s what you missed while you were away
            </p>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Links */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-serif mb-6 text-secondary">
              Today&apos;s Links
            </h2>
            <ScrollArea className="h-96 mb-8 pr-4">
              <div className="space-y-4">
                {latestRequest?.source_urls && latestRequest.source_urls.length > 0 ? (
                  latestRequest.source_urls.map((link) => (
                    <div key={link.id}>
                    <a
                      href={link.url} // Ensure the link points to the correct URL
                      target="_blank"   // Opens the link in a new tab
                      rel="noopener noreferrer" // For security reasons
                      className="text-primary hover:text-primary-dark underline"
                    >
                      {link.url}
                    </a>
                  </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">
                    No links added yet. Start by sharing some URLs!
                  </p>
                )}
              </div>
            </ScrollArea>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-xl text-lg">
              Bring It to Life ✌️
            </Button>
          </div>

          {/* Right Column - Video & Transcript */}
          <div className="space-y-8">
            {latestRequest?.request_content?.video_url ? (
              <>
                {/* Video Player */}
                <div className="bg-white rounded-2xl p-8 shadow-lg aspect-video flex items-center justify-center relative group">
                  <video
                    className="w-full h-full rounded-xl"
                    controls
                    poster="/video-thumbnail.jpg"
                  >
                    {latestRequest.request_content.video_url && (
                      <source src={latestRequest.request_content.video_url} type="video/mp4" />
                    )}
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Transcript */}
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <h2 className="text-2xl font-serif mb-6 text-secondary">
                    The Rundown
                  </h2>
                  <ScrollArea className="h-48 pr-4">
                    <div className="space-y-4 text-lg leading-relaxed">
                      {latestRequest.request_content.video_transcript ? (
                        latestRequest.request_content.video_transcript
                          .split("\n\n")
                          .map((paragraph: string, index: number) => (
                            <p key={index} className="text-content">
                              {paragraph}
                            </p>
                          ))
                      ) : (
                        <p className="text-gray-500 text-center">
                          Transcript will be available once processing is complete.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-lg flex items-center justify-center h-96">
                <p className="text-gray-500">
                  Video content will appear here after processing your links.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}