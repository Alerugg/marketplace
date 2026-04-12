import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe('Ping', () => {
      it('ping the server session endpoint', async () => {
        const response = await api.post('/auth/session')
        expect(response.status).toEqual(200)
      })
    })
  }
})
