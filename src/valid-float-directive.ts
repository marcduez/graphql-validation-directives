/* eslint-disable class-methods-use-this */
import { DocumentNode } from "graphql"
import { gql } from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ValidFloatDirective extends BaseValidationDirective {
  constructor(name = "validFloat") {
    super(name)
  }

  get typeDefs(): DocumentNode {
    return gql(`
      directive @${this.name}(
        multipleOf: Float
        max: Float
        min: Float
        exclusiveMax: Float
        exclusiveMin: Float
        oneOf: [Float!]
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `)
  }

  validate(directiveConfig: Record<string, any>, value: any) {
    const { multipleOf, max, min, exclusiveMax, exclusiveMin, oneOf } =
      directiveConfig as {
        multipleOf?: number
        max?: number
        min?: number
        exclusiveMax?: number
        exclusiveMin?: number
        oneOf?: number[]
      }

    if (Number.isNaN(value)) {
      return
    }

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

    if (oneOf !== undefined && !oneOf.includes(valueNumber)) {
      throw new Error(
        `Value must be one of ${oneOf.map(n => n.toString()).join(", ")}`
      )
    }
  }
}
