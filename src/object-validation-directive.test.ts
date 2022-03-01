import { makeExecutableSchema } from "@graphql-tools/schema"
import { IResolvers } from "@graphql-tools/utils"
import { DocumentNode, graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import { addValidationToSchema, ObjectValidationDirective } from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"

const objectValidationDirective = new ObjectValidationDirective()

const getSchema = <TContext>(
  typeDefs: DocumentNode,
  resolvers: IResolvers<any, TContext> | IResolvers<any, TContext>[]
) =>
  addValidationToSchema(
    objectValidationDirective.applyDirectiveToSchema(
      makeExecutableSchema({
        typeDefs: [objectValidationDirective.typeDefs, typeDefs],
        resolvers,
      })
    )
  )

describe("ObjectValidationDirective", () => {
  describe("equalFields", () => {
    const schema = getSchema(
      gql`
        input TestQueryInput {
          string1: String!
          string2: String!
        }

        type Query {
          testQuery(
            arg: TestQueryInput!
              @objectValidation(equalFields: ["string1", "string2"])
          ): Boolean!
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
            testQuery(arg: { string1: "a", string2: "b" })
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Fields string1 and string2 must be equal",
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
            testQuery(arg: { string1: "a", string2: "a" })
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("nonEqualFields", () => {
    const schema = getSchema(
      gql`
        input TestQueryInput {
          string1: String!
          string2: String!
          string3: String!
        }

        type Query {
          testQuery(
            arg: TestQueryInput!
              @objectValidation(
                nonEqualFields: ["string1", "string2", "string3"]
              )
          ): Boolean!
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
            testQuery(arg: { string1: "a", string2: "a", string3: "b" })
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Fields string1 and string2 and string3 must not be equal",
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
            testQuery(arg: { string1: "a", string2: "b", string3: "c" })
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })
})
