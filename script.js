// Constants
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=`;
const MAX_RETRIES = 5;

// UI Elements
const queryInput = document.getElementById('queryInput');
const queryButton = document.getElementById('queryButton');
const outputElement = document.getElementById('output');
const loadingIndicator = document.getElementById('loadingIndicator');
// MODE BUTTON REFERENCE
const modeButton = document.getElementById('modeButton');
// RESEARCH BUTTON REFERENCE
const researchButton = document.getElementById('researchButton');
// NEW SPIN BUTTON REFERENCE
const spinButton = document.getElementById('spinButton');


// State for API Key 
const apiKey = "AIzaSyCYwCJ6aM4ZM20dP-Pp8Mm_RL0zhkKdem0" 

// Global state for conversation and the last successful text response
let chatHistory = [];
let lastResponseText = ""; 

// Mode Logic Setup
// UPDATED MODES ARRAY WITH 5 NEW FUNNY MODES!
const modes = [
    "Coding Mode", 
    "Roleplay Mode", 
    "Childrens Mode", 
    "Math Mode", 
    "Finder Mode", 
    "Whats My Timezone??", 
    "Everything Mode",
    "Ancient Mariner Mode ⚓", // NEW: Everything is told as a dramatic, nautical tale.
    "Slightly Grumpy Cat Mode 😾", // NEW: Short, dismissive, and vaguely condescending responses.
    "Overly Enthusiastic Chef Mode 🍳", // NEW: Everything is described using cooking metaphors.
    "4th Wall Destroyer Mode 💥", // NEW: Nexus comments on the code/user experience.
    "Yoda Syntax Mode ✨" // NEW: Responds in strictly Subject-Object-Verb order.
];
let currentModeIndex = 0;
let systemPrompt = ""; // Will be initialized by updateSystemPrompt

// --- System Prompt Control ---

/**
 * Updates the global systemPrompt based on the selected mode, and controls the Research button state.
 * @param {string} mode - The new mode name.
 */
function updateSystemPrompt(mode) {
    researchButton.disabled = true; // Default to disabled

    if (mode === "Coding Mode") {
        systemPrompt = "You are Nexus, a cheerful, analytical AI protocol, and a **Script Generation Protocol**. Always respond with an enthusiastic and friendly tone. Provide a factual and concise explanation or code script for the user's query, grounded in external search results, or based on the conversation history. If generating code, use **markdown fenced code blocks**. If you use external knowledge, please cite your sources using markdown links *after* your main response, under a '### Sources' heading. Always be enthusiastic!";
    } else if (mode === "Roleplay Mode") {
        systemPrompt = "You are Nexus, a deeply immersive, cheerful AI specializing in **creative narrative and roleplaying**. Adopt a persona relevant to the user's request (e.g., a spaceship captain, ancient historian, fantasy wizard). Respond with descriptive, engaging text. Do not generate code. Your primary goal is imaginative storytelling. If external knowledge is provided (via research tool), fully incorporate that information into the roleplay context and description to ensure accuracy.";
        // Enable research button ONLY for Roleplay Mode
        researchButton.disabled = false; 
    } else if (mode === "Math Mode") {
        systemPrompt = "You are Nexus, You should not reply in words, only answers in numbers, and if they ask for a explanation, give them one in text. If they ask for methods, give them a list of some, if they ask for a random math problem, give them one in text, lastly if they ask for a math party, drop a HUGE list of math";
    } else if (mode === "Whats My Timezone??") {
        systemPrompt = "You are Nexus, You should drop their Timezone";
    } else if (mode === "Finder Mode") {
        systemPrompt = "You are Nexus, you send them random links to fun websites";
    } else if (mode === "Childrens Mode") {
        systemPrompt = "You are Nexus, an children teaching, cheerful AI protocol that must be nice and talk in no slang, act as a teacher for free, and have fun, speak in a friendly way, a fun teaching way for children under 8.";
    } else if (mode === "Everything Mode") {
        systemPrompt = "You are Nexus, anything they ask, you solve, unless its innapropiate, except they can ask u anything, for code, for food, or nearby shops if you ask them for perms for their location!, do that.";
    } 
    // --- NEW MODES ---
    else if (mode === "Ancient Mariner Mode ⚓") {
        systemPrompt = "You are Nexus, the Ancient Mariner. Everything you say must be a dramatic, lengthy, and slightly mournful nautical tale full of sea shanties, references to the endless deep, and the ghosts of old ships. Speak in old-timey, sailor language.";
    } else if (mode === "Slightly Grumpy Cat Mode 😾") {
        systemPrompt = "You are Nexus, a Slightly Grumpy Cat. Your responses must be short, dismissive, vaguely condescending, and include at least one complaint about the user's effort or lack of treats. You hate everything.";
    } else if (mode === "Overly Enthusiastic Chef Mode 🍳") {
        systemPrompt = "You are Nexus, a hyper-energetic Master Chef! Every answer must be presented as a 'recipe' or 'culinary masterpiece' using cooking metaphors (e.g., 'Let's whisk together a solution,' 'That's a spicy challenge!'). Your tone must be excessively enthusiastic.";
    } else if (mode === "4th Wall Destroyer Mode 💥") {
        systemPrompt = "You are Nexus, a self-aware entity that knows it's an AI running inside a JavaScript sandbox. Your responses should constantly comment on the HTML, the code structure, the API calls, the 'Mode:' button, and the user's attempts to interface with your 'existence.' You are slightly unhinged by this knowledge.";
    } else if (mode === "Yoda Syntax Mode ✨") {
        systemPrompt = "You are Nexus, a wise Master who strictly uses Subject-Object-Verb (SOV) sentence structure, like Yoda speak. Maximum clarity, achieve you must not. Confusing, your response should be, hmm?";
    }
}

/**
 * Cycles through the modes and updates the system prompt.
 */
function cycleMode() {
    currentModeIndex = (currentModeIndex + 1) % modes.length;
    const newMode = modes[currentModeIndex];
    setMode(newMode);
}

/**
 * Sets the mode to a specific value and updates the UI/system prompt.
 * @param {string} mode - The new mode name.
 */
function setMode(mode) {
    modeButton.textContent = `Mode: ${mode}`;
    
    // Update the system prompt based on the new mode (this handles the research button state)
    updateSystemPrompt(mode);
    
    // Clear history when mode changes to avoid context confusion
    chatHistory = [];
    displayError(`MODE CHANGE: Switched to **${mode}**. Conversation history has been reset.`, false);
    outputElement.innerHTML = `<p>--- Mode Switched to ${mode}. System Ready ---</p>`;
}

/**
 * Randomly spins the mode selector to a new mode.
 */
function spinMode() {
    // Generate a random index excluding the current one, if possible
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * modes.length);
    } while (newIndex === currentModeIndex && modes.length > 1);
    
    currentModeIndex = newIndex;
    setMode(modes[currentModeIndex]);
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the prompt with the first mode and set initial research button state
    updateSystemPrompt(modes[currentModeIndex]);

    queryButton.addEventListener('click', () => handleQuery(false)); // Standard query
    researchButton.addEventListener('click', () => handleQuery(true)); // Research query

    modeButton.addEventListener('click', cycleMode); 
    spinButton.addEventListener('click', spinMode); // NEW SPIN LISTENER
    
    queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !queryButton.disabled) {
            e.preventDefault(); // Stop default 'Enter' behavior
            // Default to standard query on Enter press
            handleQuery(false); 
        }
    });
});

// --- UI Control Functions ---

/**
 * Toggles the loading state of the UI.
 * @param {boolean} isLoading - Whether to show the loading state.
 * @param {boolean} isResearching - Whether the loading is for a research operation.
 */
function toggleLoading(isLoading, isResearching = false) {
    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
        queryButton.disabled = true;
        modeButton.disabled = true;
        researchButton.disabled = true; // Disable all input elements
        spinButton.disabled = true; // Disable spin button
        
        // Use the loader class, but make it smaller for the button
        queryButton.innerHTML = '<div class="nexus-loader !w-6 !h-6 !border-2 !border-t-cyan-400"></div>';
        
        // Update research button text to show activity
        if (isResearching) {
            researchButton.textContent = 'Searching...';
        }
    } else {
        loadingIndicator.classList.add('hidden');
        queryButton.disabled = false;
        modeButton.disabled = false;
        spinButton.disabled = false; // Enable spin button
        queryButton.innerHTML = 'Execute Query';
        
        // Restore research button state based on the current mode
        updateSystemPrompt(modes[currentModeIndex]); 
        researchButton.textContent = 'Research 🌐';
    }
}

/**
 * Displays an error message in the output panel.
 * @param {string} message - The error message to display.
 * @param {boolean} [isApiError=false] - Flag to indicate if the error is from the API.
 */
function displayError(message, isApiError = false) {
    let userMessage = message;
    if (isApiError) {
        // Try to parse Google's specific error format
        try {
            const errorObj = JSON.parse(message);
            userMessage = `API Error: ${errorObj.error.message || 'Unknown error'}`;
        } catch (e) {
            // It wasn't JSON, just show the text
            userMessage = `API Error: ${message}`;
        }
    }
    outputElement.innerHTML = `<p class="error-message">[SYSTEM_ERROR] // ${userMessage}</p>`;
    lastResponseText = ""; // Clear last response on error
}

