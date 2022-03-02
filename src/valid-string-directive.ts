/* eslint-disable class-methods-use-this */
import { gql } from "graphql-tag"
import { BaseValidationDirective } from "./base-validation-directive"

export class ValidStringDirective extends BaseValidationDirective {
  constructor(name = "validString") {
    super(name)
  }

  get typeDefs() {
    const formatEnumName = `${this.name
      .slice(0, 1)
      .toUpperCase()}${this.name.slice(1)}FormatEnum`
    return gql(`
      enum ${formatEnumName} {
        EMAIL
        UUID
      }

      directive @${this.name}(
        format: ${formatEnumName}
        maxLength: Int
        minLength: Int
        startsWith: String
        endsWith: String
        includes: String
        regex: String
        regexFlags: String
        oneOf: [String!]
      ) on INPUT_FIELD_DEFINITION | ARGUMENT_DEFINITION
    `)
  }

  validate(directiveConfig: Record<string, any>, value: any) {
    const {
      format,
      maxLength,
      minLength,
      startsWith,
      endsWith,
      includes,
      regex,
      regexFlags,
      oneOf,
    } = directiveConfig as {
      format?: "EMAIL" | "UUID"
      maxLength?: number
      minLength?: number
      startsWith?: string
      endsWith?: string
      includes?: string
      regex?: string
      regexFlags?: string
      oneOf?: string[]
    }

    if (typeof value !== "string") {
      return
    }

    const valueString = value as string

    if (format === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueString)) {
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

    if (oneOf !== undefined && !oneOf.includes(valueString)) {
      throw new Error(
        `Value must be one of ${oneOf.map(s => `'${s}'`).join(", ")}`
      )
    }
  }
}
