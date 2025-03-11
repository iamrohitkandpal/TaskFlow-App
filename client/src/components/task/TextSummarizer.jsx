import React, { useState } from 'react';
import { useSummarizeTextMutation } from '../../redux/slices/api/aiApiSlice';
import { toast } from 'sonner';

const TextSummarizer = ({ text, maxLength = 100 }) => {
  const [summarizedText, setSummarizedText] = useState('');
  const [showFullText, setShowFullText] = useState(false);
  const [summarizeText, { isLoading }] = useSummarizeTextMutation();
  
  // Only show summarize option for long text
  if (!text || text.length < maxLength * 1.5) {
    return <p className="text-gray-700 py-2">{text}</p>;
  }
  
  const handleSummarize = async () => {
    try {
      const response = await summarizeText({ 
        text, 
        maxLength, 
        useLocal: true 
      }).unwrap();
      
      if (response.status && response.summary) {
        setSummarizedText(response.summary);
      } else {
        toast.error('Failed to generate summary');
      }
    } catch (error) {
      console.error('Summarization error:', error);
      toast.error('Error generating summary');
    }
  };
  
  return (
    <div className="relative">
      <div className="text-gray-700">
        {showFullText ? (
          <p>{text}</p>
        ) : (
          <p>{summarizedText || text.substring(0, maxLength) + '...'}</p>
        )}
      </div>
      
      <div className="mt-2 flex gap-2">
        {!summarizedText && !showFullText && (
          <button
            onClick={handleSummarize}
            disabled={isLoading}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isLoading ? 'Generating summary...' : 'Generate AI summary'}
          </button>
        )}
        
        <button
          onClick={() => setShowFullText(!showFullText)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showFullText ? 'Show less' : 'Read full description'}
        </button>
      </div>
    </div>
  );
};

export default TextSummarizer;