import { NextResponse } from 'next/server'

const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

export async function POST(request: Request) {
  try {
    const { summary } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: 'Missing summary' },
        { status: 400 }
      );
    }

    if (!HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    console.log('Calling HeyGen API to generate video...');
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: 'Daisy-inskirt-20220818',
              avatar_style: 'normal'
            },
            voice: {
              type: 'text',
              input_text: summary,
              voice_id: '2d5b0e6cf36f460aa7fc47e3eee4ba54'
            },
            background: {
              type: 'color',
              value: '#ffffff'
            }
          }
        ],
        dimension: {
          width: 1280,
          height: 720
        }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen API error:', error);
      return NextResponse.json(
        { error: `HeyGen API error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.data?.video_id) {
      console.error('No video ID in HeyGen response:', data);
      return NextResponse.json(
        { error: 'No video ID in HeyGen response' },
        { status: 500 }
      );
    }

    console.log('HeyGen API response:', data);
    
    return NextResponse.json({
      video_id: data.data.video_id,
    });
  } catch (error) {
    console.error('Error generating video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  }
}
