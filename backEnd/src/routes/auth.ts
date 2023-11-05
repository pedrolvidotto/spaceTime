import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import axios from 'axios'
import { prisma } from '../lib/prisma'

const urlEmergencia =
  'https://apimedconsultor.rededor.com.br/v4.0/load/emergencies/'
const urlInternacao =
  'https://apimedconsultor.rededor.com.br/v4.0/load/hospitalizations/'
const headers = {
  Token: 'nohpg96b4tiv8b28j3t2sljc63',
  Cookie: 'f3ca8da00e4bbe47dd5d4dadd1c61e96=4ecb3099da7d5106e0633b95cbfcb919',
}

export async function authRoutes(app: FastifyInstance) {
  app.get('/mc_emergencia', async (req) => {
    const listId = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 61, 101, 141, 142, 143, 144, 161, 162, 163,
      164, 181, 182, 201, 202, 203, 221, 222, 223, 224, 241, 281, 301, 369, 375,
      425, 781, 841, 861, 881, 901, 921, 941, 961, 981, 1001, 1021,
    ]

    const listHopitais = []
    let totalPacientes = 0

    await Promise.all(
      listId.map(async (element) => {
        try {
          const response = await axios.post(urlEmergencia + element, null, {
            headers,
          })
          const responseData = response.data
          totalPacientes +=
            responseData.content.hospital.emergencyHospitalizationList.length
          const obj = {
            Hospital:
              responseData.content.hospital.id +
              ' - ' +
              responseData.content.hospital.name,
            QtdePaciente:
              responseData.content.hospital.emergencyHospitalizationList.length,
            NumeroLinhas: countLines(responseData),
            Tamanho: getFileSize(responseData).toFixed(2) + ' KB',
          }

          listHopitais.push(obj)
        } catch (error) {
          console.error(error)
        }
      }),
    )
    listHopitais.push({ 'Total Pacientes: ': totalPacientes })
    return listHopitais
  })

  app.get('/mc_internacao', async (req) => {
    const listId = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 61, 101, 141, 142, 143, 144, 161, 162, 163,
      164, 181, 182, 201, 202, 203, 221, 222, 223, 224, 241, 281, 301, 369, 375,
      425, 781, 841, 861, 881, 901, 921, 941, 961, 981, 1001, 1021,
    ]

    const listHopitais = []
    let totalPacientes = 0

    await Promise.all(
      listId.map(async (element) => {
        try {
          const response = await axios.post(urlInternacao + element, null, {
            headers,
          })
          const responseData = response.data
          totalPacientes +=
            responseData.content.hospital.hospitalizationList.length
          const obj = {
            Hospital:
              responseData.content.hospital.id +
              ' - ' +
              responseData.content.hospital.name,
            QtdePaciente:
              responseData.content.hospital.hospitalizationList.length,
            NumeroLinhas: countLines(responseData),
            Tamanho: getFileSize(responseData).toFixed(2) + ' KB',
          }

          listHopitais.push(obj)
        } catch (error) {
          console.error(error)
        }
      }),
    )
    listHopitais.push({ 'Total Pacientes: ': totalPacientes })
    return listHopitais
  })

  function countLines(data: any) {
    const jsonString = JSON.stringify(data)
    const lines = jsonString.split(':')
    return lines.length
  }

  function getFileSize(data: any) {
    const jsonString = JSON.stringify(data)
    const fileSizeInBytes = Buffer.byteLength(jsonString, 'utf8')
    return fileSizeInBytes / 1024
  }

  app.post('/register', async (req) => {
    const bodySchema = z.object({
      code: z.string(),
    })
    const { code } = bodySchema.parse(req.body)

    const accessTokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      null,
      {
        params: {
          client_id: process.env.GITHUB_CLIENTE_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        headers: {
          Accept: 'application/json',
        },
      },
    )
    const { access_token } = accessTokenResponse.data
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    })

    const userSchema = z.object({
      id: z.number(),
      login: z.string(),
      name: z.string(),
      avatar_url: z.string().url(),
    })
    const userInfo = userSchema.parse(userResponse.data)
    let user = await prisma.user.findUnique({
      where: {
        githubId: userInfo.id,
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          login: userInfo.login,
          name: userInfo.name,
          avatarUrl: userInfo.avatar_url,
        },
      })
    }
    const token = app.jwt.sign(
      {
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      },
    )
    return {
      token,
    }
  })
}
