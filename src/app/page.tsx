'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface EnhancementOption {
  label: string;
  getPrompt: (originalPrompt: string) => string;
}

// Prompt enhancement patterns
const enhancePrompt = (basePrompt: string) => {
  const patterns = {
    composition: [
      'with professional composition',
      'perfectly framed',
      'dynamic perspective',
      'rule of thirds',
      'golden ratio composition'
    ],
    lighting: [
      'dramatic lighting',
      'cinematic lighting',
      'natural lighting',
      'volumetric lighting',
      'ambient lighting'
    ],
    quality: [
      'highly detailed',
      '8K resolution',
      'photorealistic',
      'masterpiece',
      'professional photography'
    ],
    style: [
      'trending on artstation',
      'award winning',
      'hyperrealistic',
      'ultra realistic',
      'professional quality'
    ]
  };

  // Helper function to get random items from an array
  const getRandomItems = (arr: string[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Analyze the base prompt for context
  const lowercasePrompt = basePrompt.toLowerCase();
  let enhancedPrompt = basePrompt;

  // Add composition if it's likely an image that needs it
  if (
    lowercasePrompt.includes('landscape') ||
    lowercasePrompt.includes('portrait') ||
    lowercasePrompt.includes('scene') ||
    lowercasePrompt.includes('view')
  ) {
    enhancedPrompt += `, ${getRandomItems(patterns.composition, 2).join(', ')}`;
  }

  // Add lighting if it might benefit from it
  if (
    !lowercasePrompt.includes('lighting') &&
    !lowercasePrompt.includes('dark') &&
    !lowercasePrompt.includes('bright')
  ) {
    enhancedPrompt += `, ${getRandomItems(patterns.lighting, 1)}`;
  }

  // Always add some quality improvements
  enhancedPrompt += `, ${getRandomItems(patterns.quality, 2).join(', ')}`;

  // Add style elements if it's an artistic prompt
  if (
    lowercasePrompt.includes('art') ||
    lowercasePrompt.includes('style') ||
    lowercasePrompt.includes('design')
  ) {
    enhancedPrompt += `, ${getRandomItems(patterns.style, 2).join(', ')}`;
  }

  return enhancedPrompt;
};

export default function Home() {
  const [isHovering, setIsHovering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [flowDirection, setFlowDirection] = useState({ x: 0, y: 0 });
  const [prompt, setPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);

  // Static enhancement options
  const staticEnhancements: EnhancementOption[] = [
    {
      label: "Add more details",
      getPrompt: (prompt) => `${prompt}, highly detailed, intricate details, 8k resolution, professional photography`,
    },
    {
      label: "Make it more realistic",
      getPrompt: (prompt) => `${prompt}, photorealistic, hyperrealistic, professional photography, natural lighting`,
    },
    {
      label: "Make it artistic",
      getPrompt: (prompt) => `${prompt}, artistic style, vibrant colors, creative composition, dramatic lighting`,
    },
    {
      label: "Cinematic look",
      getPrompt: (prompt) => `${prompt}, cinematic, dramatic lighting, movie scene, wide angle, depth of field`,
    }
  ];

  // Dynamic enhancement options based on the original prompt
  const getDynamicEnhancements = (prompt: string): EnhancementOption[] => {
    const lowercasePrompt = prompt.toLowerCase();
    const enhancements: EnhancementOption[] = [];

    // Add time of day variations if it's a landscape or scene
    if (lowercasePrompt.includes('landscape') || lowercasePrompt.includes('scene') || 
        lowercasePrompt.includes('view') || lowercasePrompt.includes('nature')) {
      enhancements.push({
        label: "Sunset version",
        getPrompt: (p) => `${p}, during golden hour sunset, warm colors, dramatic sky`,
      });
    }

    // Add weather variations for outdoor scenes
    if (!lowercasePrompt.includes('indoor')) {
      enhancements.push({
        label: "Misty atmosphere",
        getPrompt: (p) => `${p}, with morning mist, atmospheric fog, ethereal lighting`,
      });
    }

    // Add seasonal variations
    if (lowercasePrompt.includes('nature') || lowercasePrompt.includes('outdoor') || 
        lowercasePrompt.includes('landscape')) {
      enhancements.push({
        label: "Autumn colors",
        getPrompt: (p) => `${p}, in autumn, fall colors, golden leaves, warm tones`,
      });
    }

    return enhancements;
  };

  const handleGenerate = async (e: React.FormEvent, enhancedPrompt?: string) => {
    e.preventDefault();
    const finalPrompt = enhancedPrompt || prompt.trim();
    if (!finalPrompt) return;

    if (!enhancedPrompt) {
      setOriginalPrompt(finalPrompt); // Save the original prompt only on first generation
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Failed to generate image: ${response.status} ${response.statusText}`);
      }

      if (result?.images?.[0]?.url) {
        setImageUrl(result.images[0].url);
      } else {
        throw new Error('No image URL in response');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get dynamic enhancements based on the current original prompt
  const dynamicEnhancements = originalPrompt ? getDynamicEnhancements(originalPrompt) : [];

  // Handle mouse movement for effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isPaused && !isReversed) {
        const newX = e.clientX;
        const newY = e.clientY;
        
        setFlowDirection({
          x: newX - mousePosition.x,
          y: newY - mousePosition.y
        });
        
        setMousePosition({ x: newX, y: newY });
      }
    };

    if (!isReversed) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isReversed, isPaused, mousePosition]);

  const toggleGridMode = () => {
    setIsReversed(!isReversed);
    if (isReversed) {
      // Re-enabling effects
      setIsPaused(false);
      // Reset mouse position to prevent jumping
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      setMousePosition({ x: centerX, y: centerY });
      setFlowDirection({ x: 0, y: 0 });
    } else {
      // Disabling effects
      setIsHovering(false);
      setIsPaused(false);
    }
  };

  const enhancePromptLocally = () => {
    if (!prompt.trim()) return;
    
    setIsEnhancingPrompt(true);
    try {
      const enhancedPrompt = enhancePrompt(prompt.trim());
      setPrompt(enhancedPrompt);
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      setError('Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Recommendation options
  const recommendations = [
    {
      label: "Artistic Style",
      getPrompt: (basePrompt: string) => `${basePrompt}, artistic style, vibrant colors, creative composition`,
    },
    {
      label: "Photorealistic",
      getPrompt: (basePrompt: string) => `${basePrompt}, photorealistic, highly detailed, 8K resolution`,
    },
    {
      label: "Fantasy",
      getPrompt: (basePrompt: string) => `${basePrompt}, fantasy art style, magical atmosphere, ethereal lighting`,
    },
    {
      label: "Cinematic",
      getPrompt: (basePrompt: string) => `${basePrompt}, cinematic composition, dramatic lighting, movie scene quality`,
    },
    {
      label: "Minimalist",
      getPrompt: (basePrompt: string) => `${basePrompt}, minimalist style, clean lines, simple composition`,
    }
  ];

  return (
    <main 
      className="min-h-screen bg-[#1a1a2e] relative overflow-hidden"
      onMouseEnter={() => !isReversed && setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsPaused(false);
      }}
    >
      {/* SVG Filters */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="liquid">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="liquid"
            />
            <feBlend in="SourceGraphic" in2="liquid" />
          </filter>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Reverse button */}
      <button
        className="reverse-button"
        onClick={toggleGridMode}
        onFocus={() => !isReversed && setIsPaused(true)}
        onBlur={() => !isReversed && setIsPaused(false)}
      >
        {isReversed ? 'Enable Mouse Effects' : 'Static Grid'}
      </button>

      {/* Base grid background */}
      <div className={`absolute inset-0 liquid-grid opacity-70 ${isReversed ? 'reversed' : ''}`} />
      
      {/* Laminar flow effect - only show when not reversed */}
      {!isReversed && (
        <div 
          className={`flow-container ${isHovering ? 'is-hovering' : ''} ${isPaused ? 'is-paused' : ''}`}
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
            '--flow-intensity': Math.min(Math.abs(flowDirection.y) / 10, 2),
          } as React.CSSProperties}
        >
          <div className="flow-trail" />
          <div 
            className="flow-layer flow-layer-1"
            style={{
              transform: `rotate(${Math.atan2(flowDirection.y, flowDirection.x) * (180 / Math.PI)}deg)`,
            }}
          />
          <div 
            className="flow-layer flow-layer-2"
            style={{
              transform: `rotate(${Math.atan2(flowDirection.y, flowDirection.x) * (180 / Math.PI)}deg)`,
            }}
          />
          <div 
            className="flow-layer flow-layer-3"
            style={{
              transform: `rotate(${Math.atan2(flowDirection.y, flowDirection.x) * (180 / Math.PI)}deg)`,
            }}
          />
        </div>
      )}

      {/* Glow effect - only show when not reversed */}
      {!isReversed && (
        <div 
          className={`mouse-follower ${isHovering ? 'is-hovering' : ''} ${isPaused ? 'is-paused' : ''}`}
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        />
      )}
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">AI Image Generator</h1>
            <p className="text-blue-200">Transform your ideas into stunning visuals</p>
          </div>

          {/* Input Section with new star button */}
          <div className="mb-12">
            <form className="flex flex-col gap-4" onSubmit={handleGenerate}>
              <div className="relative">
                <textarea 
                  className="w-full px-4 py-3 bg-gray-800/80 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-24 backdrop-blur-sm pr-24"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                />
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={enhancePromptLocally}
                    disabled={isEnhancingPrompt || !prompt.trim()}
                    className="bg-gray-700/80 text-yellow-400 p-2 rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group relative"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  >
                    {isEnhancingPrompt ? (
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    )}
                    <span className="sr-only">Enhance prompt</span>
                    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Enhance prompt
                    </span>
                  </button>
                  <button 
                    type="submit"
                    disabled={isGenerating || !prompt.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </form>
          </div>

          {/* Main Generation Box */}
          <div className="mb-12">
            <div className="neon-box w-full aspect-[3/2] relative">
              <div className="absolute inset-0 p-4">
                {isGenerating ? (
                  <div className="loading-container">
                    <div className="loading-blur">
                      <div className="loading-ripple" />
                      <div className="loading-ripple" />
                      <div className="loading-ripple" />
                      <div className="loading-spinner" />
                    </div>
                  </div>
                ) : (
                  imageUrl && (
                    <Image
                      src={imageUrl}
                      alt="Generated image"
                      fill
                      className="object-contain rounded-lg"
                      priority
                    />
                  )
                )}
                {!isGenerating && !imageUrl && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-blue-200/60 text-lg">Your generated image will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div className="mb-8">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={imageUrl || "https://placehold.co/1000x1000/ffffff/1a1a2e?text=Preview"}
                  alt="Preview image"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="space-y-6">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-white text-lg font-semibold mb-3">Quick Style Recommendations</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.map((rec, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (prompt.trim()) {
                        setPrompt(rec.getPrompt(prompt.trim()));
                      }
                    }}
                    disabled={!prompt.trim() || isGenerating}
                    className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full hover:bg-blue-600/40 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                  >
                    {rec.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhancement Options */}
          {imageUrl && (
            <div className="space-y-6 mt-6">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg p-4">
                <div className="mt-4">
                  <h3 className="text-white text-lg font-semibold mb-3">Enhance your image</h3>
                  <div className="flex flex-wrap gap-2">
                    {/* Static enhancement options */}
                    {staticEnhancements.map((enhancement, index) => (
                      <button 
                        key={`static-${index}`}
                        className="px-3 py-1 bg-gray-700/80 text-gray-300 rounded-full hover:bg-gray-600 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleGenerate(e, enhancement.getPrompt(originalPrompt))}
                        disabled={isGenerating}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                      >
                        {enhancement.label}
                      </button>
                    ))}

                    {/* Dynamic enhancement options */}
                    {dynamicEnhancements.map((enhancement, index) => (
                      <button 
                        key={`dynamic-${index}`}
                        className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full hover:bg-blue-600/40 transition-colors backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleGenerate(e, enhancement.getPrompt(originalPrompt))}
                        disabled={isGenerating}
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                      >
                        {enhancement.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isEnhancingPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
            <p className="text-white">Enhancing your prompt...</p>
          </div>
        </div>
      )}
    </main>
  );
}