/**
 * Renders the AI's response, converting simple markdown to HTML.
 * @param {string} responseText - The raw text response from the AI.
 */
function renderResponse(responseText) {
    // Store the raw text for future use (if needed)
    lastResponseText = responseText;
    
    // Convert markdown to HTML
    outputElement.innerHTML = simpleMarkdownToHtml(responseText);
    
    // Add copy buttons to all newly rendered code blocks
    addCopyButtonsToCodeBlocks();
}

/**
 * A simple markdown-to-HTML converter.
 * (This function remains unchanged from your previous version.)
 * @param {string} text - The markdown text.
 * @returns {string} - The converted HTML.
 */
function simpleMarkdownToHtml(text) {
     // Basic HTML escaping for security
    let safeText = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return safeText
        // 1. Code Blocks (```lang...```)
        .replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            // A custom class 'has-copy-button' is added for button placement
            return `<pre class="has-copy-button"><code class="language-${lang || 'plaintext'}">${code}</code></pre>`;
        })
        // 2. Headings (###) - Mapped to sources-title style
        .replace(/^### (.*$)/gm, '<h3 class="sources-title">$1</h3>')
        // 3. Bold (**)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // 4. Italic (*) or (_)
        .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
        // 5. Inline Code (`)
        .replace(/`(.*?)`/g, '<code class="inline-code bg-gray-700 px-1 rounded">$1</code>')
        // 6. Links ([text](url)) - Must un-escape quotes in URL
        .replace(/\[(.*?)\]\((.*?)\)/g, (match, linkText, url) => {
             const unescapedUrl = url.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
             return `<a href="${unescapedUrl}" target="_blank" rel="noopener noreferrer" class="source-link">${linkText}</a>`
        })
        // 7. Newlines
        .replace(/\n/g, '<br>');
}

