import { TwitterApi } from 'twitter-api-v2';
import dotenv from 'dotenv';

dotenv.config();

const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID!,
    clientSecret: process.env.TWITTER_CLIENT_SECRET!,
});

const callbackUrl = process.env.TWITTER_CALLBACK_URL!;

// Step 1: Generate the auth link
const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    callbackUrl,
    { scope: ['tweet.read', 'tweet.write', 'users.read', 'bookmark.read', 'offline.access'] }
);

console.log('1. Go to this URL and authorize the app:\n', url);
console.log('\n2. After authorizing, you will be redirected to your callback URL.');
console.log('   Copy the "code" parameter from the URL and paste it below.\n');

// Prompt user for the code
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Paste the code from the callback URL here: ', async (code) => {
    try {
        // Step 2: Exchange the code for access tokens
        const { client: loggedClient, accessToken, refreshToken, expiresIn, scope } =
            await client.loginWithOAuth2({
                code,
                codeVerifier,
                redirectUri: callbackUrl,
            });

        console.log('\n✅ Success! You are authenticated.');
        console.log('Access Token:', accessToken);
        console.log('Refresh Token:', refreshToken);
        console.log('Expires In:', expiresIn);
        console.log('Scope:', scope);

        // Example: Fetch your user info
        const user = await loggedClient.v2.me();
        console.log('\nYour Twitter user info:', user);

        // Example: Fetch bookmarks
        const bookmarks = await loggedClient.v2.bookmarks();
        console.log('\nYour bookmarks:', bookmarks.data);

        // You can now use loggedClient to post tweets, etc.
        // Save accessToken/refreshToken for future use!

        rl.close();
    } catch (error) {
        console.error('Error during OAuth2 flow:', error);
        rl.close();
    }
});

const twitterClient = new TwitterApi(process.env.TWITTER_ACCESS_TOKEN!);
// If you want to use refresh token logic, you can use TwitterApi.refreshOAuth2Token()

const v2 = twitterClient.v2;

// ...rest of your code (getBookmarks, postTweet, etc.)
