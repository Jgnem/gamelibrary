import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Game } from '../data/games'

interface Props {
  game: Game
}

export default function GameCard({ game }: Props) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <article className="game-card">
      <div className="game-card__thumb">
        {!imgFailed && (
          <img
            src={game.thumbnail}
            alt={game.title}
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <div className="game-card__body">
        <h2 className="game-card__title">{game.title}</h2>
        <p className="game-card__desc">{game.description}</p>
        <div className="game-card__footer">
          <Link to={`/play/${game.slug}`} className="btn-play">
            Play
          </Link>
        </div>
      </div>
    </article>
  )
}