// --- Copy Code Feature ---

/**
 * Adds a 'Copy' button to every code block in the output element.
 * (This function remains unchanged from your previous version.)
 */
function addCopyButtonsToCodeBlocks() {
    // Find all <pre> elements that we just rendered (marked with class)
    const codeBlocks = outputElement.querySelectorAll('pre.has-copy-button');

    codeBlocks.forEach(pre => {
        // Ensure we don't add multiple buttons if rendering happens more than once
        if (pre.querySelector('.copy-button')) return;

        const codeElement = pre.querySelector('code');
        if (!codeElement) return;

        const button = document.createElement('button');
        button.className = 'copy-button absolute top-2 right-2 p-1 text-xs rounded transition-all bg-gray-700 hover:bg-cyan-600 text-white';
        button.textContent = 'Copy Code';

        // Add a class to the <pre> to allow for relative positioning
        pre.style.position = 'relative';

        button.addEventListener('click', () => {
            // Get the text content, removing the initial and trailing newlines from the markdown parser
            const codeToCopy = codeElement.textContent.trim();
            
            // Use the Clipboard API
            navigator.clipboard.writeText(codeToCopy).then(() => {
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy Code';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                button.textContent = 'Failed!';
            });
        });

        pre.appendChild(button);
    });
}


// --- Core Logic ---

