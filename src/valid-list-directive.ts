/* eslint-disable class-methods-use-this */
import { DocumentNode } from "graphql"
import gql from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ValidListDirective extends BaseValidationDirective {
  constructor(name = "validList") {
    super(name, "list")
  }

  getListDepth(directiveConfig: Record<string, any>) {
    // Returns the depth indicated by the `listDepth` argument of this directive, or 0 by default.
    return (directiveConfig.listDepth ?? 0) as number
  }

  get typeDefs(): DocumentNode {
    return gql(`
      directive @${this.name}(
        maxItems: Int
        minItems: Int
        uniqueItems: Boolean
        listDepth: Int
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `)
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
        .some((item, index, arr) => arr.indexOf(item) !== index)
    ) {
      throw new Error("Value must contain unique items")
    }
  }
}
