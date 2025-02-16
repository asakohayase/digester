import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    // Fetch the request and associated URLs
    const { data: requestData, error: requestError } = await supabase
      .from('requests')
      .select(`
        *,
        source_urls (*)
      `)
      .eq('id', requestId)
      .single()

    if (requestError) {
      console.error('Error fetching request:', requestError)
      return NextResponse.json(
        { error: 'Error fetching request' },
        { status: 500 }
      )
    }

    if (!requestData) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('requests')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
      return NextResponse.json(
        { error: 'Error updating request status' },
        { status: 500 }
      )
    }

    // Trigger webhooks/processing
    const urls = requestData.source_urls.map(url => url.url)
    
    // Send URLs to WhatsApp service
    const whatsappResponse = await fetch(process.env.WHATSAPP_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls,
        requestId,
        userId: requestData.user_id
      }),
    })

    if (!whatsappResponse.ok) {
      throw new Error('Failed to send URLs to WhatsApp service')
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Request processing initiated'
    })

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}