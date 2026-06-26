import { games } from '../data/games'
import GameCard from '../components/GameCard'

export default function HomePage() {
  return (
    <div className="page-wrapper">
      <header className="site-header">
        <h1 className="site-header__title">Game Library</h1>
        <p className="site-header__sub">A small collection of browser games</p>
      </header>

      <main>
        {games.length === 0 ? (
          <div className="game-grid-empty">
            <p>
              No games yet — add one to <code>src/data/games.ts</code> to get started.
            </p>
          </div>
        ) : (
          <div className="game-grid">
            {games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <a href="/admin">How to add a game</a>
      </footer>
    </div>
  )
}
