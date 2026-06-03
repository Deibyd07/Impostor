# El Impostor

Juego de thriller psicológico para 3–12 jugadores. Local (pasar el teléfono) y online (sala con código).

## Stack

- React 18 + Vite (cliente)
- Tailwind CSS v3 con tokens CSS del diseño
- Zustand para estado global (con persistencia en localStorage)
- React Router 6
- Framer Motion (animaciones)
- Socket.io (cliente + servidor)
- Node.js + Express (servidor)
- QR code para invitaciones a sala

## Estructura

```
el-impostor/
  client/          # Vite + React (JS)
    src/
      components/  # UI compartida (RoleCard, VoteCard, PlayerChip, ...)
      screens/
        local/     # 9 pantallas modo local
        online/    # 9 pantallas modo online
      store/       # Zustand (gameStore + onlineStore)
      hooks/       # useTimer, useLocalStorage
      utils/       # roleAssigner, gameLogic, random
      data/        # wordBank, relatedWords
      styles/      # tokens.css + index.css
  server/          # Node + Express + Socket.io
    index.js
    wordBank.js
```

## Cómo correr

```bash
# raíz
npm install              # instala npm-run-all
# luego, en cada subcarpeta
cd client && npm install
cd ../server && npm install

# desarrollo (paralelo)
cd .. && npm run dev
# o por separado
npm --prefix server run dev   # http://localhost:3001
npm --prefix client run dev   # http://localhost:5173
```

Variables de entorno:

- `client/.env`: `VITE_SERVER_URL=http://localhost:3001`
- `server/.env`: `PORT=3001`

## Modos de juego

- **Clásico**: los impostores no conocen la palabra.
- **Con pista**: los impostores ven una pista (categoría, letra inicial, nº de letras, vaga, custom).
- **Ciego**: los impostores ven una palabra FALSA relacionada (intensidad cercana/media/lejana). Su carta es visualmente idéntica a la de ciudadano.

## Condiciones de victoria

- Ciudadanos: eliminan a todos los impostores.
- Impostores: quedan tantos impostores como ciudadanos activos, o adivinan la palabra (modo clásico).

## Online — eventos clave

Cliente → servidor: `room:create`, `room:join`, `room:startGame`, `vote:cast`, `game:cardReady`, `game:goToVote`, `game:newRound`, `game:guessWord`, `room:leave`, `room:updateConfig`.

Servidor → cliente: `room:created`, `room:joined`, `room:players`, `room:config`, `room:error`, `game:started`, `game:yourRole`, `game:phase`, `vote:update`, `game:eliminated`, `game:newRound`, `game:over`, `game:tie`.

**Seguridad**: el servidor jamás envía los roles del resto. Cada socket recibe únicamente su rol y su palabra (o pista) vía `game:yourRole`.

## Deploy

- Servidor: Railway / Render / Fly.io. Setear `PORT`.
- Cliente: Vercel / Netlify. Setear `VITE_SERVER_URL` apuntando al servidor.
