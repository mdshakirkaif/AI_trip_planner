# 🌍 Travel Planner AI - JavaScript UI Setup

## Overview
The application now includes a modern ChatGPT-style web interface built with vanilla JavaScript, HTML, and CSS. This replaces the Streamlit UI with a responsive, streaming-enabled chat interface.

## Project Structure

```
public/
├── index.html      # Main HTML file with ChatGPT-like UI
├── styles.css      # Modern dark-themed CSS styling
├── app.js          # JavaScript logic for chat, streaming, and UI interactions
```

## Features

✨ **Modern UI**
- ChatGPT-like dark theme interface
- Responsive design (works on desktop, tablet, mobile)
- Smooth animations and transitions
- Professional styling with accent colors

💬 **Chat Features**
- Real-time message streaming
- Chat history management
- Quick prompt suggestions
- Auto-saving conversations to localStorage
- Markdown support for formatted responses

⚙️ **Backend Integration**
- FastAPI server at `http://localhost:8000`
- Dual endpoints:
  - `/stream` - Server-Sent Events (SSE) streaming
  - `/query` - Fallback non-streaming endpoint
- CORS enabled for cross-origin requests

## How to Run

### 1. Start the FastAPI Backend
```bash
# Make sure you're in the project directory
cd c:\Users\mohdz\AI_Trip_Planner

# Activate virtual environment (if not already active)
.\env\Scripts\Activate.ps1

# Start the FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Access the UI
Open your browser and navigate to:
```
http://localhost:8000
```

The homepage will automatically load `index.html` from the `public/` directory.

## Configuration

### API Endpoints
The JavaScript frontend communicates with the FastAPI backend using:

**Streaming Endpoint** (Recommended)
```
POST http://localhost:8000/stream
Content-Type: application/json
Body: { "question": "Your travel query" }
Response: Server-Sent Events stream
```

**Fallback Endpoint**
```
POST http://localhost:8000/query
Content-Type: application/json
Body: { "question": "Your travel query" }
Response: JSON { "answer": "Travel plan" }
```

### Customization

#### Change Theme Colors
Edit `public/styles.css` and modify the CSS variables in `:root`:
```css
:root {
    --bg-primary: #0d0d0d;        /* Main background */
    --bg-secondary: #1a1a1a;      /* Sidebar background */
    --accent-color: #10a37f;      /* Primary accent (green) */
    --text-primary: #ececec;      /* Main text */
}
```

#### Adjust Streaming Chunk Size
In `public/app.js`, modify this line:
```javascript
const chunk_size = 10;  // Characters per chunk (reduce for more frequent updates)
```

#### Change API Base URL
If your API runs on a different host/port, update in `public/app.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

## Features Explained

### Chat History
- Automatically saves conversations to browser's `localStorage`
- Click previous chats in the sidebar to load them
- Create new chats with the "New Chat" button
- Delete individual chats with the trash icon

### Quick Prompts
- Four pre-filled prompt suggestions appear on startup
- Click any prompt to auto-fill the input
- Customize prompts in `index.html` quick-prompts section

### Streaming Responses
- Responses are streamed character-by-character
- Falls back to non-streaming if SSE is unavailable
- Shows "Bot is thinking..." indicator during processing

### Markdown Support
- Headers: `# H1`, `## H2`, `### H3`
- Bold: `**text**`, Italic: `*text*`
- Code: `` `inline` `` or ``` ```code block``` ```
- Links: `[text](url)`
- Lists: `- item` or `* item`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` or `Cmd+Enter` | Send message |
| `Tab` | Focus next element |

## Troubleshooting

### Issue: "Failed to connect to API"
- Ensure FastAPI server is running on `http://localhost:8000`
- Check CORS is enabled in `main.py`
- Open browser DevTools (F12) → Console tab to see detailed errors

### Issue: Streaming not working
- Check browser supports Server-Sent Events (all modern browsers)
- Verify `/stream` endpoint returns proper SSE format
- Check browser console for error messages

### Issue: Chat history not persisting
- Enable cookies/localStorage in browser settings
- Check browser storage limit (typically 5-10MB)
- Try clearing browser cache if corrupted

### Issue: Images/styling not loading
- Ensure `public/` folder exists in project root
- Check file paths are correct in `index.html`
- Clear browser cache (Ctrl+Shift+Delete)

## Performance Tips

1. **Reduce chunk size** for more responsive streaming (smaller = more frequent updates)
2. **Increase chunk size** for better performance on slow connections
3. **Clear chat history** periodically to keep localStorage lean
4. **Use modern browsers** (Chrome, Firefox, Safari, Edge) for best performance

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ⚠️ IE11 (not supported)

## Next Steps

1. Customize branding and colors to match your style
2. Add user authentication if needed
3. Integrate with database for persistent chat storage
4. Add file upload capability for documents
5. Implement voice input/output

## Development Notes

- The app uses vanilla JavaScript (no frameworks) for simplicity
- CSS is organized with logical sections
- LocalStorage is used for client-side chat persistence
- All API calls have proper error handling with user feedback

## Support

For issues or feature requests, check:
1. Browser console for error messages (F12 → Console)
2. Network tab to verify API requests (F12 → Network)
3. Application tab to view localStorage (F12 → Application → Local Storage)
