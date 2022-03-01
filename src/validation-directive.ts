/* eslint-disable class-methods-use-this */
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

  get typeDefs(): DocumentNode {
    return gql`
      enum StringValidationFormat {
        EMAIL
        UUID
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
        regexFlags: String
        stringOneOf: [String]

        """
        Number validation rules
        """
        multipleOf: Float
        max: Float
        min: Float
        exclusiveMax: Float
        exclusiveMin: Float
        numberOneOf: [Float]
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `
  }

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
      format,
      maxLength,
      minLength,
      startsWith,
      endsWith,
      includes,
      regex,
      regexFlags,
      stringOneOf,
      multipleOf,
      max,
      min,
      exclusiveMax,
      exclusiveMin,
      numberOneOf,
    } = directiveConfig as {
      format?: "EMAIL" | "UUID"
      maxLength?: number
      minLength?: number
      startsWith?: string
      endsWith?: string
      includes?: string
      regex?: string
      regexFlags?: string
      stringOneOf?: string[]
      multipleOf?: number
      max?: number
      min?: number
      exclusiveMax?: number
      exclusiveMin?: number
      numberOneOf?: number[]
    }

    if (
      innerType instanceof GraphQLScalarType &&
      ["String", "ID"].includes(innerType.name)
    ) {
      const valueString = value as string

      if (
        format === "EMAIL" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueString)
      ) {
        throw new Error(`Value must be be a valid email`)
      }

      if (
        format === "UUID" &&
        !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          valueString
        )
      ) {
        throw new Error(`Value must be be a valid UUID`)
      }

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

      if (
        regex !== undefined &&
        !new RegExp(regex, regexFlags).test(valueString)
      ) {
        throw new Error(
          `Value must match pattern '${regex}'${
            regexFlags !== undefined ? ` with flags '${regexFlags}'` : ""
          }`
        )
      }

      if (stringOneOf !== undefined && !stringOneOf.includes(valueString)) {
        throw new Error(
          `Value must be one of ${stringOneOf.map(s => `'${s}'`).join(", ")}`
        )
      }
    }

    if (innerType instanceof GraphQLScalarType && innerType.name === "Int") {
      const valueNumber = value as number

      if (
        multipleOf !== undefined &&
        valueNumber % Math.round(multipleOf) !== 0
      ) {
        throw new Error(`Value must be a multiple of ${Math.round(multipleOf)}`)
      }

      if (max !== undefined && valueNumber > Math.round(max)) {
        throw new Error(`Value must not be greater than ${Math.round(max)}`)
      }

      if (min !== undefined && valueNumber < Math.round(min)) {
        throw new Error(`Value must not be less than ${Math.round(min)}`)
      }

      if (
        exclusiveMax !== undefined &&
        valueNumber >= Math.round(exclusiveMax)
      ) {
        throw new Error(`Value must be less than ${Math.round(exclusiveMax)}`)
      }

      if (
        exclusiveMin !== undefined &&
        valueNumber <= Math.round(exclusiveMin)
      ) {
        throw new Error(
          `Value must be greater than ${Math.round(exclusiveMin)}`
        )
      }

      if (
        numberOneOf !== undefined &&
        !numberOneOf.map(num => Math.round(num)).includes(valueNumber)
      ) {
        throw new Error(
          `Value must be one of ${numberOneOf
            .map(n => Math.round(n).toString())
            .join(", ")}`
        )
      }
    }

    if (innerType instanceof GraphQLScalarType && innerType.name === "Float") {
      const valueNumber = value as number

      if (multipleOf !== undefined && valueNumber % multipleOf !== 0) {
        throw new Error(`Value must be a multiple of ${multipleOf}`)
      }

      if (max !== undefined && valueNumber > max) {
        throw new Error(`Value must not be greater than ${max}`)
      }

      if (min !== undefined && valueNumber < min) {
        throw new Error(`Value must not be less than ${min}`)
      }

      if (exclusiveMax !== undefined && valueNumber >= exclusiveMax) {
        throw new Error(`Value must be less than ${exclusiveMax}`)
      }

      if (exclusiveMin !== undefined && valueNumber <= exclusiveMin) {
        throw new Error(`Value must be greater than ${exclusiveMin}`)
      }

      if (numberOneOf !== undefined && !numberOneOf.includes(valueNumber)) {
        throw new Error(
          `Value must be one of ${numberOneOf
            .map(n => n.toString())
            .join(", ")}`
        )
      }
    }
  }
}
