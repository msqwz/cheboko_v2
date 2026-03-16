import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Map, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import Markdown from 'react-markdown';

interface LocationInfoProps {
  locationName: string;
}

export const LocationInfo: React.FC<LocationInfoProps> = ({ locationName }) => {
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [links, setLinks] = useState<{ uri: string; title: string }[]>([]);

  const fetchLocationInfo = async () => {
    setIsLoading(true);
    setInfo(null);
    setLinks([]);

    try {
      // @ts-ignore
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find information about this location: ${locationName}. Provide a brief summary of what this place is, its address, and its rating if available.`,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      setInfo(response.text || 'Информация не найдена.');

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedLinks: { uri: string; title: string }[] = [];
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri && chunk.web?.title) {
            extractedLinks.push({ uri: chunk.web.uri, title: chunk.web.title });
          }
          if (chunk.maps?.uri && chunk.maps?.title) {
            extractedLinks.push({ uri: chunk.maps.uri, title: chunk.maps.title });
          }
        });
        setLinks(extractedLinks);
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
      setInfo('Произошла ошибка при получении информации о локации.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t pt-4">
      {!info && !isLoading && (
        <Button variant="outline" size="sm" onClick={fetchLocationInfo} className="w-full">
          <Map className="w-4 h-4 mr-2" />
          Информация о локации (Google Maps)
        </Button>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Поиск информации...
        </div>
      )}

      {info && (
        <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-900">
          <div className="markdown-body prose prose-sm prose-blue max-w-none mb-3">
            <Markdown>{info}</Markdown>
          </div>
          
          {links.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="font-medium mb-2 text-xs uppercase tracking-wider text-blue-800">Источники:</p>
              <ul className="space-y-1">
                {links.map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                      <Map className="w-3 h-3 mr-1" />
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