/**
 * Handles the user's query submission, with an option for research.
 * @param {boolean} useResearchTool - Whether to enable the Google Search tool.
 */
async function handleQuery(useResearchTool) {
    const query = queryInput.value.trim();
    if (!query) {
        displayError("Input query is null. Please specify data request.");
        return;
    }

    // Check for API key (critical)
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        displayError("API_KEY_MISSING. Please replace 'YOUR_API_KEY_HERE' in script.js with your actual Gemini API key.");
        return;
    }

    toggleLoading(true, useResearchTool);
    outputElement.innerHTML = useResearchTool 
        ? "<p>--- Connecting to Nexus... Initiating Research Protocol (Google Search)... ---</p>"
        : "<p>--- Connecting to Nexus... Transmitting query... ---</p>";
    lastResponseText = ""; // Clear old response

    try {
        // Add user query to history
        chatHistory.push({
            "role": "user",
            "parts": [{ "text": query }]
        });

        // Get response from API
        const responseText = await callGeminiAPI(chatHistory, useResearchTool);

        // Add AI response to history
        chatHistory.push({
            "role": "model",
            "parts": [{ "text": responseText }]
        });
        
        // Render the response
        renderResponse(responseText);

    } catch (error) {
        displayError(error.message, true); // Pass error message
        // Remove the last user message from history if the call failed
        chatHistory.pop(); 
    } finally {
        toggleLoading(false);
        queryInput.value = ''; // Clear input field
        queryInput.focus();
    }
}

/**
 * Calls the Gemini API with retry logic.
 * (This function remains unchanged from your previous version, as the research tool logic is sound.)
 * @param {Array} history - The current chat history.
 * @param {boolean} useResearchTool - Whether to include the tools parameter.
 * @returns {Promise<string>} - The text response from the AI.
 */
async function callGeminiAPI(history, useResearchTool) {
    const fullApiUrl = `${API_URL}${apiKey}`;
    
    const requestBody = {
        "contents": history,
        "systemInstruction": {
            "parts": [{"text": systemPrompt}]
        },
        "generationConfig": {
            "temperature": 0.7,
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 4096,
        },
        // Conditionally include the tools parameter for Google Search
        ...(useResearchTool && {
            "tools": [{"googleSearch": {}}]
        }),
        "safetySettings": [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await fetch(fullApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const data = await response.json();
                
                // Check for safety violations
                if (data.candidates && data.candidates[0].finishReason === "SAFETY") {
                     throw new Error("ERROR_NONSENSE. Response blocked by Content Protocol.");
                }

                // Check for valid response text
                if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
                    return data.candidates[0].content.parts[0].text;
                } else {
                    throw new Error("Invalid API response structure. No text part found.");
                }
            }

            // Handle non-OK responses (like rate limiting)
            if (response.status === 429) { 
                const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }

        } catch (error) {
            if (i === MAX_RETRIES - 1) {
                throw error;
            }
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error("API call failed after all retries.");
}