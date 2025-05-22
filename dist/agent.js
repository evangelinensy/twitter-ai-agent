"use strict";
// Agent Logic: Fetches bookmarks, rewrites, and schedules tweets
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_server_1 = require("./mcp-server");
const sdk_1 = require("@anthropic-ai/sdk");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load Claude API key from environment
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
if (!CLAUDE_API_KEY) {
    throw new Error('Missing CLAUDE_API_KEY in .env file!');
}
// Initialize Claude client
const anthropic = new sdk_1.Anthropic({ apiKey: CLAUDE_API_KEY });
// Instructions for Claude
const rewriteInstructions = {
    conservative: 'Rewrite this tweet to be slightly more engaging, but keep the original meaning and tone.',
    moderate: 'Rewrite this tweet to be noticeably more engaging and persuasive, while keeping your voice.',
    bold: 'Rewrite this tweet to be bold, attention-grabbing, and optimized for maximum engagement. Take creative risks!'
};
// Main function to run the agent
async function runAgent() {
    // 1. Fetch bookmarks
    const bookmarks = await (0, mcp_server_1.getBookmarks)();
    if (!bookmarks.length) {
        console.log('No bookmarks found.');
        return;
    }
    // 2. For each tweet, get 3 rewrites from Claude
    const rewrittenTweets = [];
    for (const tweet of bookmarks) {
        const originalText = tweet.text;
        const rewrites = {};
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
            }
            catch (error) {
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
