import { makeExecutableSchema } from "@graphql-tools/schema"
import { graphql, GraphQLError, print } from "graphql"
import gql from "graphql-tag"
import {
  addValidationToSchema,
  ListValidationDirective,
  ObjectValidationDirective,
  ValidationDirective,
} from "."
import { ERROR_CODE, ERROR_MESSAGE } from "./aggregate-validation-error"

const listValidationDirective = new ListValidationDirective()
const objectValidationDirective = new ObjectValidationDirective()
const validationDirective = new ValidationDirective()

describe("scalar directive on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validationDirective.typeDefs,
            gql`
              type Query {
                testQuery(arg: String! @validation(startsWith: "a")): Boolean!
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

describe("scalar directive on input object field", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      validationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validationDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: String! @validation(startsWith: "a")
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
      objectValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            objectValidationDirective.typeDefs,
            gql`
              input TestQueryInput {
                field1: String!
                field2: String!
              }

              type Query {
                testQuery(
                  arg: TestQueryInput!
                    @objectValidation(equalFields: ["field1", "field2"])
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
      objectValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            objectValidationDirective.typeDefs,
            gql`
              input TestQueryInput
                @objectValidation(equalFields: ["field1", "field2"]) {
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
      objectValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            objectValidationDirective.typeDefs,
            gql`
              input TestQueryInput
                @objectValidation(nonEqualFields: ["field3", "field4"]) {
                field1: String!
                field2: String!
                field3: String!
                field4: String!
              }

              type Query {
                testQuery(
                  arg: TestQueryInput!
                    @objectValidation(equalFields: ["field1", "field2"])
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
      objectValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            objectValidationDirective.typeDefs,
            gql`
              input TestQuerySubInput
                @objectValidation(equalFields: ["field1", "field2"]) {
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

describe("list directive on argument", () => {
  it("returns expected value", async () => {
    const schema = addValidationToSchema(
      listValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            gql`
              type Query {
                testQuery(arg: [String!] @listValidation(minItems: 2)): Boolean!
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
      listValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: [String!]! @listValidation(minItems: 2)
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
      listValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            gql`
              type Query {
                testQuery(
                  arg: [[String!]] @listValidation(minItems: 2, listDepth: 1)
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
      listValidationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            gql`
              input TestQueryInput {
                field: [[String!]]! @listValidation(minItems: 2, listDepth: 1)
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

describe("list directive on argument and scalar directive on list items", () => {
  const schema = addValidationToSchema(
    listValidationDirective.applyDirectiveToSchema(
      validationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            validationDirective.typeDefs,
            gql`
              type Query {
                testQuery(
                  arg: [String!]
                    @listValidation(minItems: 2)
                    @validation(startsWith: "a")
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
