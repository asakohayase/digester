/* eslint-disable */

"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useStytchUser } from '@stytch/nextjs'
import type { Database } from '@/types/supabase'
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from '@/lib/supabase-client'

const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;
const HEYGEN_API_URL = "https://api.heygen.com/v2/video/generate";

export default function VideoSection() {
  const { user } = useStytchUser()
  const { toast } = useToast()
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);

  const downloadAndStoreVideo = async (url: string) => {
    try {
      console.log('Downloading video from HeyGen:', url);
      
      // Download the video
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to download video from HeyGen');
      
      const blob = await response.blob();
      console.log('Video downloaded, size:', blob.size);
      
      // Create a unique filename with user ID to avoid conflicts
      const filename = `${user?.user_id}/video_${Date.now()}.mp4`;
      
      console.log('Uploading to Supabase storage:', filename);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(filename, blob, {
          contentType: 'video/mp4',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = await supabase
        .storage
        .from('videos')
        .getPublicUrl(filename);

      console.log('Generated public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error storing video:', error);
      throw error;
    }
  };

  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 2000; // 2 seconds

  const checkVideoStatus = async (id: string, retryCount = 0) => {
    if (!id) {
      console.error('No video ID provided to checkVideoStatus');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/heygen/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: id }),
      });

      // Handle 502 and other 5xx errors with retry
      if (response.status >= 500) {
        if (retryCount < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
          console.log(`API error (${response.status}), retrying in ${delay}ms...`);
          toast({ 
            title: "Temporary Error", 
            description: "Retrying status check...",
            duration: 2000
          });
          setTimeout(() => checkVideoStatus(id, retryCount + 1), delay);
          return;
        }
      }

      // First try to get error message if response not ok
      if (!response.ok) {
        let errorMessage = 'Failed to check video status';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If can't parse JSON, use text
          errorMessage = await response.text();
        }
        throw new Error(errorMessage);
      }

      // Now try to parse successful response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Invalid response from video status API');
      }

      console.log('Status check response:', data);
      const { status, url, error: videoError } = data;
      
      if (status === 'completed' && url) {
        // Store the video URL in Supabase
        const { error: updateError } = await supabase
          .from('request_content')
          .update({ 
            video_url: url,
            video_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('video_id', id);

        if (updateError) {
          console.error('Error updating video status:', updateError);
          throw updateError;
        }
        
        setVideoUrl(url);
        setVideoStatus('completed');
        setLoading(false);
        toast({ title: "Success", description: "Video generation completed!" });
      } else if (status === 'failed' || videoError) {
        setVideoStatus('failed');
        setLoading(false);
        throw new Error(`Video generation failed: ${videoError || 'Unknown error'}`);
      } else {
        // Map status to user-friendly message
        let statusMessage = 'Processing';
        if (status === 'waiting') {
          statusMessage = 'Queued - Waiting to start';
        } else if (status === 'processing') {
          statusMessage = 'Generating your video';
        }

        // Still processing, check again in 5 seconds
        setVideoStatus(status);
        toast({ 
          title: "Processing", 
          description: `${statusMessage}. This may take a few minutes...`,
          duration: 3000 
        });
        setTimeout(() => checkVideoStatus(id), 5000);
      }
    } catch (error) {
      console.error('Error checking video status:', error);
      
      // For network errors, retry
      if (error instanceof TypeError && retryCount < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Network error, retrying in ${delay}ms...`);
        toast({ 
          title: "Network Error", 
          description: "Retrying status check...",
          duration: 2000
        });
        setTimeout(() => checkVideoStatus(id, retryCount + 1), delay);
        return;
      }

      setVideoStatus('failed');
      setLoading(false);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to check video status" 
      });
    }
  };

  const generateVideo = async () => {
    if (!user?.user_id) {
      toast({ title: "Error", description: "Please sign in to generate videos" });
      return;
    }

    try {
      setLoading(true);

      // Get the latest summary for this user
      const { data: summaryData, error: summaryError } = await supabase
        .from('request_content')
        .select('video_summary')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (summaryError) {
        console.error('Summary fetch error:', summaryError);
        toast({ title: "Error", description: "Failed to fetch summary" });
        return;
      }

      if (!summaryData || summaryData.length === 0 || !summaryData[0].video_summary) {
        toast({ title: "Error", description: "No summary found. Please process some URLs first." });
        return;
      }

      const summary = summaryData[0].video_summary;

      // Call HeyGen endpoint
      const response = await fetch('/api/heygen/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summary }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const data = await response.json();
      if (!data.video_id) {
        throw new Error('No video ID received from API');
      }

      // Store video ID in database first
      const { error: updateError } = await supabase
        .from('request_content')
        .update({ 
          video_id: data.video_id,
          video_status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (updateError) {
        console.error('Error storing video ID:', updateError);
        throw new Error('Failed to store video information');
      }

      setVideoId(data.video_id);
      toast({ title: "Processing", description: "Video generation started..." });
      
      // Start checking status
      await checkVideoStatus(data.video_id);
    } catch (error) {
      console.error('Error generating video:', error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Please try again" 
      });
      setLoading(false);
    }
  };

  // Start checking status when videoId changes
  useEffect(() => {
    if (videoId) {
      checkVideoStatus(videoId);
    }
  }, [videoId]);

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
          setVideoUrl(data[0].video_url || "");
          setVideoId(data[0].video_id);
          setVideoStatus(data[0].video_status);
        }
      } catch (err) {
        console.error('Error fetching video content:', err);
        toast({
          title: "Error fetching video",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive"
        });
      }
    };

    fetchLatestContent();
  }, [user]);

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <div className="h-full flex flex-col">
        <div className="flex flex-col items-center justify-center w-full h-full">
          {videoUrl ? (
            <video 
              className="w-full max-w-2xl rounded-lg shadow-lg" 
              controls
              key={videoUrl} // Force re-render when URL changes
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500">
                {videoStatus === 'processing' ? 'Video is being generated...' : 
                 videoStatus === 'failed' ? 'Video generation failed' :
                 'No video generated yet'}
              </p>
            </div>
          )}
        </div>
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-xl text-lg"
          onClick={generateVideo} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Video...
            </>
          ) : (
            "Generate AI Video ✨"
          )}
        </Button>
      </div>
    </div>
  );
}
