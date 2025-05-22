"use strict";
// MCP Server: Handles Twitter API and MCP integration
// This file connects to Twitter, fetches bookmarks, and posts tweets.
// It uses your API keys from the .env file.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBookmarks = getBookmarks;
exports.postTweet = postTweet;
// If you see a 'Cannot find module \"dotenv\"' error, run: npm install dotenv
const twitter_api_v2_1 = require("twitter-api-v2");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Loads .env file
// Get API keys from environment variables
const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, } = process.env;
if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    throw new Error('Missing Twitter API keys in .env file!');
}
// Create a Twitter client
const twitterClient = new twitter_api_v2_1.TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
});
// v2 client for modern endpoints
const v2 = twitterClient.v2;
/**
 * Fetches all bookmarked tweets for the authenticated user.
 * Returns an array of tweet objects.
 * Note: Twitter API may limit the number of bookmarks returned.
 */
async function getBookmarks() {
    try {
        // Twitter API: GET /2/users/:id/bookmarks
        // First, get the user ID of the authenticated user
        const user = await v2.me();
        const userId = user.data.id;
        // Fetch bookmarks (no options object)
        const response = await v2.bookmarks(userId);
        return response.data ?? [];
    }
    catch (error) {
        console.error('Error fetching bookmarks:', error);
        return [];
    }
}
/**
 * Posts a tweet on behalf of the authenticated user.
 * @param text The text of the tweet to post
 * @returns The posted tweet object
 */
async function postTweet(text) {
    try {
        const response = await v2.tweet({ text });
        console.log('Tweet posted:', response.data.id);
        return response.data;
    }
    catch (error) {
        console.error('Error posting tweet:', error);
        throw error;
    }
}
// You can add more functions here, like scheduleTweet, if needed. 
