// Agent Logic: Fetches bookmarks, rewrites, and schedules tweets

import { getBookmarks, postTweet } from './mcp-server';
import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load Claude API key from environment
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
if (!CLAUDE_API_KEY) {
    throw new Error('Missing CLAUDE_API_KEY in .env file!');
}

// Initialize Claude client
const anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });

// Instructions for Claude
const rewriteInstructions = {
    conservative: 'Rewrite this tweet to be slightly more engaging, but keep the original meaning and tone.',
    moderate: 'Rewrite this tweet to be noticeably more engaging and persuasive, while keeping your voice.',
    bold: 'Rewrite this tweet to be bold, attention-grabbing, and optimized for maximum engagement. Take creative risks!'
};

// Main function to run the agent
async function runAgent() {
    // 1. Fetch bookmarks
    const bookmarks = await getBookmarks();
    if (!bookmarks.length) {
        console.log('No bookmarks found.');
        return;
    }

    // 2. For each tweet, get 3 rewrites from Claude
    const rewrittenTweets: any[] = [];
    for (const tweet of bookmarks) {
        const originalText = tweet.text;
        const rewrites: Record<string, string> = {};
        console.log(`\nOriginal Tweet: ${originalText}`);

        for (const [style, instruction] of Object.entries(rewriteInstructions)) {
            // Send prompt to Claude
            const prompt = `${instruction}\n\nOriginal Tweet: ${originalText}\nRewritten Tweet:`;
            try {
                const completion = await anthropic.completions.create({
                    model: 'claude-3-opus-20240229',
                    max_tokens_to_sample: 280,
                    prompt,
                });
                rewrites[style] = completion.completion.trim();
                console.log(`\n[${style.toUpperCase()}] ${rewrites[style]}`);
            } catch (error) {
                console.error(`Error rewriting tweet (${style}):`, error);
                rewrites[style] = '';
            }
        }
        rewrittenTweets.push({ original: originalText, ...rewrites });
    }

    // 3. Save rewritten tweets to a file (optional)
    const outputPath = path.join(__dirname, '../rewritten-tweets.json');
    fs.writeFileSync(outputPath, JSON.stringify(rewrittenTweets, null, 2));
    console.log(`\nAll rewritten tweets saved to rewritten-tweets.json`);
}

// Run the agent
runAgent().catch(console.error); 