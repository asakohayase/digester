/* eslint-disable */

"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useStytchUser } from '@stytch/nextjs'
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import VideoSection from "./VideoSection"
import { supabase } from '@/lib/supabase-client'
import { Database } from "@/types/supabase"

// Define types based on your schema
type Profile = Database['public']['Tables']['profiles']['Row']


export default function Home() {
  const { user } = useStytchUser()
  const { toast } = useToast()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [urls, setUrls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)

  useEffect(() => {
    const fetchUrls = async () => {
      if (!user?.user_id) return

      try {
        const { data: urlsData, error: urlsError } = await supabase
          .from('source_urls')
          .select('*')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })

        if (urlsError) throw urlsError
        setUrls(urlsData || [])
      } catch (err) {
        console.error('Error fetching URLs:', err)
        setError('Failed to load URLs')
      }
    }

    fetchUrls()
  }, [user])

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

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load your content. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have a user
    if (user?.user_id) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    const fetchLatestContent = async () => {
      if (!user?.user_id) return;

      try {
        const { data, error } = await supabase
          .from('request_content')
          .select('*')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0) {
          setSummary(data[0].video_summary || null);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        toast({
          title: "Error fetching summary",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive"
        });
      }
    };

    fetchLatestContent();
  }, [user]);

  const handleProcessRequest = async () => {
    if (!user?.user_id) {
      toast({
        title: "Error",
        description: "Please sign in to process requests",
        variant: "destructive",
      })
      return;
    }

    try {
      setProcessing(true)
      
      if (!urls || urls.length === 0) {
        toast({
          title: "No URLs to process",
          description: "Please add some URLs first.",
          variant: "destructive"
        })
        return
      }
  
      // Call Gemini endpoint first
      const geminiResponse = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: urls.map(url => url.id),
          userId: user.user_id
        }),
      })

      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error('Gemini API error:', errorData);
        throw new Error(errorData.error || 'Failed to process with Gemini');
      }

      const geminiData = await geminiResponse.json();
      if (!geminiData.summary) {
        console.error('No summary in response:', geminiData);
        throw new Error('No summary generated');
      }

      const { summary: newSummary } = geminiData
      setSummary(newSummary)
  
      // Then call your process endpoint
      const response = await fetch('/api/process-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: urls.map(url => url.id),
          summary: newSummary
        }),
      })
  
      if (!response.ok) {
        throw new Error('Failed to process request')
      }
  
      toast({
        title: "Processing started",
        description: "Your URLs are being processed. Check back soon!"
      })
  
      // Refresh URLs to show updated status
      if (user?.user_id) {
        const { data: updatedUrls, error: urlsError } = await supabase
          .from('source_urls')
          .select('*')
          .eq('user_id', user.user_id)
          .order('created_at', { ascending: false })
  
        if (urlsError) throw urlsError
        setUrls(updatedUrls || [])
      }
  
    } catch (err) {
      console.error('Error processing request:', err)
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }


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
                {urls && urls.length > 0 ? (
                  urls.map((link) => (
                    <div key={link.id}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
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
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-xl text-lg"
              onClick={handleProcessRequest}
              disabled={processing || !urls?.length}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Bring It to Life ✌️"
              )}
            </Button>
          </div>

          {/* Right Column - Video & Transcript */}
          <div className="space-y-8">
            {/* Video Player */}
            <VideoSection />

            {/* Transcript */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-serif mb-6 text-secondary">
                The Rundown
              </h2>
              <ScrollArea className="h-48 pr-4">
                <div className="space-y-4 text-lg leading-relaxed">
                {summary ? (
                    <p>{summary}</p>
                  ) : (
                    <p className="text-gray-500 text-center">
                      Summary will be available once processing is complete.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}