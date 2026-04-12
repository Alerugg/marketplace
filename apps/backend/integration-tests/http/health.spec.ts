import { medusaIntegrationTestRunner } from '@medusajs/test-utils'
import { createApiKeysWorkflow } from '@medusajs/medusa/core-flows'

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    let publishableKey: string

    beforeAll(async () => {
      const { result } = await createApiKeysWorkflow(getContainer()).run({
        input: {
          api_keys: [
            {
              title: 'Integration Test Key',
              type: 'publishable',
              created_by: ''
            }
          ]
        }
      })

      publishableKey = result[0].token
    })

    describe('GET /store/regions', () => {
      it('returns 200 for the backend smoke test', async () => {
        const response = await api.get('/store/regions', {
          headers: {
            'x-publishable-api-key': publishableKey
          }
        })

        expect(response.status).toEqual(200)
      })
    })
  }
})
