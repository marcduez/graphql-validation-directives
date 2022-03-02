import { makeExecutableSchema } from "@graphql-tools/schema"
import { graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import {
  addValidationToSchema,
  ValidListDirective,
  ValidObjectDirective,
  ValidStringDirective,
} from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"

const validListDirective = new ValidListDirective()
const validObjectDirective = new ValidObjectDirective()
const validStringDirective = new ValidStringDirective()

describe("string directive on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validStringDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validStringDirective.typeDefs,
            gql`
              type Query {
                testQuery(arg: String! @validString(startsWith: "a")): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: "b")
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Value must start with 'a'",
          path: "arg",
        },
      ],
    })
  })
})

describe("string directive on input object field", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validStringDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validStringDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: String! @validString(startsWith: "a")
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field: "b" })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Value must start with 'a'",
          path: "arg.field",
        },
      ],
    })
  })
})

describe("input object directive on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validObjectDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validObjectDirective.typeDefs,
            gql`
              input TestQueryInput {
                field1: String!
                field2: String!
              }

              type Query {
                testQuery(
                  arg: TestQueryInput!
                    @validObject(equalFields: ["field1", "field2"])
                ): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field1: "a", field2: "b" })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Fields field1 and field2 must be equal",
          path: "arg",
        },
      ],
    })
  })
})

describe("input object directive on type", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validObjectDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validObjectDirective.typeDefs,
            gql`
              input TestQueryInput
                @validObject(equalFields: ["field1", "field2"]) {
                field1: String!
                field2: String!
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field1: "a", field2: "b" })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Fields field1 and field2 must be equal",
          path: "arg",
        },
      ],
    })
  })
})

describe("input object directive on argument and type", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validObjectDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validObjectDirective.typeDefs,
            gql`
              input TestQueryInput
                @validObject(nonEqualFields: ["field3", "field4"]) {
                field1: String!
                field2: String!
                field3: String!
                field4: String!
              }

              type Query {
                testQuery(
                  arg: TestQueryInput!
                    @validObject(equalFields: ["field1", "field2"])
                ): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field1: "a", field2: "b", field3: "c", field4: "c" })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Fields field1 and field2 must be equal",
          path: "arg",
        },
        {
          message: "Fields field3 and field4 must not be equal",
          path: "arg",
        },
      ],
    })
  })
})

describe("input object directive on nested type", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validObjectDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validObjectDirective.typeDefs,
            gql`
              input TestQuerySubInput
                @validObject(equalFields: ["field1", "field2"]) {
                field1: String!
                field2: String!
              }

              input TestQueryInput {
                sub: TestQuerySubInput!
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { sub: { field1: "a", field2: "b" } })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Fields field1 and field2 must be equal",
          path: "arg.sub",
        },
      ],
    })
  })
})

describe("string directive on self-referencing nested type field", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validStringDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validStringDirective.typeDefs,
            gql`
              input TestQuerySubInput {
                sub: TestQuerySubInput
                field1: String! @validString(startsWith: "a")
              }

              input TestQueryInput {
                sub: TestQuerySubInput!
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { sub: { sub: { field1: "b" }, field1: "a" } })
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Value must start with 'a'",
          path: "arg.sub.sub.field1",
        },
      ],
    })
  })
})

describe("list directive on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validListDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            gql`
              type Query {
                testQuery(arg: [String!] @validList(minItems: 2)): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

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
})

describe("list directive on input object field", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validListDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: [String!]! @validList(minItems: 2)
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field: ["a"] })
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
          path: "arg.field",
        },
      ],
    })
  })
})

describe("list directive on nested list on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validListDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            gql`
              type Query {
                testQuery(
                  arg: [[String!]] @validList(minItems: 2, listDepth: 1)
                ): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: [["a"], ["b"]])
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
          path: "arg[0]",
        },
        {
          message: "Value must be at least 2 items",
          path: "arg[1]",
        },
      ],
    })
  })
})

describe("list directive on nested list on input object field", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validListDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: [[String!]]! @validList(minItems: 2, listDepth: 1)
              }

              type Query {
                testQuery(arg: TestQueryInput!): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )

    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: { field: [["a"], ["b"]] })
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
          path: "arg.field[0]",
        },
        {
          message: "Value must be at least 2 items",
          path: "arg.field[1]",
        },
      ],
    })
  })
})

describe("list directive on argument and string directive on list items", () => {
  const schema = addValidationToSchema(
    validListDirective.applyDirectiveToSchema(
      validStringDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            validStringDirective.typeDefs,
            gql`
              type Query {
                testQuery(
                  arg: [String!]
                    @validList(minItems: 2)
                    @validString(startsWith: "a")
                ): Boolean!
              }
            `,
          ],
          resolvers: {
            Query: {
              testQuery: () => true,
            },
          },
        })
      )
    )
  )

  it("returns list error when list validation fails", async () => {
    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: ["b"])
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

  it("returns scalar error when list validation passes", async () => {
    const result = await graphql({
      schema,
      source: print(gql`
        query {
          testQuery(arg: ["b", "b"])
        }
      `),
    })

    expect(result.data).toBeNull()
    expect(result.errors).toEqual([new GraphQLError(ERROR_MESSAGE, {})])
    expect((result.errors![0] as GraphQLError).extensions).toEqual({
      code: ERROR_CODE,
      validationErrors: [
        {
          message: "Value must start with 'a'",
          path: "arg[0]",
        },
        {
          message: "Value must start with 'a'",
          path: "arg[1]",
        },
      ],
    })
  })
})
