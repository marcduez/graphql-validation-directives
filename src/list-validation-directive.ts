import { DocumentNode } from "graphql"
import gql from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ListValidationDirective extends BaseValidationDirective {
  constructor() {
    super("listValidation", "list")
  }

  // eslint-disable-next-line class-methods-use-this
  get typeDefs(): DocumentNode {
    return gql`
      directive @listValidation(
        maxItems: Int
        minItems: Int
        uniqueItems: Boolean
        listDepth: Int
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `
  }

  // eslint-disable-next-line class-methods-use-this
  getListDepth(directiveConfig: Record<string, any>) {
    return directiveConfig.listDepth as number
  }

  // eslint-disable-next-line class-methods-use-this
  validate(directiveConfig: Record<string, any>, value: any) {
    const valueArray = value as any[]

    if (
      directiveConfig.maxItems !== undefined &&
      valueArray.length > directiveConfig.maxItems
    ) {
      throw new Error(`Value must be at most ${directiveConfig.maxItems} items`)
    }
    if (
      directiveConfig.minItems !== undefined &&
      valueArray.length < directiveConfig.minItems
    ) {
      throw new Error(
        `Value must be at least ${directiveConfig.minItems} items`
      )
    }

    // TODO: Other constraints
  }
}
