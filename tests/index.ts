import '../src/@types/fastify'
import { test } from 'tap'
import { join } from 'path'
import { readFileSync } from 'fs'
import Fastify from 'fastify'
import fastifySession from 'fastify-secure-session'

import fastifyFlash from '../src'

const key = readFileSync(join(__dirname, '..', 'secret-key'))

test('should set error message and and clear up after displaying.', async t => {
  t.plan(5)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })

  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    const count = req.flash('error', 'Something went wrong')

    t.equal(count, 1)
    t.equal(Object.keys(req.session.flash).length, 1)
    t.equal(req.session.flash['error'].length, 1)
    const error = reply.flash('error')
    reply.send({ error })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(response.payload, '{"error":["Something went wrong"]}')
  t.equal(response.statusCode, 200)
})

test('should set multiple flash messages.', async t => {
  t.plan(5)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })
  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    req.flash('info', 'Welcome')
    const count = req.flash('info', 'Check out this great new feature')

    t.equal(count, 2)
    t.equal(Object.keys(req.session.flash).length, 1)
    t.equal(req.session.flash['info'].length, 2)
    const info = reply.flash('info')

    reply.send({ info })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(response.payload, '{"info":["Welcome","Check out this great new feature"]}')
  t.equal(response.statusCode, 200)
})

test('should set flash messages in one call.', async t => {
  t.plan(6)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })
  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    const count = req.flash('warning', ['username required', 'password required'])
    t.equal(count, 2)

    const warning = reply.flash('warning')
    t.equal(warning.length, 2)

    t.equal(warning[0], 'username required')
    t.equal(warning[1], 'password required')
    reply.send({ warning })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(response.payload, '{"warning":["username required","password required"]}')
  t.equal(response.statusCode, 200)
})

test('should independently set, get and clear flash messages of multiple types.', async t => {
  t.plan(9)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })
  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    req.flash('info', 'Welcome back')
    req.flash('notice', 'Last login was yesterday')

    t.equal(Object.keys(req.session.flash).length, 2)
    t.equal(req.session.flash.info.length, 1)
    t.equal(req.session.flash.notice.length, 1)

    const info = reply.flash('info')
    t.equal(info.length, 1)
    t.equal(info[0], 'Welcome back')

    const notice = reply.flash('notice')
    t.equal(notice.length, 1)
    t.equal(notice[0], 'Last login was yesterday')

    reply.send({ info, notice })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(response.payload, '{"info":["Welcome back"],"notice":["Last login was yesterday"]}')
  t.equal(response.statusCode, 200)
})

test('should return all messages and clear.', async t => {
  t.plan(5)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })
  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    req.flash('error', 'Database is down')
    req.flash('error', 'Message queue is down')
    req.flash('notice', 'Things are looking bleak')

    const msgs = reply.flash()
    t.equal(Object.keys(msgs).length, 2)
    t.equal(msgs['error'].length, 2)
    t.equal(msgs['notice'].length, 1)

    reply.send({ ...msgs })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(
    response.payload,
    '{"error":["Database is down","Message queue is down"],"notice":["Things are looking bleak"]}',
  )
  t.equal(response.statusCode, 200)
})

test('should format messages.', async t => {
  t.plan(4)
  const fastify = Fastify()

  fastify.register(fastifySession, {
    key,
  })
  fastify.register(fastifyFlash)

  fastify.get('/test', (req, reply) => {
    req.flash('info', 'Hello %s', 'Jared')
    const jared = reply.flash('info')[0]
    t.equal(jared, 'Hello Jared')

    req.flash('info', 'Hello %s %s', 'Jared', 'Hanson')
    const jaredHanson = reply.flash('info')[0]

    t.equal(jaredHanson, 'Hello Jared Hanson')

    reply.send({ jared, jaredHanson })
  })

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  })
  t.equal(response.payload, '{"jared":"Hello Jared","jaredHanson":"Hello Jared Hanson"}')
  t.equal(response.statusCode, 200)
})
