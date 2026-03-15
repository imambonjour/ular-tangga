/**
 * Quiz Data Fallback
 * This file is used if the browser blocks loading questions.json (CORS/file protocol).
 * You can also use this as an easy way to edit questions without needing a server.
 */
const FALLBACK_QUESTIONS = [
    { id: 21, kategori: "Biologi", pertanyaan: "Questions.json_ERROR or try running on server", kunci_jawaban: "Singa (Lion)", "img": "assets/textures/quiz/lion.jpg", "duration": 15 }
];
