import { makeExecutableSchema } from "@graphql-tools/schema"
import { IResolvers } from "@graphql-tools/utils"
import { DocumentNode, graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import { addValidationToSchema, ListValidationDirective } from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"

const listValidationDirective = new ListValidationDirective()

const getSchema = <TContext>(
  typeDefs: DocumentNode,
  resolvers: IResolvers<any, TContext> | IResolvers<any, TContext>[]
) =>
  addValidationToSchema(
    listValidationDirective.applyDirectiveToSchema(
      makeExecutableSchema({
        typeDefs: [listValidationDirective.typeDefs, typeDefs],
        resolvers,
      })
    )
  )

describe("ListValidationDirective", () => {
  describe("maxItems", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: [String!]! @listValidation(maxItems: 2)): Boolean!
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
            testQuery(arg: ["a", "b", "c"])
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be at most 2 items",
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
            testQuery(arg: ["a", "b"])
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("minItems", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: [String!]! @listValidation(minItems: 2)): Boolean!
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
            testQuery(arg: ["a"])
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be at least 2 items",
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
            testQuery(arg: ["a", "b"])
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("uniqueItems", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })
})
