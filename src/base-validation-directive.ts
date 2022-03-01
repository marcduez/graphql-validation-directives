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
   * Ctor.
   * @param name - The name of this directive. Used in schema updating function, to know which directive to look for.
   * @param target - The target of this validation. Use "scalar" validation for most validation. Use "list" validation for validation on things like min and max size of lists. Use "object" validation for things like "two fields must match".
   * @param listDepth - For list validators, the depth of the list. This allows us to write list validators for lists of lists of lists. Ignored for other targets.
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

  get typeDefs(): DocumentNode {
    throw new Error("Implemented by sub-class")
  }

  /**
   * Returns the depth of list validated by this directive, possibly using its attributes as input.
   * @param directiveConfig - The configuration of this directive
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getListDepth(directiveConfig: Record<string, any>): number {
    return 0
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
  ) {
    throw new Error("Implemented by sub-class")
  }
}
