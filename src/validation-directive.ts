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

    const {
      maxLength,
      minLength,
      startsWith,
      endsWith,
      includes,
      stringOneOf,
      stringEquals,
      max,
      min,
    } = directiveConfig as {
      maxLength?: number
      minLength?: number
      startsWith?: string
      endsWith?: string
      includes?: string
      regex?: string
      stringOneOf?: string[]
      stringEquals?: string
      multipleOf?: number
      min?: number
      max?: number
    }

    if (
      innerType instanceof GraphQLScalarType &&
      ["String", "ID"].includes(innerType.name)
    ) {
      const valueString = value as string

      if (maxLength !== undefined && valueString.length > maxLength) {
        throw new Error(`Value must be at most ${maxLength} characters`)
      }

      if (minLength !== undefined && valueString.length < minLength) {
        throw new Error(`Value must be at least ${minLength} characters`)
      }

      if (
        startsWith !== undefined &&
        valueString.slice(0, startsWith.length) !== startsWith
      ) {
        throw new Error(`Value must start with '${startsWith}'`)
      }

      if (
        endsWith !== undefined &&
        valueString.slice(-endsWith.length) !== endsWith
      ) {
        throw new Error(`Value must end with '${endsWith}'`)
      }

      if (includes !== undefined && valueString.indexOf(includes) < 0) {
        throw new Error(`Value must include '${includes}'`)
      }

      // TODO: Regex constraint

      if (stringOneOf !== undefined && !stringOneOf.includes(valueString)) {
        throw new Error(
          `Value must be one of ${stringOneOf.map(s => `'${s}'`).join(", ")}`
        )
      }

      if (stringEquals !== undefined && valueString !== stringEquals) {
        throw new Error(`Value must equal '${stringEquals}'`)
      }

      // TODO: Other constraints
    }

    if (
      innerType instanceof GraphQLScalarType &&
      ["Int", "Float"].includes(innerType.name)
    ) {
      const valueNumber = value as number

      if (max !== undefined && valueNumber > max) {
        throw new Error(`Value must not be greater than ${max}`)
      }

      if (min !== undefined && valueNumber < min) {
        throw new Error(`Value must be less than ${min}`)
      }

      // TODO: Other constraints
    }
  }
}
