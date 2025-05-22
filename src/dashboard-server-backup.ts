// dashboard-server.ts - Express server with Shadcn/ui dashboard
import express from 'express';
import path from 'path';
import { getBookmarks, postTweet } from './mcp-server';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static('public'));

// Initialize Claude
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY!
});

// Serve the dashboard HTML with Shadcn/ui
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐦 Tweet Rewriter Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        border: "hsl(var(--border))",
                        input: "hsl(var(--input))",
                        ring: "hsl(var(--ring))",
                        background: "hsl(var(--background))",
                        foreground: "hsl(var(--foreground))",
                        primary: {
                            DEFAULT: "hsl(var(--primary))",
                            foreground: "hsl(var(--primary-foreground))",
                        },
                        secondary: {
                            DEFAULT: "hsl(var(--secondary))",
                            foreground: "hsl(var(--secondary-foreground))",
                        },
                        destructive: {
                            DEFAULT: "hsl(var(--destructive))",
                            foreground: "hsl(var(--destructive-foreground))",
                        },
                        muted: {
                            DEFAULT: "hsl(var(--muted))",
                            foreground: "hsl(var(--muted-foreground))",
                        },
                        accent: {
                            DEFAULT: "hsl(var(--accent))",
                            foreground: "hsl(var(--accent-foreground))",
                        },
                        card: {
                            DEFAULT: "hsl(var(--card))",
                            foreground: "hsl(var(--card-foreground))",
                        },
                    },
                    borderRadius: {
                        lg: "var(--radius)",
                        md: "calc(var(--radius) - 2px)",
                        sm: "calc(var(--radius) - 4px)",
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --popover: 0 0% 100%;
            --popover-foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96%;
            --secondary-foreground: 222.2 84% 4.9%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --accent: 210 40% 96%;
            --accent-foreground: 222.2 84% 4.9%;
            --destructive: 0 84.2% 60.2%;
            --destructive-foreground: 210 40% 98%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 221.2 83.2% 53.3%;
            --radius: 0.5rem;
        }
        
        .btn {
            @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
        }
        
        .btn-primary {
            @apply bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2;
        }
        
        .btn-secondary {
            @apply bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2;
        }
        
        .btn-outline {
            @apply border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2;
        }
        
        .card {
            @apply rounded-lg border bg-card text-card-foreground shadow-sm;
        }
        
        .card-header {
            @apply flex flex-col space-y-1.5 p-6;
        }
        
        .card-title {
            @apply text-2xl font-semibold leading-none tracking-tight;
        }
        
        .card-content {
            @apply p-6 pt-0;
        }
        
        .input {
            @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
        }
        
        .textarea {
            @apply flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
        }
        
        .badge {
            @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2;
        }
        
        .badge-secondary {
            @apply border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80;
        }
        
        .tweet-item {
            @apply p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50;
        }
        
        .tweet-item.selected {
            @apply border-primary bg-primary/5 shadow-md;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .loading-dots::after {
            content: '';
            animation: dots 1.5s infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
        }
    </style>
</head>
<body class="bg-background text-foreground">
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">🐦 Tweet Rewriter Dashboard</h1>
                <p class="text-xl text-gray-600">Select a bookmarked tweet, give AI instructions, and generate amazing content</p>
            </div>
            
            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
                <!-- Bookmarks Panel -->
                <div class="card">
                    <div class="card-header">
                        <div class="flex items-center justify-between">
                            <h2 class="card-title flex items-center gap-2">
                                📚 Your Bookmarked Tweets
                            </h2>
                            <button class="btn btn-outline" onclick="loadBookmarks()">
                                🔄 Refresh
                            </button>
                        </div>
                    </div>
                    <div class="card-content">
                        <div id="bookmarks-container" class="space-y-3 max-h-[60vh] overflow-y-auto">
                            <div class="text-center py-12">
                                <div class="animate-pulse">
                                    <div class="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full"></div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">Loading your bookmarks...</h3>
                                    <p class="text-gray-500">Please wait while we fetch your saved tweets</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Rewriter Panel -->
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title flex items-center gap-2">
                            🤖 AI Rewriter
                        </h2>
                    </div>
                    <div class="card-content space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Give AI instructions:
                            </label>
                            <textarea 
                                id="instructions" 
                                class="textarea h-32"
                                placeholder="Example: I like this tweet's insight, but make it sound more confident and add specific examples about building with AI..."
                            ></textarea>
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-primary" onclick="generateRewrite()">
                                ✨ Generate Rewrite
                            </button>
                            <button class="btn btn-secondary" onclick="tryDifferentStyle()">
                                🎲 Try Different Style
                            </button>
                        </div>
                        
                        <div id="generated-content"></div>
                        <div id="status-container"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let selectedTweet = null;
        let bookmarks = [];

        async function loadBookmarks() {
            try {
                showStatus('Loading bookmarks...', 'loading');
                const response = await fetch('/api/bookmarks');
                const data = await response.json();
                
                if (data.success) {
                    bookmarks = data.bookmarks;
                    displayBookmarks(bookmarks);
                    showStatus(\`✅ Loaded \${bookmarks.length} bookmarks\`, 'success');
                } else {
                    showStatus('❌ Failed to load bookmarks: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Error loading bookmarks: ' + error.message, 'error');
            }
        }

        function displayBookmarks(bookmarks) {
            const container = document.getElementById('bookmarks-container');
            
            if (bookmarks.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            📚
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
                        <p class="text-gray-500">Save some tweets to your bookmarks and try again!</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = bookmarks.map((tweet, index) => \`
                <div class="tweet-item" onclick="selectTweet(\${index})">
                    <div class="text-sm text-gray-900 mb-2 leading-relaxed">
                        \${tweet.text.substring(0, 200)}\${tweet.text.length > 200 ? '...' : ''}
                    </div>
                    <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span class="badge badge-secondary">
                            🔥 \${tweet.public_metrics?.like_count || 0} likes
                        </span>
                        <span class="badge badge-secondary">
                            🔄 \${tweet.public_metrics?.retweet_count || 0} retweets
                        </span>
                    </div>
                </div>
            \`).join('');
        }

        function selectTweet(index) {
            document.querySelectorAll('.tweet-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            document.querySelectorAll('.tweet-item')[index].classList.add('selected');
            selectedTweet = bookmarks[index];
        }

        async function generateRewrite() {
            if (!selectedTweet) {
                showStatus('❌ Please select a tweet first', 'error');
                return;
            }
            
            const instructions = document.getElementById('instructions').value;
            if (!instructions.trim()) {
                showStatus('❌ Please provide instructions for the AI', 'error');
                return;
            }
            
            try {
                showStatus('🤖 AI is rewriting your tweet', 'loading');
                
                const response = await fetch('/api/rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalTweet: selectedTweet.text,
                        instructions: instructions
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayGeneratedTweet(data.rewrittenTweet);
                    showStatus('✅ Tweet rewritten successfully!', 'success');
                } else {
                    showStatus('❌ Failed to rewrite: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Error: ' + error.message, 'error');
            }
        }

        function displayGeneratedTweet(rewrittenTweet) {
            const container = document.getElementById('generated-content');
            container.innerHTML = \`
                <div class="card fade-in border-blue-200 bg-blue-50">
                    <div class="card-header">
                        <h3 class="text-lg font-semibold text-blue-900">📝 Generated Tweet</h3>
                    </div>
                    <div class="card-content">
                        <div class="text-gray-900 leading-relaxed mb-4">
                            \${rewrittenTweet}
                        </div>
                        
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-primary" onclick="postTweet()">
                                🚀 Post Tweet
                            </button>
                            <button class="btn btn-outline" onclick="copyToClipboard()">
                                📋 Copy
                            </button>
                            <button class="btn btn-secondary" onclick="generateRewrite()">
                                🔄 Regenerate
                            </button>
                        </div>
                    </div>
                </div>
            \`;
        }

        async function postTweet() {
            const generatedText = document.querySelector('#generated-content .text-gray-900').textContent.trim();
            
            try {
                showStatus('🚀 Posting tweet', 'loading');
                
                const response = await fetch('/api/post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: generatedText })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showStatus(\`✅ Tweet posted successfully! ID: \${data.tweetId}\`, 'success');
                } else {
                    showStatus('❌ Failed to post: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Error posting: ' + error.message, 'error');
            }
        }

        function copyToClipboard() {
            const generatedText = document.querySelector('#generated-content .text-gray-900').textContent.trim();
            navigator.clipboard.writeText(generatedText);
            showStatus('📋 Copied to clipboard!', 'success');
        }

        function tryDifferentStyle() {
            const stylePrompts = [
                "Make this tweet more professional and authoritative",
                "Rewrite this to be more casual and conversational", 
                "Make this more contrarian and thought-provoking",
                "Add humor and make this more entertaining",
                "Make this more inspiring and motivational",
                "Add specific examples and make it more actionable",
                "Make it sound more confident and bold",
                "Simplify the language and make it more accessible"
            ];
            
            const randomPrompt = stylePrompts[Math.floor(Math.random() * stylePrompts.length)];
            document.getElementById('instructions').value = randomPrompt;
            generateRewrite();
        }

        function showStatus(message, type) {
            const container = document.getElementById('status-container');
            
            const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                           type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                           'bg-yellow-50 border-yellow-200 text-yellow-800';
            
            const loadingClass = type === 'loading' ? 'loading-dots' : '';
            
            container.innerHTML = \`
                <div class="p-3 rounded-lg border \${bgColor} \${loadingClass}">
                    \${message}
                </div>
            \`;
            
            if (type === 'success') {
                setTimeout(() => {
                    container.innerHTML = '';
                }, 3000);
            }
        }

        // Load bookmarks when page loads
        window.onload = loadBookmarks;
    </script>
</body>
</html>
    `);
});

// API endpoints remain the same...
app.get('/api/bookmarks', async (req, res) => {
    try {
        const bookmarks = await getBookmarks();
        res.json({ success: true, bookmarks });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/rewrite', async (req, res) => {
    try {
        const { originalTweet, instructions } = req.body;

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 280,
            messages: [{
                role: 'user',
                content: `${instructions}

Original Tweet: ${originalTweet}

Rewritten Tweet:`
            }]
        });

        const rewrittenTweet = message.content[0].text.trim();
        res.json({ success: true, rewrittenTweet });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/post', async (req, res) => {
    try {
        const { text } = req.body;
        const result = await postTweet(text);
        res.json({ success: true, tweetId: result.id });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Tweet Rewriter Dashboard running at http://localhost:${port}`);
    console.log(`📚 Open your browser and start rewriting tweets!`);
});