/* eslint-disable */

"use client"

import { useState } from "react"
import { LinkIcon, Zap, Play } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Home() {
  const [links, setLinks] = useState([
    "https://example.com/link1",
    "https://example.com/link2",
    "https://example.com/link3",
  ])
  const [transcript, setTranscript] = useState(
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
  )

  return (
    <main className="min-h-screen bg-background text-content">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="container max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary rounded-full p-2">
                <Zap className="w-5 h-5 text-background" />
              </div>
              <span className="font-serif text-xl">Briefing</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-primary hover:text-opacity-80 font-medium">
                Archives
              </button>
              <Button className="bg-secondary hover:bg-secondary/90 text-white">
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
            <h1 className="text-3xl font-serif mb-2">Welcome back, Lewis</h1>
            <p className="text-primary text-lg">Here&apos;s what you missed while you were away</p>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Links */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-serif mb-6 text-secondary">Today&apos;s Links</h2>
            <ScrollArea className="h-[400px] mb-8 pr-4">
              <div className="space-y-4">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-4 bg-background rounded-xl hover:bg-background/80 transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-highlight flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1 text-base">{link}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-xl text-lg">
            Bring It to Life ✌️
            </Button>
          </div>

          {/* Right Column - Video & Transcript */}
          <div className="space-y-8">
            {/* Video Player */}
            <div className="bg-white rounded-2xl p-8 shadow-lg aspect-video flex items-center justify-center relative group">
              <div className="absolute inset-0 bg-background/50 rounded-2xl"></div>
              <button className="relative z-10 w-16 h-16 bg-blue hover:bg-blue/90 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <Play className="w-8 h-8 text-white" fill="white" />
              </button>
            </div>

            {/* Transcript */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h2 className="text-2xl font-serif mb-6 text-secondary">The Rundown</h2>
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4 text-lg leading-relaxed">
                  {transcript.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-content">{paragraph}</p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}