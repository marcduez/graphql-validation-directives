/* eslint-disable class-methods-use-this */
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils"
import {
  DocumentNode,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLType,
} from "graphql"
import { ValidateFn, ValidationTarget } from "./types"

/**
 * Base class for validation directives.
 */
export class BaseValidationDirective {
  /**
   * Constructor.
   * @param name - The name of this directive.
   * @param target - The target of this validation. The "scalar" target is the most common. The "list" target should be used for validators that concern themselves with list shape. The "object" target should be used for validators that compare multiple fields of an object.
   */
  constructor(
    public name: string,
    public target: ValidationTarget = "scalar"
  ) {}

  /**
   * Uses the `mapSchema` visitor to add validation extension to fields and arguments in the schema.
   * @param schema - The schema to update.
   * @returns The resulting schema.
   */
  applyDirectiveToSchema(schema: GraphQLSchema) {
    return mapSchema(schema, {
      [MapperKind.INPUT_OBJECT_FIELD]: fieldConfig => {
        const directiveConfigs =
          getDirective(schema, fieldConfig, this.name) ?? []

        if (directiveConfigs.length) {
          // Ensure extension field exists.
          if (!fieldConfig.extensions?.validations) {
            Object.defineProperty(fieldConfig.extensions, "validations", {
              value: [],
              writable: true,
            })
          }
        }

        const fieldValidations = fieldConfig.extensions!.validations as {
          target: ValidationTarget
          listDepth: number
          fn: ValidateFn
        }[]

        directiveConfigs.forEach(directiveConfig => {
          fieldValidations.unshift({
            target: this.target,
            listDepth: this.getListDepth(directiveConfig),
            fn: this.validate.bind(this, directiveConfig),
          })
        })

        return fieldConfig
      },

      [MapperKind.INPUT_OBJECT_TYPE]: inputObjectType => {
        const directiveConfigs =
          getDirective(schema, inputObjectType, this.name) ?? []

        // Ensure extension field exists.
        if (!inputObjectType.extensions?.validations) {
          Object.defineProperty(inputObjectType.extensions, "validations", {
            value: [],
            writable: true,
          })
        }

        const inputObjectValidations = inputObjectType.extensions!
          .validations as {
          target: ValidationTarget
          listDepth: number
          fn: ValidateFn
        }[]

        directiveConfigs.forEach(directiveConfig => {
          inputObjectValidations.unshift({
            target: this.target,
            listDepth: 0,
            fn: this.validate.bind(this, directiveConfig),
          })
        })

        return inputObjectType
      },

      [MapperKind.OBJECT_FIELD]: fieldConfig => {
        // Get directive on each argument where it is placed.
        const validationsByArgumentName = Object.entries(
          fieldConfig.args ?? {}
        ).reduce<Record<string, { listDepth: number; fn: ValidateFn }[]>>(
          (map, [argumentName, argumentConfig]) => {
            const directiveConfigs =
              getDirective(schema, argumentConfig, this.name) ?? []

            return directiveConfigs
              ? {
                  ...map,
                  [argumentName]: directiveConfigs.map(directiveConfig => ({
                    listDepth: this.getListDepth(directiveConfig),
                    fn: this.validate.bind(this, directiveConfig),
                  })),
                }
              : map
          },
          {}
        )

        if (Object.entries(validationsByArgumentName).length) {
          // Ensure extension field exists.
          if (!fieldConfig.extensions?.argumentValidations) {
            Object.defineProperty(
              fieldConfig.extensions,
              "argumentValidations",
              {
                value: {},
                writable: true,
              }
            )
          }

          // Augment extension field with validate function.
          const argumentValidations = fieldConfig.extensions!
            .argumentValidations as Record<
            string,
            { target: ValidationTarget; listDepth: number; fn: ValidateFn }[]
          >

          Object.entries(validationsByArgumentName).forEach(
            ([argumentName, validateFns]) => {
              if (!argumentValidations[argumentName]) {
                argumentValidations[argumentName] = []
              }

              validateFns.forEach(({ listDepth, fn }) => {
                argumentValidations[argumentName].unshift({
                  target: this.target,
                  listDepth,
                  fn,
                })
              })
            }
          )
        }

        return fieldConfig
      },
    })
  }

  /**
   * Returns the depth of list validated by this directive.
   * The depth 0 indicates the topmost list of a field or argument.
   * The depth 1 indicates the first nested list.
   * The depth 2 indicates the second nested list, and so on.
   *
   * The directive config is provided as an argument, so depth can be based on directive arguments.
   *
   * So in the following example:
   * ```
   * type MyType {
   *   myList: [[[String!]!]!]! @validList(maxItems: 2, listDepth: 0) @validList(maxItems: 5, listDepth: 1) @validList(maxItems: 3, listDepth: 2)
   * }
   * ```
   * We would be saying a valid value for myList has up to two items, where each of those items has up to 5 items, where each of those items has up to 3 items.
   * @param directiveConfig - The configuration of this directive
   * @returns The depth of list validated by this directive.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getListDepth(directiveConfig: Record<string, any>): number {
    return 0
  }

  /**
   * Returns the type definitions of this directive.
   * These should be merged with the type definitions of the rest of the schema to create a working schema.
   */
  get typeDefs(): DocumentNode {
    throw new Error("Implemented by subclass")
  }

  /**
   * The function used to validate this value. Any errors thrown from this function will be returned as validation errors and prevent execution.
   * @param directiveConfig - The configuration of the directive.
   * @param value - The value being validated.
   * @param type - The GraphQL type of the value being validated.
   * @param path - The path of the value being validated. E.g. `parent.child[2].grandchild`.
   * @param source - The source argument of the resolver - the parent object in the graph.
   * @param args - The args argument of the resolver - full set of arguments sent to the resolver.
   * @param context - The context argument of the resolver - the current GraphQL execution context.
   * @param info - The info argument of the resolver - the current GraphQL resolve info.
   */
  validate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    directiveConfig: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type: GraphQLType,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    path: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    source: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    args: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info: GraphQLResolveInfo
  ): void {
    throw new Error("Implemented by subclass")
  }
}
