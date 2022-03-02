# graphql-validation-directives

Schema for adding input validation to GraphQL services, using schema directives. Under the hood, this library:

1. Uses the schema visitor logic to copy directive metadata into the extension methods of input objects, input object fields, and field arguments.
2. Marks any input objects that have nested fields with validation extensions as needing validation.
3. Wraps the resolver functions of all fields with validated arguments in a function that first tries to run validation on all arguments.

If any validation function throws, the contents are returned as validation errors, and the wrapped resolver is not run.

## General usage

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  ValidListDirective,
  ValidObjectDirective,
  ValidStringDirective,
} from "@marcduez/graphql-validation-directives"

const validListDirective = new ValidListDirective()
const validObjectDirective = new ValidObjectDirective()
const validStringDirective = new ValidStringDirective()

const executableSchema = addValidationToSchema(
  validListDirective.applyDirectiveToSchema(
    validObjectDirective.applyDirectiveToSchema(
      validStringDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            validListDirective.typeDefs,
            validObjectDirective.typeDefs,
            validStringDirective.typeDefs,
            gql`
              input Mutation1Input
                @validObject(equalFields: ["string1", "string2"]) {
                list: [[String!]]
                  @validList(maxItems: 2, listDepth: 0)
                  @validList(uniqueItems: true, listDepth: 1)
                  @validString(startsWith: "abc")
                string1: String!
                string2: String!
              }

              type Mutation {
                mutation1(input: Mutation1Input!): Boolean!
                mutation2(
                  input: String! @validString(maxLength: 255, startsWith: "xyz")
                ): Boolean!
              }
            `,
          ],
          resolvers: [
            {
              Query: {
                mutation1: () => true,
                mutation2: () => true,
              },
            },
          ],
        })
      )
    )
  )
)
```

### List Depth

GraphQL allows us to define lists-of-lists. In order to validate the right level of nesting, validators with list target can implement a `getListDepth()` method. Other validation targets ignore the list depth value. The value is evaluated so that 0 is the top-most list, 1 is the list at 1 level of nesting, 2 is the list at 2 levels of nesting, and so on.

### Null values

Null and undefined values are not validated. Use conventional GraphQL type hints (e.g. the exclamation point) to enforce nullability.

### Custom directive names

If the default names of the directives collide with something in your own schema, they can be instantiated with a custom name.

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  ValidStringDirective,
} from "@marcduez/graphql-validation-directives"

const validStringDirective = new ValidStringDirective("customDirectiveName")

const executableSchema = addValidationToSchema(
  validStringDirective.applyDirectiveToSchema(
    makeExecutableSchema({
      typeDefs: [
        validStringDirective.typeDefs,
        gql`
          type Mutation {
            mutation1(
              input: String!
                @customDirectiveName(maxLength: 255, startsWith: "xyz")
            ): Boolean!
          }
        `,
      ],
      resolvers: [
        {
          Query: {
            mutation1: () => true,
          },
        },
      ],
    })
  )
)
```

## Built-in directives

### @validString directive

**format**

Validates that a string matches a format. Currently allowed values are `EMAIL` and `UUID`.

```gql
input Mutation1Input {
  field: String! @validString(format: EMAIL)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(format: EMAIL)): Boolean!
}
```

**maxLength**

The maximum allowed length of a string, inclusive.

```gql
input Mutation1Input {
  field: String! @validString(maxLength: 255)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(maxLength: 255)): Boolean!
}
```

**minLength**

The minimum allowed length of a string, inclusive.

```gql
input Mutation1Input {
  field: String! @validString(minLength: 8)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(minLength: 8)): Boolean!
}
```

**startsWith**

A string that must match the start of the provided value.

```gql
input Mutation1Input {
  field: String! @validString(startsWith: "account-")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(startsWith: "account-")): Boolean!
}
```

**endsWith**

A string that must match the end of the provided value.

```gql
input Mutation1Input {
  field: String! @validString(startsWith: "-cad")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(startsWith: "-cad")): Boolean!
}
```

**includes**

A string that must appear somewhere in the provided value.

```gql
input Mutation1Input {
  field: String! @validString(contains: "-rrsp-")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(contains: "-rrsp-")): Boolean!
}
```

**regex and regexFlags**

A regular expression (and optionally flags) that must match the provided value.

```gql
input Mutation1Input {
  field: String! @validString(regex: "^[a-z0-9]$", regexFlags: "i")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(regex: "^[a-z0-9]$", regexFlags: "i")): Boolean!
}
```

**oneOf**

A collection of strings that the provided value must be one of.

```gql
input Mutation1Input {
  field: String! @validString(stringOneOf: ["tfsa", "rrsp", "individual"])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(stringOneOf: ["tfsa", "rrsp", "individual"])): Boolean!
}
```

### @validInt directive

**multipleOf**

A number that must go into the provided value without remainder.

```gql
input Mutation1Input {
  field: Int! @validInt(multipleOf: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(multipleOf: 2)): Boolean!
}
```

**max**

A number that the provided value must be less than or equal to.

```gql
input Mutation1Input {
  field: Int! @validInt(max: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(max: 2)): Boolean!
}
```

**min**

A number that the provided value must be greater than or equal to.

