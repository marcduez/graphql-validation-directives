import { makeExecutableSchema } from "@graphql-tools/schema"
import { IResolvers } from "@graphql-tools/utils"
import { DocumentNode, graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import { addValidationToSchema, ValidationDirective } from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"

const validationDirective = new ValidationDirective()

const getSchema = <TContext>(
  typeDefs: DocumentNode,
  resolvers: IResolvers<any, TContext> | IResolvers<any, TContext>[]
) =>
  addValidationToSchema(
    validationDirective.applyDirectiveToSchema(
      makeExecutableSchema({
        typeDefs: [validationDirective.typeDefs, typeDefs],
        resolvers,
      })
    )
  )

describe("ValidationDirective", () => {
  describe("format", () => {
    it.todo("returns expected errors for invalid email format")

    it.todo("returns resolver return value for valid args")
  })

  describe("maxLength", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(arg: String! @validation(maxLength: 5)): Boolean!
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
          testQuery(arg: String! @validation(minLength: 5)): Boolean!
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
          testQuery(arg: String! @validation(startsWith: "abc")): Boolean!
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
          testQuery(arg: String! @validation(endsWith: "bcd")): Boolean!
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
          testQuery(arg: String! @validation(includes: "bcd")): Boolean!
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

  describe("regex", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("stringOneOf", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(
            arg: String! @validation(stringOneOf: ["option1", "option2"])
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

  describe("stringEquals", () => {
    const schema = getSchema(
      gql`
        type Query {
          testQuery(
            arg: String! @validation(stringEquals: "expected")
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
            testQuery(arg: "unexpected")
          }
        `),
      })

      expect(result.data).toBeNull()
      expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
      expect((result.errors![0] as GraphQLError).extensions).toEqual({
        code: ERROR_CODE,
        validationErrors: [
          {
            message: "Value must equal 'expected'",
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
            testQuery(arg: "expected")
          }
        `),
      })

      expect(result.data).toEqual({ testQuery: true })
      expect(result.errors).toBeUndefined()
    })
  })

  describe("multipleOf", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("max", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("min", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("exclusiveMax", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("exclusiveMin", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("numberOneOf", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })

  describe("numberEquals", () => {
    it.todo("returns expected errors for invalid args")

    it.todo("returns resolver return value for valid args")
  })
})
