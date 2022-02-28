import {
  DocumentNode,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLType,
} from "graphql"
import { gql } from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ValidationDirective extends BaseValidationDirective {
  constructor() {
    super("validation")
  }

  // eslint-disable-next-line class-methods-use-this
  get typeDefs(): DocumentNode {
    return gql`
      enum StringValidationFormat {
        EMAIL
      }

      directive @validation(
        """
        String validation rules
        """
        format: StringValidationFormat
        maxLength: Int
        minLength: Int
        startsWith: String
        endsWith: String
        includes: String
        regex: String
        stringOneOf: [String]
        stringEquals: String

        """
        Number validation rules
        """
        multipleOf: Float
        max: Float
        min: Float
        exclusiveMax: Float
        exclusiveMin: Float
        numberOneOf: [Float]
        numberEquals: Float
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `
  }

  // eslint-disable-next-line class-methods-use-this
  validate(
    directiveConfig: Record<string, any>,
    value: any,
    type: GraphQLType
  ) {
    let innerType: GraphQLType = type
    if (innerType instanceof GraphQLNonNull) {
      innerType = innerType.ofType
    }

    if (
      innerType instanceof GraphQLScalarType &&
      ["String", "ID"].includes(innerType.name)
    ) {
      const valueString = value as string
      if (
        directiveConfig.maxLength !== undefined &&
        valueString.length > directiveConfig.maxLength
      ) {
        throw new Error(
          `Value must be at most ${directiveConfig.maxLength} characters`
        )
      }
      if (
        directiveConfig.minLength !== undefined &&
        valueString.length < directiveConfig.minLength
      ) {
        throw new Error(
          `Value must be at least ${directiveConfig.minLength} characters`
        )
      }

      // TODO: Other constraints
    }

    if (
      innerType instanceof GraphQLScalarType &&
      ["Int", "Float"].includes(innerType.name)
    ) {
      const valueNumber = value as number

      if (
        directiveConfig.min !== undefined &&
        valueNumber > directiveConfig.max
      ) {
        throw new Error(`Value must not be greater than ${directiveConfig.max}`)
      }
      if (
        directiveConfig.min !== undefined &&
        valueNumber < directiveConfig.min
      ) {
        throw new Error(`Value must be less than ${directiveConfig.min}`)
      }

      // TODO: Other constraints
    }
  }
}