```gql
input Mutation1Input {
  field: Int! @validInt(min: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(min: 2)): Boolean!
}
```

**exclusiveMax**

A number that the provided value must be less than.

```gql
input Mutation1Input {
  field: Int! @validInt(exclusiveMax: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(exclusiveMax: 2)): Boolean!
}
```

**exclusiveMin**

A number that the provided value must be greater than.

```gql
input Mutation1Input {
  field: Int! @validInt(exclusiveMin: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(exclusiveMin: 2.2)): Boolean!
}
```

**oneOf**

A collection of numbers that the provided value must be one of.

```gql
input Mutation1Input {
  field: Int! @validInt(numberOneOf: [2, 3, 4])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(numberOneOf: [2, 3, 4])): Boolean!
}
```

### @validFloat directive

**multipleOf**

A number that must go into the provided value without remainder.

```gql
input Mutation1Input {
  field: Float! @validFloat(multipleOf: 2.2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(multipleOf: 2.2)): Boolean!
}
```

**max**

A number that the provided value must be less than or equal to.

```gql
input Mutation1Input {
  field: Float! @validFloat(max: 2.2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(max: 2.2)): Boolean!
}
```

**min**

A number that the provided value must be greater than or equal to.

```gql
input Mutation1Input {
  field: Float! @validFloat(min: 2.2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(min: 2.2)): Boolean!
}
```

**exclusiveMax**

A number that the provided value must be less than.

```gql
input Mutation1Input {
  field: Float! @validFloat(exclusiveMax: 2.2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(exclusiveMax: 2.2)): Boolean!
}
```

**exclusiveMin**

A number that the provided value must be greater than.

```gql
input Mutation1Input {
  field: Float! @validFloat(exclusiveMin: 2.2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(exclusiveMin: 2.2)): Boolean!
}
```

**oneOf**

A collection of numbers that the provided value must be one of.

```gql
input Mutation1Input {
  field: Float! @validFloat(numberOneOf: [2.1, 2.2, 2.3])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(numberOneOf: [2.1, 2.2, 2.3])): Boolean!
}
```

### @validList directive

**maxItems**

The maximum allowed number of items in a list.

```gql
input Mutation1Input {
  field: [String!]! @validList(maxItems: 5)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @validList(maxItems: 5)): Boolean!
}
```

**minItems**

The minimum allowed number of items in a list.

```gql
input Mutation1Input {
  field: [String!]! @validList(minItems: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @validList(minItems: 2)): Boolean!
}
```

**uniqueItems**

Whether all items in a list must be unique.

```gql
input Mutation1Input {
  field: [String!]! @validList(uniqueItems: true)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @validList(uniqueItems: true)): Boolean!
}
```

**listDepth**

Used to identify the depth at which a list validator applies. The top list is depth 0 (the default if not specified), the first nested list is depth 1, the second nested list is depth 2, and so on.

```gql
input Mutation1Input {
  field: [[String!]!]! @validList(maxItems: 3) @validList(maxItems: 2, listDepth: 1)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [[String!]!]! @validList(maxItems: 3) @validList(maxItems: 2, listDepth: 1)): Boolean!
}
```

### @validObject directive

**equalFields**

A collection of field names that must have equal values.

```gql
input Mutation1Input @validObject(equalFields: ["password", "confirmPassword"]) {
  password: String!
  confirmPassword: String!
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

input Mutation1Input {
  password: String!
  confirmPassword: String!
}

type Mutation {
  someMutation(arg: Mutation1Input! @validObject(equalFields: ["password", "confirmPassword"])): Boolean!
}
```

**nonEqualFields**

A collection of field names that must have distinct values.

```gql
input Mutation1Input @validObject(nonEqualFields: ["securityAnswer1", "securityAnswer2"]) {
  securityAnswer1: String!
  securityAnswer2: String!
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

input Mutation1Input {
  securityAnswer1: String!
  securityAnswer2: String!
}

type Mutation {
  someMutation(arg: Mutation1Input! @validObject(nonEqualFields: ["securityAnswer1", "securityAnswer2"])): Boolean!
}
```

## Writing custom directives

Here's an example of a custom validation directive that checks whether a string is a valid timezone name.

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  BaseValidationDirective,
} from "@marcduez/graphql-validation-directives"
import { gql } from "graphql-tag"
import { getTimezone } from "countries-and-timezones"

class ValidTimezoneDirective extends BaseValidationDirective {
  constructor(name = "validTimezone") {
    super(name)
  }

  get typeDefs() {
    return gql(`
      directive @${this.name} on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `)
  }

  validate(_directiveConfig: Record<string, any>, value: any) {
    if (!getTimezone(value)) {
      throw new Error("Value must be a valid timezone")
    }
  }
}

const validTimezoneDirective = new ValidTimezoneDirective()

const executableSchema = addValidationToSchema(
  validTimezoneDirective.applyDirectiveToSchema(
    makeExecutableSchema({
      typeDefs: [
        validTimezoneDirective.typeDefs,
        gql`
          type Mutation {
            mutation1(input: String! @validTimezone): Boolean!
          }
        `,
      ],
      resolvers: [
        {
          Query: {
            mutation1: () => true,
          },
        },
      ],
    })
  )
)
```
