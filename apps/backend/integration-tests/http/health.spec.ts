import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe("GET /health", () => {
      it("returns 200 for the backend smoke test", async () => {
        const response = await api.get("/health")

        expect(response.status).toBe(200)
        expect(response.data).toEqual({
          ok: true,
          service: "backend",
        })
      })
    })
  },
})
