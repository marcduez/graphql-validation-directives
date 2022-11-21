# graphql-validation-directives

<span class="badge-npmversion"><a href="https://npmjs.org/package/@marcduez/graphql-validation-directives" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@marcduez/graphql-validation-directives.svg" alt="NPM version" /></a></span>

Library for adding input validation to GraphQL services, using schema directives.

This library was heavily inspired by the approach used by [@profusion/apollo-validation-directives](https://github.com/profusion/apollo-validation-directives).

Under the hood, this library:

1. Uses the schema visitor logic to copy directive metadata into the extension methods of input objects, input object fields, and field arguments.
2. Wraps the resolver functions of all fields with validated arguments, validating all arguments before calling the original resolver. If validation fails, a validation error is returned and the original resolver is never executed.

## General usage

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  ValidListDirective,
  ValidObjectDirective,
  ValidStringDirective,
} from "@marcduez/graphql-validation-directives"
import gql from "graphql-tag"

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

### Null values

Null and undefined values are not validated. Use non-null GraphQL type hints for null checks.

### List Depth

The GraphQL type system allows us to define list of lists. To target our validation at the right level of nesting, we need a way to specify the level of nesting. See [documentation of BaseValidationDirective#getListDepth method](https://github.com/marcduez/graphql-validation-directives/blob/main/src/base-validation-directive.ts#L176) for more details.

### Custom directive names

If the default names of the validation directives collide with something in your own type definitions, you can use them with a custom name.

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  ValidStringDirective,
} from "@marcduez/graphql-validation-directives"
import gql from "graphql-tag"

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

Throws if a string does not match the provided format. Currently allowed values are `EMAIL` and `UUID`.

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

Throws if the string is longer than the provided value.

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

Throws if the string is shorter than the provided value.

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

Throws if the string does not start with the provided value.

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

Throws if the string does not end with the provided value.

```gql
input Mutation1Input {
  field: String! @validString(endsWith: "-cad")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(endsWith: "-cad")): Boolean!
}
```

**includes**

Throws if the string does not include the provided value.

```gql
input Mutation1Input {
  field: String! @validString(includes: "-rrsp-")
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(includes: "-rrsp-")): Boolean!
}
```

**regex and regexFlags**

Throws if the string does not match the provided regular expression pattern. If flags are provided, they are used.

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

Throws if the string is not in the provided collection of strings.

```gql
input Mutation1Input {
  field: String! @validString(oneOf: ["tfsa", "rrsp", "individual"])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: String! @validString(oneOf: ["tfsa", "rrsp", "individual"])): Boolean!
}
```

### @validInt directive

**multipleOf**

Throws if the number is not multiple of the provided integer value.

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

Throws if the number is greater than the provided integer value.

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

Throws if the number is less than the provided integer value.

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

Throws if the number is greater than or equal to the provided integer value.

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

Throws if the number is less than or equal to the provided integer value.

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

Throws if the number is not in the provided collection of integers.

```gql
input Mutation1Input {
  field: Int! @validInt(oneOf: [2, 3, 4])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Int! @validInt(oneOf: [2, 3, 4])): Boolean!
}
```

### @validFloat directive

**multipleOf**

Throws if the number is not multiple of the provided float value.

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

Throws if the number is greater than the provided float value.

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

Throws if the number is less than the provided float value.

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

Throws if the number is greater than or equal to the provided float value.

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

Throws if the number is less than or equal to the provided float value.

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

Throws if the number is not in the provided collection of floats.

```gql
input Mutation1Input {
  field: Float! @validFloat(oneOf: [2.1, 2.2, 2.3])
}

type Mutation {
  someMutation(arg: Mutation1Input!): Boolean!
}

OR

type Mutation {
  someMutation(arg: Float! @validFloat(oneOf: [2.1, 2.2, 2.3])): Boolean!
}
```

### @validList directive

**maxItems**

Throws if the list has more than the provided number of items.

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

Throws if the list has less than the provided number of items.

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

Throws if the list has non-unique items.

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

See [documentation of BaseValidationDirective#getListDepth method](https://github.com/marcduez/graphql-validation-directives/blob/main/src/base-validation-directive.ts#L176) for more details on this feature.

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

Throws if the fields with the provided names have non-equal values.

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

Throws if the fields with the provided names have equal values.

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

Below is an example of a custom validation directive that checks whether a string is a valid timezone name.

```ts
import { makeExecutableSchema } from "@graphql-tools/schema"
import {
  addValidationToSchema,
  BaseValidationDirective,
} from "@marcduez/graphql-validation-directives"
import gql from "graphql-tag"
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
