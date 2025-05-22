// MCP Server with Auto Token Refresh
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
let twitterClient = new TwitterApi(currentAccessToken);
let v2 = twitterClient.v2;

async function refreshTokensIfNeeded() {
    try {
        console.log('🔄 Refreshing tokens...');
        
        const refreshClient = new TwitterApi({
            clientId: TWITTER_CLIENT_ID!,
            clientSecret: TWITTER_CLIENT_SECRET!,
        });
        
        const { accessToken, refreshToken } = await refreshClient.refreshOAuth2Token(currentRefreshToken);
        
        currentAccessToken = accessToken;
        currentRefreshToken = refreshToken;
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

        console.log(`📊 Found ${bookmarks.data?.length || 0} bookmarks`);
        return bookmarks.data ?? [];
        
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
