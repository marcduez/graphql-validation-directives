/* eslint-disable class-methods-use-this */
import { DocumentNode } from "graphql"
import gql from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ListValidationDirective extends BaseValidationDirective {
  constructor() {
    super("listValidation", "list")
  }

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

  getListDepth(directiveConfig: Record<string, any>) {
    return (directiveConfig.listDepth ?? 0) as number
  }

  validate(directiveConfig: Record<string, any>, value: any) {
    const valueArray = value as any[]

    const { maxItems, minItems, uniqueItems } = directiveConfig as {
      maxItems?: number
      minItems?: number
      uniqueItems?: boolean
    }

    if (maxItems !== undefined && valueArray.length > maxItems) {
      throw new Error(`Value must be at most ${maxItems} items`)
    }

    if (minItems !== undefined && valueArray.length < minItems) {
      throw new Error(`Value must be at least ${minItems} items`)
    }

    if (
      uniqueItems === true &&
      valueArray
        .map(item => JSON.stringify(item))
        .filter((item, index, arr) => arr.indexOf(item) === index).length !==
        valueArray.length
    ) {
      throw new Error("Value must contain unique items")
    }
  }
}
