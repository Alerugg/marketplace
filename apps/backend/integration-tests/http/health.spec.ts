import { medusaIntegrationTestRunner } from '@medusajs/test-utils'

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe('POST /auth/session', () => {
      it('returns 200 for the backend smoke test', async () => {
        const response = await api.post('/auth/session')
        expect(response.status).toEqual(200)
      })
    })
  }
})
