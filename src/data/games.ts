export interface Game {
  title: string
  slug: string
  description: string
  thumbnail: string
  url: string
}

export const games: Game[] = [
  {
    title: 'Ndege',
    slug: 'ndege',
    description: 'A fast HTML5 savanna bird game.',
    thumbnail: '/thumbnails/ndege.png',
    url: '/games/ndege/index.html',
  },

  // ── Add more games below ──────────────────────────────────────────────────
  //
  // {
  //   title: 'My Game',
  //   slug: 'my-game',
  //   description: 'A short description of the game.',
  //   thumbnail: '/thumbnails/my-game.png',
  //   url: '/games/my-game/index.html',
  // },
]
