/* eslint-disable class-methods-use-this */
import { DocumentNode } from "graphql"
import { gql } from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ValidObjectDirective extends BaseValidationDirective {
  constructor(name = "validObject") {
    super(name, "object")
  }

  get typeDefs(): DocumentNode {
    return gql(`
      directive @${this.name}(
        equalFields: [String!]
        nonEqualFields: [String!]
      ) on INPUT_OBJECT | ARGUMENT_DEFINITION | ARGUMENT_DEFINITION
    `)
  }

  validate(directiveConfig: Record<string, any>, value: any) {
    const valueObj = value as Record<string, any>

    if (directiveConfig.equalFields?.length > 1) {
      const fieldValues = (directiveConfig.equalFields as string[])
        .map(fieldName => valueObj[fieldName])
        .map(fieldValue =>
          fieldValue !== null && fieldValue !== undefined
            ? JSON.stringify(fieldValue)
            : fieldValue
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

    if (directiveConfig.nonEqualFields?.length > 1) {
      const fieldValues = (directiveConfig.nonEqualFields as string[])
        .map(fieldName => valueObj[fieldName])
        .map(fieldValue =>
          fieldValue !== null && fieldValue !== undefined
            ? JSON.stringify(fieldValue)
            : fieldValue
        )

      if (
        fieldValues.some(
          (fieldValue, index, arr) =>
            fieldValue !== null &&
            fieldValue !== undefined &&
            arr.indexOf(fieldValue) !== index
        )
      ) {
        throw new Error(
          `Fields ${directiveConfig.nonEqualFields.join(
            " and "
          )} must not be equal`
        )
      }
    }
  }
}
