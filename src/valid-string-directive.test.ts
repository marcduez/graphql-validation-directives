import { makeExecutableSchema } from "@graphql-tools/schema"
import { IResolvers } from "@graphql-tools/utils"
import { DocumentNode, graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import { addValidationToSchema } from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"
import { ValidStringDirective } from "./valid-string-directive"

const directive = new ValidStringDirective()

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

describe("@validString directive", () => {
  describe("email format", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(format: EMAIL)): Boolean!
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be be a valid email",
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
            testQuery(arg: "abcd@host.com")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("UUID format", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(format: UUID)): Boolean!
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be be a valid UUID",
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
            testQuery(arg: "c1acb9be-9929-4e99-b53b-bdea5e2b9c58")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("maxLength", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(maxLength: 5)): Boolean!
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
            testQuery(arg: "abcdef")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be at most 5 characters",
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
            testQuery(arg: "abcde")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("minLength", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(minLength: 5)): Boolean!
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be at least 5 characters",
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
            testQuery(arg: "abcde")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("startsWith", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(startsWith: "abc")): Boolean!
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
            testQuery(arg: "defg")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must start with 'abc'",
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("endsWith", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(endsWith: "bcd")): Boolean!
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
            testQuery(arg: "bcde")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must end with 'bcd'",
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("includes", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(includes: "bcd")): Boolean!
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
            testQuery(arg: "fgh")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must include 'bcd'",
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
            testQuery(arg: "abcde")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("regex without flags", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validString(regex: "^AbCd$")): Boolean!
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
            testQuery(arg: "abc")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must match pattern '^AbCd$'",
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
            testQuery(arg: "AbCd")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("regex with flags", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(
            arg: String! @validString(regex: "^AbCd$", regexFlags: "i")
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
            testQuery(arg: "abc")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must match pattern '^AbCd$' with flags 'i'",
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
            testQuery(arg: "abcd")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("oneOf", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(
            arg: String! @validString(oneOf: ["option1", "option2"])
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
            testQuery(arg: "option3")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must be one of 'option1', 'option2'",
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
            testQuery(arg: "option2")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })
})
