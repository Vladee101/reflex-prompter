<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <div align="center">
        <h1>ReFlex Prompter</h1>
        <p><strong>Your Digital Assistant for Direct Method & TPR Language Teaching</strong><br>
        <em>Stop teaching with slides. Start building language reflexes.</em></p>
    </div>

  <div align="center">
        <p>
            <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform">
            <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
            <img src="https://img.shields.io/badge/Built_with-Tauri_%2B_React-purple" alt="Built with">
        </p>
    </div>

  <h2>🎯 What is ReFlex?</h2>
    <p>ReFlex Prompter is a specialized desktop application designed for language teachers who use Total Physical Response (TPR) and Direct Method methodologies. It turns your computer into a professional teaching tool that displays large, clear prompts during online or in-person classes—perfect for ESL instruction, pronunciation drills, and pattern practice.</p>
    <p>The name ReFlex represents the dual purpose:</p>
    <ul>
        <li><strong>Reflex:</strong> The automatic, intuitive language response you build in students</li>
        <li><strong>ReFlex:</strong> The tool that helps you create those reflexes through structured visual prompts</li>
    </ul>

  <h2>✨ Key Features</h2>
    <ul>
        <li>🖥️ <strong>Full-Screen Presentation Mode:</strong> Large, clear text optimized for projectors and screen sharing</li>
        <li>⌨️ <strong>Single-Key Control:</strong> Navigate slides with SPACEBAR or arrow keys—keep your focus on teaching</li>
        <li>📝 <strong>Quick Lesson Creation:</strong> Build lesson plans with concise prompts (50-character limit for clarity)</li>
        <li>🗂️ <strong>Word Stock Sidebar:</strong> Automatically collects all unique phrases from your lesson for review</li>
        <li>💾 <strong>Local Storage:</strong> All lessons saved locally—no accounts, no subscriptions</li>
        <li>📤 <strong>Import/Export:</strong> Backup lessons or share them with colleagues</li>
        <li>🎯 <strong>Methodology-Focused:</strong> Designed specifically for TPR commands and Direct Method pattern drills</li>
        <li>🔒 <strong>Works Offline:</strong> No internet required during lessons</li>
    </ul>

  <h2>🚀 Quick Start</h2>
    
  <h3>Download & Install</h3>
    <ol>
        <li>Download the latest release for your operating system:
            <ul>
                <li>Windows (.msi installer)</li>
                <li>macOS (.dmg disk image)</li>
                <li>Linux: Coming soon</li>
            </ul>
        </li>
        <li>Install using the standard installer for your platform</li>
        <li>Launch ReFlex Prompter and start creating your first lesson</li>
    </ol>

  <h3>First Lesson in 60 Seconds</h3>
    <ol>
        <li>Click "Create New Lesson"</li>
        <li>Add your first slide: Type "Stand up" (for TPR practice)</li>
        <li>Add another: Type "I am standing" (for Direct Method pattern)</li>
        <li>Click "Save & Exit", name your lesson "Basic Commands"</li>
        <li>Click "Start Class" and press SPACEBAR to advance through slides</li>
    </ol>

  <h2>🧑‍🏫 Perfect for These Teaching Scenarios</h2>
    
  <h3>TPR (Total Physical Response) Lessons</h3>
    <pre>
Slide 1: "Touch your nose"
Slide 2: "Stand up"
Slide 3: "Walk to the door"
Slide 4: "Point to something blue"
    </pre>

  <h3>Direct Method Pattern Drills</h3>
    <pre>
Slide 1: "I am a teacher"
Slide 2: "You are a student"
Slide 3: "He is a doctor"
Slide 4: "We are learners"
    </pre>

  <h3>Combined Approach</h3>
    <pre>
Slide 1: "I am walking" (teacher models)
Slide 2: "You are walking" (students imitate)
Slide 3: "Walk to the window" (TPR command)
Slide 4: "I am opening" (action + description)
    </pre>

  <h2>⌨️ Keyboard Shortcuts</h2>
    <table border="1" cellpadding="5" cellspacing="0">
        <tr>
            <th>Action</th>
            <th>Key</th>
        </tr>
        <tr>
            <td>Next Slide</td>
            <td>SPACEBAR, ENTER, or RIGHT ARROW</td>
        </tr>
        <tr>
            <td>Previous Slide</td>
            <td>LEFT ARROW</td>
        </tr>
        <tr>
            <td>Toggle Fullscreen</td>
            <td>F11</td>
        </tr>
        <tr>
            <td>Exit Presentation</td>
            <td>ESC</td>
        </tr>
    </table>

  <h2>🏫 For Language Schools & Institutions</h2>
    <p>ReFlex Prompter is ideal for:</p>
    <ul>
        <li>Online language schools using Zoom, Google Meet, or Microsoft Teams</li>
        <li>Teacher training programs focusing on communicative methodologies</li>
        <li>Classroom environments with projectors or large displays</li>
        <li>Curriculum standardization across teaching staff</li>
    </ul>
    <p>Interested in a site license or pilot program for your school? Contact us to discuss institutional pricing and deployment.</p>

  <h2>🛠️ For Developers</h2>
    
   <h3>Build from Source</h3>
    <pre>
# Clone the repository
git clone https://github.com/Vladee101/reflex-prompter.git
cd reflex-prompter

# Install dependencies
npm install

# Start development mode
npm run tauri dev

# Build for production
npm run tauri build
    </pre>

   <h3>Tech Stack</h3>
    <ul>
        <li>Frontend: React + Vite + Tailwind CSS</li>
        <li>Desktop Framework: Tauri (Rust)</li>
        <li>Icons: Lucide React</li>
        <li>Build System: GitHub Actions (multi-platform)</li>
    </ul>

  <h3>Project Structure</h3>
    <pre>
reflex-prompter/
├── src/                    # React frontend
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Entry point
│   └── styles.css         # Global styles
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/                # Static assets
└── .github/workflows/     # CI/CD automation
    </pre>

  <h2>📖 Pedagogical Background</h2>
    <p>ReFlex is built on proven language acquisition principles:</p>
    
  <h3>Total Physical Response (TPR)</h3>
    <ul>
        <li>Language learning through physical movement</li>
        <li>Comprehension before production</li>
        <li>Reduces learner anxiety through action-based learning</li>
    </ul>
    
  <h3>Direct Method</h3>
    <ul>
        <li>Target-language only instruction</li>
        <li>Pattern recognition over explicit grammar rules</li>
        <li>Develops intuitive language sense rather than translation habits</li>
    </ul>

  <h2>🤝 Contributing</h2>
    <p>We welcome contributions! Please see our Contributing Guidelines for details.</p>
    <ol>
        <li>Fork the repository</li>
        <li>Create a feature branch (<code>git checkout -b feature/amazing-feature</code>)</li>
        <li>Commit your changes (<code>git commit -m 'Add some amazing feature'</code>)</li>
        <li>Push to the branch (<code>git push origin feature/amazing-feature</code>)</li>
        <li>Open a Pull Request</li>
    </ol>

  <h2>📄 License</h2>
    <p>This project is licensed under the MIT License - see the LICENSE file for details.</p>

  <h2>👥 Contact & Support</h2>
    <ul>
        <li>Issues: For bug reports and feature requests, please use GitHub Issues</li>
        <li>Website: t.me/reflexESL</li>
    </ul>

  <div align="center">
        <p><em>Built with ❤️ for language teachers everywhere</em><br>
        <sub>Because great teaching tools should empower, not complicate.</sub></p>
    </div>
</body>
</html>
