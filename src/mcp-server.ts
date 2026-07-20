// MCP Server with Auto Token Refresh
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

function requiredEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing ${name} in .env file!`);
    }
    return value;
}

let currentAccessToken = requiredEnvironmentVariable('TWITTER_ACCESS_TOKEN');
let currentRefreshToken = requiredEnvironmentVariable('TWITTER_REFRESH_TOKEN');
const twitterClientId = requiredEnvironmentVariable('TWITTER_CLIENT_ID');
const twitterClientSecret = requiredEnvironmentVariable('TWITTER_CLIENT_SECRET');
let twitterClient = new TwitterApi(currentAccessToken);
let v2 = twitterClient.v2;

async function refreshTokensIfNeeded() {
    try {
        console.log('🔄 Refreshing tokens...');
        
        const refreshClient = new TwitterApi({
            clientId: twitterClientId,
            clientSecret: twitterClientSecret,
        });
        
        const { accessToken, refreshToken } = await refreshClient.refreshOAuth2Token(currentRefreshToken);
        
        currentAccessToken = accessToken;
        currentRefreshToken = refreshToken ?? currentRefreshToken;
        twitterClient = new TwitterApi(currentAccessToken);
        v2 = twitterClient.v2;
        
        console.log('✅ Tokens refreshed automatically!');
        return true;
    } catch (error) {
        console.error('❌ Failed to refresh tokens:', error);
        return false;
    }
}

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

        console.log(`📊 Found ${bookmarks.tweets.length} bookmarks`);
        return bookmarks.tweets;
        
    } catch (error: any) {
        if (error.code === 401) {
            console.log('🔄 Token expired, auto-refreshing...');
            const refreshed = await refreshTokensIfNeeded();
            if (refreshed) {
                return await getBookmarks();
            }
        }
        console.error('❌ Error fetching bookmarks:', error);
        return [];
    }
}

export async function postTweet(text: string) {
    try {
        console.log('📝 Posting tweet:', text.substring(0, 50) + '...');
        const response = await v2.tweet({ text });
        console.log('✅ Tweet posted! ID:', response.data.id);
        return response.data;
        
    } catch (error: any) {
        if (error.code === 401) {
            console.log('🔄 Token expired, auto-refreshing...');
            const refreshed = await refreshTokensIfNeeded();
            if (refreshed) {
                return await postTweet(text);
            }
        }
        console.error('❌ Error posting tweet:', error);
        throw error;
    }
}
