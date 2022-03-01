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
  ListValidationDirective,
  ObjectValidationDirective,
  ValidationDirective,
} from "@marcduez/graphql-validation-directives"

const listValidationDirective = new ListValidationDirective()
const objectValidationDirective = new ObjectValidationDirective()
const validationDirective = new ValidationDirective()

const executableSchema = addValidationToSchema(
  listValidationDirective.applyDirectiveToSchema(
    objectValidationDirective.applyDirectiveToSchema(
      validationDirective.applyDirectiveToSchema(
        makeExecutableSchema({
          typeDefs: [
            listValidationDirective.typeDefs,
            objectValidationDirective.typeDefs,
            validationDirective.typeDefs,
            gql`
              input Mutation1Input
                @objectValidation(equalFields: ["string1", "string2"]) {
                list: [[String!]]
                  @listValidation(maxItems: 2, listDepth: 0)
                  @listValidation(uniqueItems: true, listDepth: 1)
                  @validation(startsWith: "abc")
                string1: String!
                string2: String!
              }

              type Mutation {
                mutation1(input: Mutation1Input!): Boolean!
                mutation2(
                  input: String! @validation(maxLength: 255, startsWith: "xyz")
                ): Boolean!
              }
            `,
          ],
          resolvers: [
            // ...your resolvers here
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

## Built-in directives

### Validation directive

**format**

Validates that a string matches a format. Currently allowed values are `EMAIL` and `UUID`.

```gql
input Mutation1Input {
  field: String! @validation(format: EMAIL)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(format: EMAIL)): Boolean!
}
```

**maxLength**

The maximum allowed length of a string, inclusive.

```gql
input Mutation1Input {
  field: String! @validation(maxLength: 255)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(maxLength: 255)): Boolean!
}
```

**minLength**

The minimum allowed length of a string, inclusive.

```gql
input Mutation1Input {
  field: String! @validation(minLength: 8)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(minLength: 8)): Boolean!
}
```

**startsWith**

A string that must match the start of the provided value.

```gql
input Mutation1Input {
  field: String! @validation(startsWith: "account-")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(startsWith: "account-")): Boolean!
}
```

**endsWith**

A string that must match the end of the provided value.

```gql
input Mutation1Input {
  field: String! @validation(startsWith: "-cad")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(startsWith: "-cad")): Boolean!
}
```

**includes**

A string that must appear somewhere in the provided value.

```gql
input Mutation1Input {
  field: String! @validation(contains: "-rrsp-")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(contains: "-rrsp-")): Boolean!
}
```

**regex and regexFlags**

A regular expression (and optionally flags) that must match the provided value.

```gql
input Mutation1Input {
  field: String! @validation(regex: "^[a-z0-9]$", regexFlags: "i")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(regex: "^[a-z0-9]$", regexFlags: "i")): Boolean!
}
```

**stringOneOf**

A collection of strings that the provided value must be one of.

```gql
input Mutation1Input {
  field: String! @validation(stringOneOf: ["tfsa", "rrsp", "individual"])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validation(stringOneOf: ["tfsa", "rrsp", "individual"])): Boolean!
}
```

**multipleOf**

A number that must go into the provided value without remainder. Rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(multipleOf: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(multipleOf: 2.2)): Boolean!
}
```

**max**

A number that the provided value must be less than or equal to. Rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(max: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(max: 2.2)): Boolean!
}
```

**min**

A number that the provided value must be greater than or equal to. Rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(min: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(min: 2.2)): Boolean!
}
```

**exclusiveMax**

A number that the provided value must be less than. Rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(exclusiveMax: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(exclusiveMax: 2.2)): Boolean!
}
```

**exclusiveMin**

A number that the provided value must be greater than. Rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(exclusiveMin: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(exclusiveMin: 2.2)): Boolean!
}
```

**numberOneOf**

A collection of numbers that the provided value must be one of. Items are rounded to the nearest integer when value is an integer.

```gql
input Mutation1Input {
  field: Int! @validation(numberOneOf: [2, 3, 4])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validation(numberOneOf: [2.1, 2.2, 2.3])): Boolean!
}
```

### List validation directive

**maxItems**

The maximum allowed number of items in a list.

```gql
input Mutation1Input {
  field: [String!]! @listValidation(maxItems: 5)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @listValidation(maxItems: 5)): Boolean!
}
```

**minItems**

The minimum allowed number of items in a list.

```gql
input Mutation1Input {
  field: [String!]! @listValidation(minItems: 2)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @listValidation(minItems: 2)): Boolean!
}
```

**uniqueItems**

Whether all items in a list must be unique.

```gql
input Mutation1Input {
  field: [String!]! @listValidation(uniqueItems: true)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [String!]! @listValidation(uniqueItems: true)): Boolean!
}
```

**listDepth**

Used to identify the depth at which a list validator applies. The top list is depth 0 (the default if not specified), the first nested list is depth 1, the second nested list is depth 2, and so on.

```gql
input Mutation1Input {
  field: [[String!]!]! @listValidation(maxItems: 3) @listValidation(maxItems: 2, listDepth: 1)
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: [[String!]!]! @listValidation(maxItems: 3) @listValidation(maxItems: 2, listDepth: 1)): Boolean!
}
```

### Object validation directive

**equalFields**

A collection of field names that must have equal values.

```gql
input Mutation1Input @objectValidation(equalFields: ["password", "confirmPassword"]) {
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
  someMutation(arg: Mutation1Input! @objectValidation(equalFields: ["password", "confirmPassword"])): Boolean!
}
```

**nonEqualFields**

A collection of field names that must have distinct values.

```gql
input Mutation1Input @objectValidation(equalFields: ["securityAnswer1", "securityAnswer2"]) {
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
  someMutation(arg: Mutation1Input! @objectValidation(equalFields: ["securityAnswer1", "securityAnswer2"])): Boolean!
}
```

## Writing custom directives

TODO
