import 'dotenv/config'
import fastify from 'fastify'
import cors from '@fastify/cors'
import { memoriesRoutes } from './routes/memories'
import { authRoutes } from './routes/auth'
import jwt from '@fastify/jwt'
import { uploadRoutes } from './routes/upload'
import path from 'node:path'
import multipart from '@fastify/multipart'

const app = fastify()

app.register(multipart)

app.register(require('@fastify/static'), {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads',
})

app.register(cors, {
  origin: true, // todas as url vão acessar, casso seja em prod é bom passar somente array de url validas
})

app.register(jwt, {
  secret: '3std0Sp4c3T1me',
})

app.register(authRoutes)
app.register(uploadRoutes)
app.register(memoriesRoutes)

app
  .listen({
    port: 3333,
    host: '0.0.0.0', // para funcionar no mobile preciso add essa info
  })
  .then(() => {
    console.log('listening http://localhost:3333')
  })
