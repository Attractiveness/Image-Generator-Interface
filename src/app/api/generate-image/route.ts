import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  try {
    const response = await fetch('https://fal.run/fal-ai/fast-sdxl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Key a3c32c2e-39b5-4b45-8b0d-89ed6c87b6e1:a45f8997065b02ede09e10a16708ba65'
      },
      body: JSON.stringify({
        prompt,
        image_size: "square_hd",
        sync_mode: true,
        num_images: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`FAL API error: ${response.status} ${response.statusText}${
        errorData ? ` - ${JSON.stringify(errorData)}` : ''
      }`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    );
  }
} 