const Summary = require('../models/Summary');
const ApiError = require('../utils/ApiError');

/**
 * Service to fetch or generate book summary with database caching and quota fail-safes.
 */
class AIService {
  /**
   * Get summary for a given book instance.
   * Looks up cache first. If miss, calls external AI API and caches result.
   */
  static async getBookSummary(book) {
    // 1. Check local Summary collection cache
    const cachedSummary = await Summary.findOne({ bookId: book._id });
    if (cachedSummary) {
      return {
        bookId: book._id,
        title: book.title,
        summary: cachedSummary.summaryText,
        source: 'cache',
        generatedAt: cachedSummary.generatedAt,
      };
    }

    // 2. Cache miss: prepare call to AI API
    const baseUrl = process.env.AI_API_BASE_URL || 'https://ai-api.userfacet.com';
    const apiToken = process.env.AI_API_TOKEN;

    if (!apiToken) {
      console.error('[AIService] Missing AI_API_TOKEN environment variable');
      throw new ApiError(500, 'AI Service is misconfigured. Missing API credentials.');
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
    const prompt = `Summarize the following book in ~150 words based on its title and description: ${book.title} — ${book.description}`;

    const requestBody = {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
    };

    let summaryContent = null;
    let attempts = 0;
    const maxAttempts = 2; // Initial call + 1 retry for transient errors

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const data = await response.json();
          summaryContent =
            data.choices?.[0]?.message?.content?.trim() ||
            'Summary generation completed but no content was returned.';
          break;
        }

        // Handle specific AI API status codes
        if (response.status === 401) {
          console.error(`[AIService] 401 Unauthorized from AI API. Token may be invalid or revoked.`);
          throw new ApiError(500, 'Internal server error while calling AI service.');
        }

        if (response.status === 429) {
          console.warn(`[AIService] 429 Rate Limit / Quota Exceeded from AI API.`);
          throw new ApiError(
            503,
            'AI Summary service is currently unavailable due to quota limits. Please try again later.'
          );
        }

        // For 5xx errors or unexpected errors, attempt retry if attempts remaining
        if (attempts < maxAttempts) {
          console.warn(`[AIService] Attempt ${attempts} failed with status ${response.status}. Retrying...`);
          await new Promise((res) => setTimeout(res, 500));
          continue;
        }

        const errorText = await response.text();
        console.error(`[AIService] AI API Error (Status ${response.status}): ${errorText}`);
        throw new ApiError(502, `AI Service returned error status ${response.status}`);
      } catch (error) {
        // Rethrow handled ApiErrors directly
        if (error instanceof ApiError) {
          throw error;
        }

        if (attempts < maxAttempts) {
          console.warn(`[AIService] Network attempt ${attempts} failed: ${error.message}. Retrying...`);
          await new Promise((res) => setTimeout(res, 500));
          continue;
        }

        console.error(`[AIService] Network failure calling AI API: ${error.message}`);
        throw new ApiError(502, 'Failed to connect to external AI Summary service');
      }
    }

    // 3. Save generated summary to Summary collection cache
    const newSummary = await Summary.create({
      bookId: book._id,
      summaryText: summaryContent,
      model: 'gpt-3.5-turbo',
      source: 'generated',
      generatedAt: new Date(),
    });

    return {
      bookId: book._id,
      title: book.title,
      summary: newSummary.summaryText,
      source: 'generated',
      generatedAt: newSummary.generatedAt,
    };
  }
}

module.exports = AIService;
