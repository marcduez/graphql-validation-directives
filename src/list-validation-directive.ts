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
    return (directiveConfig.listDepth ?? 0) as number
  }

  // eslint-disable-next-line class-methods-use-this
  validate(directiveConfig: Record<string, any>, value: any) {
    const valueArray = value as any[]

    const { maxItems, minItems } = directiveConfig as {
      maxItems?: number
      minItems?: number
    }

    if (maxItems !== undefined && valueArray.length > maxItems) {
      throw new Error(`Value must be at most ${maxItems} items`)
    }

    if (minItems !== undefined && valueArray.length < minItems) {
      throw new Error(`Value must be at least ${minItems} items`)
    }

    // TODO: Other constraints
  }
}
