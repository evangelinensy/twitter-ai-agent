"use strict";
// Agent Logic: Fetches bookmarks, rewrites, and schedules tweets
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_server_1 = require("./mcp-server");
var sdk_1 = require("@anthropic-ai/sdk");
var fs = require("fs");
var path = require("path");
// Load Claude API key from environment
var CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
if (!CLAUDE_API_KEY) {
    throw new Error('Missing CLAUDE_API_KEY in .env file!');
}
// Initialize Claude client
var anthropic = new sdk_1.Anthropic({ apiKey: CLAUDE_API_KEY });
// Instructions for Claude
var rewriteInstructions = {
    conservative: 'Rewrite this tweet to be slightly more engaging, but keep the original meaning and tone.',
    moderate: 'Rewrite this tweet to be noticeably more engaging and persuasive, while keeping your voice.',
    bold: 'Rewrite this tweet to be bold, attention-grabbing, and optimized for maximum engagement. Take creative risks!'
};
// Main function to run the agent
function runAgent() {
    return __awaiter(this, void 0, void 0, function () {
        var bookmarks, rewrittenTweets, _i, bookmarks_1, tweet, originalText, rewrites, _a, _b, _c, style, instruction, prompt_1, completion, error_1, outputPath;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, mcp_server_1.getBookmarks)()];
                case 1:
                    bookmarks = _d.sent();
                    if (!bookmarks.length) {
                        console.log('No bookmarks found.');
                        return [2 /*return*/];
                    }
                    rewrittenTweets = [];
                    _i = 0, bookmarks_1 = bookmarks;
                    _d.label = 2;
                case 2:
                    if (!(_i < bookmarks_1.length)) return [3 /*break*/, 10];
                    tweet = bookmarks_1[_i];
                    originalText = tweet.text;
                    rewrites = {};
                    console.log("\nOriginal Tweet: ".concat(originalText));
                    _a = 0, _b = Object.entries(rewriteInstructions);
                    _d.label = 3;
                case 3:
                    if (!(_a < _b.length)) return [3 /*break*/, 8];
                    _c = _b[_a], style = _c[0], instruction = _c[1];
                    prompt_1 = "".concat(instruction, "\n\nOriginal Tweet: ").concat(originalText, "\nRewritten Tweet:");
                    _d.label = 4;
                case 4:
                    _d.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, anthropic.completions.create({
                            model: 'claude-3-opus-20240229',
                            max_tokens_to_sample: 280,
                            prompt: prompt_1,
                        })];
                case 5:
                    completion = _d.sent();
                    rewrites[style] = completion.completion.trim();
                    console.log("\n[".concat(style.toUpperCase(), "] ").concat(rewrites[style]));
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _d.sent();
                    console.error("Error rewriting tweet (".concat(style, "):"), error_1);
                    rewrites[style] = '';
                    return [3 /*break*/, 7];
                case 7:
                    _a++;
                    return [3 /*break*/, 3];
                case 8:
                    rewrittenTweets.push(__assign({ original: originalText }, rewrites));
                    _d.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 2];
                case 10:
                    outputPath = path.join(__dirname, '../rewritten-tweets.json');
                    fs.writeFileSync(outputPath, JSON.stringify(rewrittenTweets, null, 2));
                    console.log("\nAll rewritten tweets saved to rewritten-tweets.json");
                    return [2 /*return*/];
            }
        });
    });
}
// Run the agent
runAgent().catch(console.error);
