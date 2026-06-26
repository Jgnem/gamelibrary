import { Link } from 'react-router-dom'

export default function AdminPage() {
  return (
    <main className="admin-page">
      <Link to="/" className="btn-back">
        ← Library
      </Link>

      <div>
        <h1>Adding a New Game</h1>
        <p className="admin-intro">
          This site has no backend or admin panel. To publish a new game, add
          the files to the repo and push — Vercel redeploys automatically.
        </p>
      </div>

      <div>
        <p className="admin-section-label">Steps</p>
        <ol className="steps-list">
          <li>
            <span className="step-num">1</span>
            <span>
              Add the game folder to{' '}
              <code>public/games/[slug]/</code>
            </span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span>
              Make sure the game has <code>index.html</code> in that folder
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span>
              Add a thumbnail to <code>public/thumbnails/[slug].png</code>
            </span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span>
              Add the game entry to <code>src/data/games.ts</code>
            </span>
          </li>
          <li>
            <span className="step-num">5</span>
            <span>Commit and push to GitHub</span>
          </li>
          <li>
            <span className="step-num">6</span>
            <span>Vercel will redeploy automatically</span>
          </li>
        </ol>
      </div>

      <div>
        <p className="admin-section-label">Folder structure</p>
        <pre>{`public/
├── games/
│   └── my-game/
│       ├── index.html
│       ├── game.js
│       ├── style.css
│       └── assets/
└── thumbnails/
    └── my-game.png`}</pre>
      </div>

      <div>
        <p className="admin-section-label">Example entry in games.ts</p>
        <pre>{`{
  title: "My Game",
  slug: "my-game",
  description: "A short description of the game.",
  thumbnail: "/thumbnails/my-game.png",
  url: "/games/my-game/index.html",
},`}</pre>
      </div>
    </main>
  )
}
