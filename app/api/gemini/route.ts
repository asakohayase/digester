import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fetchUrlContent(url: string) {
  try {
    console.log('Fetching content from URL:', url);
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Error fetching URL ${url}:`, error);
    return '';
  }
}

export async function POST(request: Request) {
  try {
    console.log('Received request at /api/gemini');
    const body = await request.json();
    console.log('Request body:', body);

    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      console.error('Invalid URLs array:', urls);
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      )
    }

    // Fetch URLs data from source_urls
    const { data: urlsData, error: urlsError } = await supabase
      .from('source_urls')
      .select('url')
      .in('id', urls)

    if (urlsError || !urlsData || urlsData.length === 0) {
      console.error('Error or no URLs found:', urlsError);
      return NextResponse.json(
        { error: 'Error fetching URLs or no URLs found' },
        { status: 500 }
      )
    }

    // Fetch content from all URLs
    const contents = await Promise.all(urlsData.map(item => fetchUrlContent(item.url)))
    const combinedContent = contents.join('\n\n')

    // Generate summary using Gemini Flash
    const prompt = `Please analyze these articles and provide a concise, informative summary focusing on the key points and main takeaways:

${combinedContent}

Format the summary in clear paragraphs with proper spacing.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ 
      status: 'success',
      summary 
    })
  } catch (error) {
    console.error('Error in Gemini route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}