# Grok Local Chatbot – Zero Cost, No Code Origins

A simple, fully working **AI chatbot** running entirely on your laptop using Node.js + Express.  
Built with **zero coding knowledge** — I just asked Grok (xAI) step-by-step for help!

Watch the full YouTube tutorial:  
https://www.youtube.com/@TruthSpiritWealth

**Coming soon:**  
- More natural voice output (TTS)  
- Notes, reminder
- MCP integration to edit Google Calendar directly  

This is a perfect starter project if you're new to AI and want something local/offline-capable without APIs or subscriptions.

## Features
- Real-time chat interface in your browser  
- Runs 100% locally on your machine (no internet needed after setup)  
- Powered by Grok-guided code (simple Express server + basic HTML/JS frontend)  
- Zero cost – no paid APIs, no cloud  
- Beginner-friendly: minimal dependencies  

## Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended – LTS is fine)  
- A modern web browser (Chrome, Firefox, etc.)  

No other accounts, keys, or payments needed!

## Installation & Setup
1. **Clone or download** this repository  
   ```bash
   git clone https://github.com/TeknoMu/zero-code-ai-chatbot
-------------
   Navigate to the project folder

   Run: npm install

   Start the server: node server.js

You should see: Server running on http://localhost:3000
Open in browser
Go to: http://localhost:3000  → Chat away! Type messages and get responses.

Project Structure

grok-local-chatbot/
├── index.html       # Frontend: chat UI (HTML + CSS + JS)
├── server.js        # Backend: Express server handling requests
├── package.json     # Dependencies and scripts
├── .gitignore       # Ignores node_modules, etc.
├── LICENSE          # MIT License
└── README.md        # This file

How It Works (Quick Overview)
index.html: Simple webpage with input box, send button, and message display area.  
server.js: Express server that listens for POST requests from the frontend, processes them (in this version: echoes or basic logic – upgrade with real AI later), and sends back replies.
Everything stays local – no external calls in the base version.

Future Upgrades 
Take notes, save them.
Remind tasks, appointment
Calendar integration via MCP/Google API




