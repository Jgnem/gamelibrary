# NDEGE static game

Place this folder in a Vercel static library at:

```text
public/
  games/
    ndege/
      index.html
      README.md
      assets/
      src/
```

The game is fully static and does not require a backend, filesystem access, or
localhost-only services. It is intended to be served at:

```text
/games/ndege/index.html
```

For a library route such as `/play/ndege`, render an iframe that points at the
static game entry:

```html
<iframe src="/games/ndege/index.html" title="NDEGE"></iframe>
```

All runtime references must remain relative to this folder, for example:

```text
./src/main.js
./assets/birds/bird-flight-6x6.png
```

Do not change runtime references to root-relative paths such as `/assets/...`,
localhost URLs, or local `C:/...` file paths.
