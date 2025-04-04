import { BunWebSockets } from '@colyseus/bun-websockets'
import { monitor } from '@colyseus/monitor'
import { playground } from '@colyseus/playground'
import config from '@colyseus/tools'
import { LobbyRoom } from 'colyseus'
import basicAuth from 'express-basic-auth'

/**
 * Import your Room files
 */
import { GameRoom } from './rooms/GameRoom.ts'

const basicAuthMiddleware = basicAuth({
  // list of users and passwords
  users: {
    admin: 'admin',
  },
  // sends WWW-Authenticate header, which will prompt the user to fill
  // credentials in
  challenge: true,
})

export default config({
  options: {
    devMode: Bun.env.NODE_ENV !== 'production',
  },

  initializeTransport: function () {
    return new BunWebSockets({})
  },

  initializeGameServer: (gameServer) => {
    /**
     * Define your room handlers:
     */
    gameServer.define('lobby', LobbyRoom)

    gameServer.define('game', GameRoom).enableRealtimeListing()
  },

  initializeExpress: (app) => {
    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== 'production') {
      app.use('/', playground())
    }

    /**
     * Health check route
     */
    app.get('/health', async (_, res) => {
      res.send('OK')
    })

    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    app.use('/monitor', basicAuthMiddleware, monitor())
  },
})
