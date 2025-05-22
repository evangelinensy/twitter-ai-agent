// enhanced-dashboard.ts - Dashboard integrated with your agent logic
import express from 'express';
import { getBookmarks, postTweet } from './mcp-server';
import { Anthropic } from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(express.json());

// Initialize Claude with your agent's rewrite instructions
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY!
});

// Your agent's rewrite styles (from your original agent.ts)
const rewriteInstructions = {
    conservative: 'Rewrite this tweet to be slightly more engaging, but keep the original meaning and tone.',
    moderate: 'Rewrite this tweet to be noticeably more engaging and persuasive, while keeping your voice.',
    bold: 'Rewrite this tweet to be bold, attention-grabbing, and optimized for maximum engagement. Take creative risks!'
};

// Serve the enhanced dashboard
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 AI Tweet Agent Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 221.2 83.2% 53.3%;
            --primary-foreground: 210 40% 98%;
            --secondary: 210 40% 96%;
            --secondary-foreground: 222.2 84% 4.9%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --border: 214.3 31.8% 91.4%;
            --ring: 221.2 83.2% 53.3%;
        }
        
        .card {
            @apply rounded-lg border bg-white shadow-sm;
        }
        
        .btn {
            @apply inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50;
        }
        
        .btn-primary {
            @apply bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2;
        }
        
        .btn-secondary {
            @apply bg-gray-100 text-gray-900 hover:bg-gray-200 h-10 px-4 py-2;
        }
        
        .btn-outline {
            @apply border border-gray-300 bg-white hover:bg-gray-50 h-10 px-4 py-2;
        }
        
        .tweet-item {
            @apply p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300;
        }
        
        .tweet-item.selected {
            @apply border-blue-500 bg-blue-50 shadow-md;
        }
        
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .loading::after {
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
<body class="bg-gray-50">
    <div class="min-h-screen p-6">
        <div class="max-w-7xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-gray-900 mb-2">🤖 AI Tweet Agent Dashboard</h1>
                <p class="text-xl text-gray-600">Your AI agent for rewriting and posting tweets with intelligence</p>
            </div>
            
            <!-- Agent Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="card p-4">
                    <div class="text-sm text-gray-600">Total Bookmarks</div>
                    <div class="text-2xl font-bold text-blue-600" id="bookmark-count">-</div>
                </div>
                <div class="card p-4">
                    <div class="text-sm text-gray-600">Tweets Rewritten</div>
                    <div class="text-2xl font-bold text-green-600" id="rewrite-count">0</div>
                </div>
                <div class="card p-4">
                    <div class="text-sm text-gray-600">Tweets Posted</div>
                    <div class="text-2xl font-bold text-purple-600" id="post-count">0</div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Bookmarks Panel -->
                <div class="card">
                    <div class="p-6 border-b">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold flex items-center gap-2">
                                📚 Your Bookmarked Tweets
                            </h2>
                            <div class="flex gap-2">
                                <button class="btn btn-outline" onclick="runFullAgent()">
                                    🤖 Run Full Agent
                                </button>
                                <button class="btn btn-secondary" onclick="loadBookmarks()">
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <div id="bookmarks-container" class="space-y-3 max-h-[60vh] overflow-y-auto">
                            <div class="text-center py-12">
                                <div class="animate-pulse">
                                    <div class="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full"></div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">Loading your bookmarks...</h3>
                                    <p class="text-gray-500">Your AI agent is fetching your saved tweets</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- AI Rewriter Panel -->
                <div class="card">
                    <div class="p-6 border-b">
                        <h2 class="text-xl font-semibold flex items-center gap-2">
                            🤖 AI Agent Rewriter
                        </h2>
                    </div>
                    <div class="p-6 space-y-4">
                        <!-- Custom Instructions -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Custom AI Instructions:
                            </label>
                            <textarea 
                                id="instructions" 
                                class="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tell your AI agent how to rewrite this tweet..."
                            ></textarea>
                        </div>
                        
                        <!-- Agent Rewrite Styles -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Or use agent's preset styles:
                            </label>
                            <div class="grid grid-cols-1 gap-2">
                                <button class="btn btn-outline text-left" onclick="rewriteWithStyle('conservative')">
                                    🔹 Conservative: Slightly more engaging, same tone
                                </button>
                                <button class="btn btn-outline text-left" onclick="rewriteWithStyle('moderate')">
                                    🔸 Moderate: Noticeably more engaging and persuasive
                                </button>
                                <button class="btn btn-outline text-left" onclick="rewriteWithStyle('bold')">
                                    🔥 Bold: Maximum engagement, creative risks
                                </button>
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="flex flex-wrap gap-2">
                            <button class="btn btn-primary" onclick="generateCustomRewrite()">
                                ✨ Custom Rewrite
                            </button>
                            <button class="btn btn-secondary" onclick="generateAllStyles()">
                                🎨 All 3 Styles
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
        let rewriteCount = 0;
        let postCount = 0;

        async function loadBookmarks() {
            try {
                showStatus('🤖 Agent is loading bookmarks...', 'loading');
                const response = await fetch('/api/bookmarks');
                const data = await response.json();
                
                if (data.success) {
                    bookmarks = data.bookmarks;
                    displayBookmarks(bookmarks);
                    document.getElementById('bookmark-count').textContent = bookmarks.length;
                    showStatus(\`✅ Agent loaded \${bookmarks.length} bookmarks\`, 'success');
                } else {
                    showStatus('❌ Agent failed to load bookmarks: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        function displayBookmarks(bookmarks) {
            const container = document.getElementById('bookmarks-container');
            
            if (bookmarks.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <div class="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                            🤖
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
                        <p class="text-gray-500">Your AI agent needs some bookmarked tweets to work with!</p>
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
                        <span class="px-2 py-1 bg-red-100 text-red-700 rounded">
                            🔥 \${tweet.public_metrics?.like_count || 0} likes
                        </span>
                        <span class="px-2 py-1 bg-green-100 text-green-700 rounded">
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

        async function rewriteWithStyle(style) {
            if (!selectedTweet) {
                showStatus('❌ Please select a tweet first', 'error');
                return;
            }
            
            try {
                showStatus(\`🤖 Agent is rewriting with \${style} style...\`, 'loading');
                
                const response = await fetch('/api/rewrite-style', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalTweet: selectedTweet.text,
                        style: style
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displaySingleRewrite(data.rewrittenTweet, style);
                    rewriteCount++;
                    document.getElementById('rewrite-count').textContent = rewriteCount;
                    showStatus(\`✅ Agent completed \${style} rewrite!\`, 'success');
                } else {
                    showStatus('❌ Agent failed: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        async function generateAllStyles() {
            if (!selectedTweet) {
                showStatus('❌ Please select a tweet first', 'error');
                return;
            }
            
            try {
                showStatus('🤖 Agent is generating all 3 styles...', 'loading');
                
                const response = await fetch('/api/rewrite-all-styles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalTweet: selectedTweet.text
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displayAllRewrites(data.rewrites);
                    rewriteCount += 3;
                    document.getElementById('rewrite-count').textContent = rewriteCount;
                    showStatus('✅ Agent completed all 3 rewrites!', 'success');
                } else {
                    showStatus('❌ Agent failed: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        async function generateCustomRewrite() {
            if (!selectedTweet) {
                showStatus('❌ Please select a tweet first', 'error');
                return;
            }
            
            const instructions = document.getElementById('instructions').value;
            if (!instructions.trim()) {
                showStatus('❌ Please provide custom instructions', 'error');
                return;
            }
            
            try {
                showStatus('🤖 Agent is processing your custom instructions...', 'loading');
                
                const response = await fetch('/api/rewrite-custom', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        originalTweet: selectedTweet.text,
                        instructions: instructions
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displaySingleRewrite(data.rewrittenTweet, 'custom');
                    rewriteCount++;
                    document.getElementById('rewrite-count').textContent = rewriteCount;
                    showStatus('✅ Agent completed custom rewrite!', 'success');
                } else {
                    showStatus('❌ Agent failed: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        function displaySingleRewrite(rewrittenTweet, style) {
            const container = document.getElementById('generated-content');
            const styleColors = {
                conservative: 'border-blue-200 bg-blue-50',
                moderate: 'border-yellow-200 bg-yellow-50', 
                bold: 'border-red-200 bg-red-50',
                custom: 'border-purple-200 bg-purple-50'
            };
            
            container.innerHTML = \`
                <div class="card fade-in \${styleColors[style] || styleColors.custom} p-4">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-semibold text-gray-900">📝 \${style.toUpperCase()} Rewrite</h3>
                        <span class="text-xs px-2 py-1 bg-white rounded">by AI Agent</span>
                    </div>
                    <div class="text-gray-900 leading-relaxed mb-4">
                        \${rewrittenTweet}
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-primary" onclick="postTweet('\${rewrittenTweet.replace(/'/g, "\\'")}')">
                            🚀 Post Tweet
                        </button>
                        <button class="btn btn-outline" onclick="copyToClipboard('\${rewrittenTweet.replace(/'/g, "\\'")}')">
                            📋 Copy
                        </button>
                    </div>
                </div>
            \`;
        }

        function displayAllRewrites(rewrites) {
            const container = document.getElementById('generated-content');
            const styles = ['conservative', 'moderate', 'bold'];
            const styleColors = {
                conservative: 'border-blue-200 bg-blue-50',
                moderate: 'border-yellow-200 bg-yellow-50', 
                bold: 'border-red-200 bg-red-50'
            };
            
            container.innerHTML = styles.map(style => \`
                <div class="card fade-in \${styleColors[style]} p-4 mb-3">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="font-semibold text-gray-900">📝 \${style.toUpperCase()} Rewrite</h3>
                        <span class="text-xs px-2 py-1 bg-white rounded">by AI Agent</span>
                    </div>
                    <div class="text-gray-900 leading-relaxed mb-4">
                        \${rewrites[style]}
                    </div>
                    
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-primary" onclick="postTweet('\${rewrites[style].replace(/'/g, "\\'")}')">
                            🚀 Post Tweet
                        </button>
                        <button class="btn btn-outline" onclick="copyToClipboard('\${rewrites[style].replace(/'/g, "\\'")}')">
                            📋 Copy
                        </button>
                    </div>
                </div>
            \`).join('');
        }

        async function runFullAgent() {
            try {
                showStatus('🤖 Running full AI agent workflow...', 'loading');
                
                const response = await fetch('/api/run-full-agent', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showStatus(\`✅ Agent completed! Processed \${data.tweetsProcessed} tweets. Check rewritten-tweets.json\`, 'success');
                    // Reload bookmarks to refresh the UI
                    loadBookmarks();
                } else {
                    showStatus('❌ Agent failed: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        async function postTweet(text) {
            try {
                showStatus('🚀 Agent is posting tweet...', 'loading');
                
                const response = await fetch('/api/post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    postCount++;
                    document.getElementById('post-count').textContent = postCount;
                    showStatus(\`✅ Agent posted tweet! ID: \${data.tweetId}\`, 'success');
                } else {
                    showStatus('❌ Agent failed to post: ' + data.error, 'error');
                }
            } catch (error) {
                showStatus('❌ Agent error: ' + error.message, 'error');
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text);
            showStatus('📋 Copied to clipboard!', 'success');
        }

        function showStatus(message, type) {
            const container = document.getElementById('status-container');
            
            const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                           type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
                           'bg-yellow-50 border-yellow-200 text-yellow-800';
            
            const loadingClass = type === 'loading' ? 'loading' : '';
            
            container.innerHTML = \`
                <div class="p-3 rounded-lg border \${bgColor} \${loadingClass}">
                    \${message}
                </div>
            \`;
            
            if (type === 'success') {
                setTimeout(() => {
                    container.innerHTML = '';
                }, 4000);
            }
        }

        // Load bookmarks when page loads
        window.onload = loadBookmarks;
    </script>
</body>
</html>
    `);
});

// Enhanced API endpoints that use your agent logic

// Get bookmarks (already connected)
app.get('/api/bookmarks', async (req, res) => {
    try {
        const bookmarks = await getBookmarks();
        res.json({ success: true, bookmarks });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Rewrite with specific style (uses your agent's preset styles)
app.post('/api/rewrite-style', async (req, res) => {
    try {
        const { originalTweet, style } = req.body;
        const instruction = rewriteInstructions[style];

        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 280,
            messages: [{
                role: 'user',
                content: `${instruction}

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

// Rewrite with all 3 styles (like your original agent)
app.post('/api/rewrite-all-styles', async (req, res) => {
    try {
        const { originalTweet } = req.body;
        const rewrites = {};

        for (const [style, instruction] of Object.entries(rewriteInstructions)) {
            const message = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 280,
                messages: [{
                    role: 'user',
                    content: `${instruction}

Original Tweet: ${originalTweet}

Rewritten Tweet:`
                }]
            });

            rewrites[style] = message.content[0].text.trim();
        }

        res.json({ success: true, rewrites });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Custom rewrite with user instructions
app.post('/api/rewrite-custom', async (req, res) => {
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

// Run full agent (processes all bookmarks like your original agent.ts)
app.post('/api/run-full-agent', async (req, res) => {
    try {
        const bookmarks = await getBookmarks();
        if (!bookmarks.length) {
            return res.json({ success: false, error: 'No bookmarks found' });
        }

        const rewrittenTweets = [];

        for (const tweet of bookmarks) {
            const originalText = tweet.text;
            const rewrites = {};

            for (const [style, instruction] of Object.entries(rewriteInstructions)) {
                try {
                    const message = await anthropic.messages.create({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 280,
                        messages: [{
                            role: 'user',
                            content: `${instruction}

Original Tweet: ${originalText}

Rewritten Tweet:`
                        }]
                    });

                    rewrites[style] = message.content[0].text.trim();
                } catch (error) {
                    console.error(`Error rewriting tweet (${style}):`, error);
                    rewrites[style] = '';
                }
            }

            rewrittenTweets.push({ original: originalText, ...rewrites });
        }

        // Save to file (like your original agent)
        const fs = await import('fs');
        const path = await import('path');
        const outputPath = path.join(process.cwd(), 'rewritten-tweets.json');
        fs.writeFileSync(outputPath, JSON.stringify(rewrittenTweets, null, 2));

        res.json({
            success: true,
            tweetsProcessed: rewrittenTweets.length,
            savedTo: 'rewritten-tweets.json'
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Post tweet (already connected)
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
    console.log(`🤖 AI Tweet Agent Dashboard running at http://localhost:${port}`);
    console.log(`📚 Your agent is ready to rewrite and post tweets!`);
    console.log(`✨ Features: Bookmarks → AI Rewriting → Smart Posting`);
});