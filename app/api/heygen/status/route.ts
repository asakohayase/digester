import { NextResponse } from 'next/server';

const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;

export async function GET(request: Request) {
  if (!HEYGEN_API_KEY) {
    console.error('HEYGEN_API_KEY is not set');
    return NextResponse.json(
      { error: 'HeyGen API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    console.log('Checking video status for:', videoId);
    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log('Raw status response:', responseText);

    if (!response.ok) {
      console.error('HeyGen API error:', responseText);
      return NextResponse.json(
        { error: `HeyGen API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    console.log('HeyGen API response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error checking video status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check video status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { video_id } = await request.json();

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing video_id' },
        { status: 400 }
      );
    }

    const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY;
    if (!HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.heygen.com/v1/video_status.get?video_id=${video_id}`;
    console.log('Making HeyGen API request:', {
      url,
      method: 'GET',
      headers: {
        'X-Api-Key': 'REDACTED',
      }
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });
    const duration = Date.now() - startTime;

    console.log('HeyGen API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      duration: `${duration}ms`,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen API error details:', {
        status: response.status,
        error,
        headers: Object.fromEntries(response.headers.entries()),
        duration: `${duration}ms`,
      });
      return NextResponse.json(
        { error: `HeyGen API error: ${error}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.error('Unexpected content type:', {
        contentType,
        status: response.status,
        body: await response.text(),
      });
      return NextResponse.json(
        { error: 'Invalid response from HeyGen API' },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log('HeyGen API response body:', {
      data,
      duration: `${duration}ms`,
    });

    // HeyGen returns data in data.data
    if (!data.data) {
      console.error('No data in response:', data);
      return NextResponse.json(
        { error: 'Invalid response from HeyGen' },
        { status: 500 }
      );
    }

    const videoData = data.data;
    if (!videoData.status) {
      console.error('No status in video data:', videoData);
      return NextResponse.json(
        { error: 'Invalid status response from HeyGen' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: videoData.status,
      url: videoData.video_url,
      error: videoData.error,
      details: videoData,
      requestDuration: duration,
    });
  } catch (error) {
    console.error('Error checking video status:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to check video status' },
      { status: 500 }
    );
  }
}
