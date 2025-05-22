// MCP Server: Handles Twitter API and MCP integration
// Uses OAuth 2.0 with automatic token refresh when tokens expire

import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const {
    TWITTER_ACCESS_TOKEN,
    TWITTER_REFRESH_TOKEN,
    TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET,
    CLAUDE_API_KEY
} = process.env;

if (!TWITTER_ACCESS_TOKEN || !TWITTER_REFRESH_TOKEN || !TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    throw new Error('Missing OAuth 2.0 credentials in .env file!');
}

let currentAccessToken = TWITTER_ACCESS_TOKEN;
let currentRefreshToken = TWITTER_REFRESH_TOKEN;

// Create Twitter client
let twitterClient = new TwitterApi(currentAccessToken);
let v2 = twitterClient.v2;

/**
 * Automatically refresh tokens when they expire
 */
async function refreshTokensIfNeeded() {
    try {
        console.log('🔄 Refreshing tokens...');

        const refreshClient = new TwitterApi({
            clientId: TWITTER_CLIENT_ID!,
            clientSecret: TWITTER_CLIENT_SECRET!,
        });

        const { accessToken, refreshToken } = await refreshClient.refreshOAuth2Token(currentRefreshToken);

        // Update current tokens
        currentAccessToken = accessToken;
        currentRefreshToken = refreshToken;

        // Create new client with fresh tokens
        twitterClient = new TwitterApi(currentAccessToken);
        v2 = twitterClient.v2;

        console.log('✅ Tokens refreshed automatically!');
        console.log('📝 New tokens (update your .env file):');
        console.log(`TWITTER_ACCESS_TOKEN=${accessToken}`);
        console.log(`TWITTER_REFRESH_TOKEN=${refreshToken}`);

        return true;
    } catch (error) {
        console.error('❌ Failed to refresh tokens:', error);
        return false;
    }
}

/**
 * Fetches bookmarks with auto token refresh
 */
export async function getBookmarks() {
    try {
        console.log('📚 Fetching bookmarks...');

        const user = await v2.me();
        console.log(`✅ Authenticated as: ${user.data.username}`);

        const bookmarks = await v2.bookmarks({
            expansions: ['author_id'],
            'tweet.fields': ['created_at', 'text', 'public_metrics', 'author_id'],
            'user.fields': ['username', 'name']
        });

        console.log(`📊 Found ${bookmarks.data?.length || 0} bookmarks`);
        return bookmarks.data ?? [];

    } catch (error: any) {
        // Auto-refresh on 401 error
        if (error.code === 401) {
            console.log('🔄 Token expired, auto-refreshing...');

            const refreshed = await refreshTokensIfNeeded();
            if (refreshed) {
                // Retry with new tokens
                try {
                    const user = await v2.me();
                    console.log(`✅ Authenticated as: ${user.data.username}`);

                    const bookmarks = await v2.bookmarks({
                        expansions: ['author_id'],
                        'tweet.fields': ['created_at', 'text', 'public_metrics', 'author_id'],
                        'user.fields': ['username', 'name']
                    });

                    console.log(`📊 Found ${bookmarks.data?.length || 0} bookmarks`);
                    return bookmarks.data ?? [];
                } catch (retryError) {
                    console.error('❌ Error after token refresh:', retryError);
                    return [];
                }
            }
        }

        console.error('❌ Error fetching bookmarks:', error);
        return [];
    }
}

/**
 * Posts tweet with auto token refresh
 */
export async function postTweet(text: string) {
    try {
        console.log('📝 Posting tweet:', text.substring(0, 50) + '...');

        const response = await v2.tweet({ text });
        console.log('✅ Tweet posted! ID:', response.data.id);
        return response.data;

    } catch (error: any) {
        // Auto-refresh on 401 error
        if (error.code === 401) {
            console.log('🔄 Token expired, auto-refreshing...');

            const refreshed = await refreshTokensIfNeeded();
            if (refreshed) {
                // Retry posting
                try {
                    const response = await v2.tweet({ text });
                    console.log('✅ Tweet posted after refresh! ID:', response.data.id);
                    return response.data;
                } catch (retryError) {
                    console.error('❌ Error posting after refresh:', retryError);
                    throw retryError;
                }
            }
        }

        console.error('❌ Error posting tweet:', error);
        throw error;
    }
}