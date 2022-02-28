import { DocumentNode } from "graphql"
import { gql } from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ObjectValidationDirective extends BaseValidationDirective {
  constructor() {
    super("objectValidation", "object")
  }

  // eslint-disable-next-line class-methods-use-this
  get typeDefs(): DocumentNode {
    return gql`
      directive @objectValidation(
        equalFields: [String!]
        nonEqualFields: [String!]
      ) on INPUT_OBJECT | ARGUMENT_DEFINITION | ARGUMENT_DEFINITION
    `
  }

  // eslint-disable-next-line class-methods-use-this
  validate(directiveConfig: Record<string, any>, value: any) {
    const valueObj = value as Record<string, any>

    if (directiveConfig.equalFields?.length > 1) {
      const fieldValues = (directiveConfig.equalFields as string[]).map(
        fieldName => valueObj[fieldName]?.toString()
      )
      if (
        fieldValues.some(
          (fieldValue, _, arr) =>
            fieldValue !== null &&
            fieldValue !== undefined &&
            arr.indexOf(fieldValue) !== 0
        )
      ) {
        throw new Error(
          `Fields ${directiveConfig.equalFields.join(" and ")} must be equal`
        )
      }
    }

    // TODO: Other validations
  }
}
