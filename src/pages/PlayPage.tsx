import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { games } from '../data/games'

export default function PlayPage() {
  const { slug } = useParams<{ slug: string }>()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const game = games.find((g) => g.slug === slug)

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen?.()
  }

  if (!game) {
    return (
      <div className="not-found">
        <h1>Game not found</h1>
        <p>No game with the slug &ldquo;{slug}&rdquo; exists in the library.</p>
        <Link to="/" className="btn-back">
          ← Back to Library
        </Link>
      </div>
    )
  }

  return (
    <div className="play-layout">
      <div className="play-bar">
        <Link to="/" className="btn-back">
          ← Library
        </Link>
        <span className="play-bar__title">{game.title}</span>
        <button className="btn-fullscreen" onClick={handleFullscreen}>
          Fullscreen
        </button>
      </div>
      <div className="game-frame-wrap">
        <iframe
          ref={iframeRef}
          src={game.url}
          title={game.title}
          allowFullScreen
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
