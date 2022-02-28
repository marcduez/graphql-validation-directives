# graphql-validation-directives

Schema for adding input validation to GraphQL services, using schema directives. Under the hood, this library:

1. Uses the schema visitor logic to copy directive metadata into the extension methods of input objects, input object fields, and field arguments.
2. Marks any input objects that have nested fields with validation extensions as needing validation.
3. Wraps the resolver functions of all fields with validated arguments in a function that first tries to run validation on all arguments.

If any validation function throws, the contents are returned as validation errors, and the original resolver is not run.

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
            validationDirective.typeDefs,
            objectValidationDirective.typeDefs,
            listValidationDirective.typeDefs,
            gql`
              input Mutation1Input
                @objectValidation(equalFields: ["string1", "string2"]) {
                list: [[String!]]
                  @listValidation(maxItems: 2, listDepth: 0)
                  @listValidation(uniqueItems: true, listDepth: 1)
                  @validation(startsWith: "abc")
                field1: String!
                field2: String!
              }

              type Mutation {
                mutation1(input: Mutation1Input!): Boolean!
                mutation2(input: String! @validation(maxLength: 255)): Boolean!
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

`TODO`

**maxLength**

`TODO`

**minLength**

`TODO`

**startsWith**

`TODO`

**endsWith**

`TODO`

**includes**

`TODO`

**regex**

`TODO`

**stringOneOf**

`TODO`

**stringEquals**

`TODO`

**multipleOf**

`TODO`

**max**

`TODO`

**min**

`TODO`

**exclusiveMax**

`TODO`

**exclusiveMin**

`TODO`

**numberOneOf**

`TODO`

**numberEquals**

`TODO`

### List validation directive

**maxItems**

`TODO`

**minItems**

`TODO`

**uniqueItems**

`TODO`

**listDepth**

`TODO`

### Object validation directive

**equalFields**

`TODO`

**nonEqualFields**

`TODO`

## Writing custom directives

`TODO`
