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
  describe("for String, ID value", () => {
    describe("email format", () => {
      const schema = getSchema(
        gql`
          type Query {
            testQuery(arg: String! @validation(format: EMAIL)): Boolean!
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
            testQuery(arg: String! @validation(format: UUID)): Boolean!
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

    describe("regex without flags", () => {
      const schema = getSchema(
        gql`
          type Query {
            testQuery(arg: String! @validation(regex: "^AbCd$")): Boolean!
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
              arg: String! @validation(regex: "^AbCd$", regexFlags: "i")
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
  })

  describe("for Int value", () => {
    describe("multipleOf", () => {
      const schema = getSchema(
        gql`
          type Query {
            testQuery(arg: Int! @validation(multipleOf: 2)): Boolean!
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
              testQuery(arg: 5)
            }
          `),
        })

        expect(result.data).toBeNull()
        expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
        expect((result.errors![0] as GraphQLError).extensions).toEqual({
          code: ERROR_CODE,
          validationErrors: [
            {
              message: "Value must be a multiple of 2",
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
              testQuery(arg: 4)
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
            testQuery(arg: Int! @validation(max: 10)): Boolean!
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
              testQuery(arg: 11)
            }
          `),
        })

        expect(result.data).toBeNull()
        expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
        expect((result.errors![0] as GraphQLError).extensions).toEqual({
          code: ERROR_CODE,
          validationErrors: [
            {
              message: "Value must not be greater than 10",
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
              testQuery(arg: 10)
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
            testQuery(arg: Int! @validation(min: 10)): Boolean!
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
              testQuery(arg: 9)
            }
          `),
        })

        expect(result.data).toBeNull()
        expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
        expect((result.errors![0] as GraphQLError).extensions).toEqual({
          code: ERROR_CODE,
          validationErrors: [
            {
              message: "Value must not be less than 10",
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
              testQuery(arg: 10)
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
            testQuery(arg: Int! @validation(exclusiveMax: 10)): Boolean!
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
              message: "Value must be less than 10",
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
              testQuery(arg: 9)
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
            testQuery(arg: Int! @validation(exclusiveMin: 10)): Boolean!
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
              message: "Value must be greater than 10",
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
              testQuery(arg: 11)
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
            testQuery(arg: Int! @validation(numberOneOf: [1, 2, 3])): Boolean!
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
              testQuery(arg: 4)
            }
          `),
        })

        expect(result.data).toBeNull()
        expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
        expect((result.errors![0] as GraphQLError).extensions).toEqual({
          code: ERROR_CODE,
          validationErrors: [
            {
              message: "Value must be one of 1, 2, 3",
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
              testQuery(arg: 3)
            }
          `),
        })

        expect(result.data).toEqual({ testQuery: true })
        expect(result.errors).toBeUndefined()
      })
    })
  })

  describe("for Float value", () => {
    describe("multipleOf", () => {
      const schema = getSchema(
        gql`
          type Query {
            testQuery(arg: Float! @validation(multipleOf: 2.2)): Boolean!
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
            testQuery(arg: Float! @validation(max: 9.9)): Boolean!
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
            testQuery(arg: Float! @validation(min: 10.1)): Boolean!
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
            testQuery(arg: Float! @validation(exclusiveMax: 9.9)): Boolean!
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
            testQuery(arg: Float! @validation(exclusiveMin: 10.1)): Boolean!
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
            testQuery(
              arg: Float! @validation(numberOneOf: [1.1, 1.2, 1.3])
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
})
