import { makeExecutableSchema } from "@graphql-tools/schema"
import { IResolvers } from "@graphql-tools/utils"
import { DocumentNode, graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import { addValidationToSchema } from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"
import { ValidFloatDirective } from "./valid-float-directive"

const directive = new ValidFloatDirective()

const getSchema = <TContext>(
  typeDefs: DocumentNode,
  resolvers: IResolvers<any, TContext> | IResolvers<any, TContext>[]
) =>
  addValidationToSchema(
    directive.applyDirectiveToSchema(
      makeExecutableSchema({
        typeDefs: [directive.typeDefs, typeDefs],
        resolvers,
      })
    )
  )

describe("@validInt directive", () => {
  describe("multipleOf", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(multipleOf: 2.2)): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 4.5)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be a multiple of 2.2",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 4.4)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("max", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(max: 9.9)): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 10)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must not be greater than 9.9",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 9.9)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("min", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(min: 10.1)): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 10)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must not be less than 10.1",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 10.1)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("exclusiveMax", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(exclusiveMax: 9.9)): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 9.9)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be less than 9.9",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 9.8)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("exclusiveMin", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(exclusiveMin: 10.1)): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 10.1)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be greater than 10.1",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 10.2)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("numberOneOf", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: Float! @validFloat(oneOf: [1.1, 1.2, 1.3])): Boolean!
        }
      `,
      {
        Query: {
          testQuery: () => true,
        },
      }
    )

    it("returns expected errors for invalid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 1.4)
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be one of 1.1, 1.2, 1.3",
            path: "arg",
          },
        ],
      })
    })

    it("returns resolver return value for valid args", async () => {
      const result = await graphql({
        schema,
        source: print(gql`
          query {
            testQuery(arg: 1.3)
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })
})
