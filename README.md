# Pixel Snakes & Ladders

A modern, pixel-art take on the classic Snakes & Ladders game, featuring a dynamic Quiz System and animated spritesheet dice.

## 🚀 How to Run

### Option 1: Using Docker (Recommended)
This approach bypasses browser CORS restrictions and ensures `questions.json` loads correctly.

1. **Build the image**:
   ```bash
   docker build -t pixel-game .
   ```
2. **Run the container**:
   ```bash
   docker run -p 8080:80 pixel-game
   ```
3. **Play**: Open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Local Web Server
If you have Node.js, Python, or a VS Code extension like "Live Server":
- **Python**: `python3 -m http.server 8080`
- **Node/npx**: `npx serve`
- Then open `http://localhost:8080`.

---

## ❓ Customizing the Quiz

The quiz questions are stored in two places to ensure the game works in all environments.

### 1. Primary Source: `assets/questions.json`
Edit this file to add or change questions. Any changes here will reflect immediately if running via Docker or a local server.

**Format:**
```json
{
  "id": 21,
  "kategori": "Biologi",
  "pertanyaan": "Hewan apakah ini?",
  "kunci_jawaban": "Singa (Lion)",
  "img": "assets/textures/quiz/lion.jpg",
  "duration": 15
}
```
- `img` (Optional): Path to an image asset.
- `duration` (Optional): Time limit in seconds (Defaults to 10s if omitted).

### 2. Fallback Source: `assets/questions-data.js`
This file is used if the browser blocks the JSON fetch (e.g., when opening `index.html` directly from the file explorer). 

**Important:** If you want your changes to work everywhere, make sure to mirror your JSON changes into the `FALLBACK_QUESTIONS` array in this file.

---

## 🎨 Asset Structure
- `assets/textures/games/`: Board, Lucky Blocks, UI elements.
- `assets/textures/avatars/`: Player tokens (1-4).
- `assets/textures/dice/`: Animation spritesheet and individual faces.
- `assets/textures/quiz/`: Images used in questions.
