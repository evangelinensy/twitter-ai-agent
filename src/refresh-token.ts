// refresh-token.ts - Run this to get fresh OAuth 2.0 tokens
import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const {
    TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET,
    TWITTER_REFRESH_TOKEN
} = process.env;

if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET || !TWITTER_REFRESH_TOKEN) {
    throw new Error('Missing client credentials or refresh token in .env file!');
}

async function refreshTokens() {
    try {
        console.log('🔄 Refreshing OAuth 2.0 tokens...');

        const refreshClient = new TwitterApi({
            clientId: TWITTER_CLIENT_ID,
            clientSecret: TWITTER_CLIENT_SECRET,
        });

        const { accessToken, refreshToken } = await refreshClient.refreshOAuth2Token(TWITTER_REFRESH_TOKEN);

        console.log('✅ Tokens refreshed successfully!');
        console.log('\n📝 Update your .env file with these new tokens:');
        console.log(`TWITTER_ACCESS_TOKEN=${accessToken}`);
        console.log(`TWITTER_REFRESH_TOKEN=${refreshToken}`);

        return { accessToken, refreshToken };

    } catch (error) {
        console.error('❌ Error refreshing tokens:', error);
        throw error;
    }
}

// Run the refresh
refreshTokens().catch(console.error);