import fetch from 'node-fetch';
import { HfInference } from '@huggingface/inference';

const hfApiKey = process.env.HUGGINGFACE_API_KEY || '';
const inference = new HfInference(hfApiKey);

/**
 * Summarize text using Hugging Face's summarization pipeline
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum length of summary
 * @returns {Promise<string>} - Summarized text
 */
export const summarizeText = async (text, maxLength = 100) => {
  try {
    // Skip summarization for short text
    if (text.length < maxLength * 2) {
      return text;
    }
    
    // If no API key is set, use a simple length-based summary
    if (!hfApiKey) {
      console.warn('No Hugging Face API key provided. Using fallback summarization.');
      return `${text.substring(0, maxLength)}...`;
    }
    
    // Use the Hugging Face client library
    const result = await inference.summarization({
      model: 'facebook/bart-large-cnn',
      inputs: text,
      parameters: {
        max_length: maxLength,
        min_length: Math.min(30, maxLength / 2)
      }
    });
    
    return result.summary_text;
  } catch (error) {
    console.error('Error in summarizeText:', error);
    // Fallback to a simple truncation
    return `${text.substring(0, maxLength)}...`;
  }
};

/**
 * Local fallback summarization function that doesn't require external API
 * Uses a simple extractive approach that selects important sentences
 */
export const localSummarize = (text, sentenceCount = 3) => {
  try {
    if (!text || typeof text !== 'string') return '';
    
    // Split text into sentences
    const sentences = text
      .replace(/([.?!])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .filter(s => s.trim().length > 0);
    
    // If we have fewer sentences than requested, return the whole text
    if (sentences.length <= sentenceCount) return text;
    
    // Simple importance scoring (longer sentences with keywords tend to be more important)
    const importantWords = ['task', 'priority', 'urgent', 'important', 'deadline', 'required'];
    
    const scoredSentences = sentences.map(sentence => {
      let score = sentence.length / 20; // Base score on length
      
      // Boost sentences with important words
      importantWords.forEach(word => {
        if (sentence.toLowerCase().includes(word)) {
          score += 2;
        }
      });
      
      // Boost sentences at the beginning and end
      const index = sentences.indexOf(sentence);
      if (index === 0) score += 3;
      if (index === sentences.length - 1) score += 2;
      
      return { sentence, score };
    });
    
    // Sort by score and take top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, sentenceCount)
      .sort((a, b) => sentences.indexOf(a.sentence) - sentences.indexOf(b.sentence))
      .map(item => item.sentence);
    
    return topSentences.join(' ');
  } catch (error) {
    console.error('Error in localSummarize:', error);
    return text.substring(0, 200) + '...';
  }
};