import { GraphQLError } from "graphql"
import ValidationError from "./validation-error"

export const ERROR_MESSAGE = "One or more validation errors were encountered"
export const ERROR_CODE = "VALIDATION_ERROR"

export default class AggregateValidationError extends GraphQLError {
  constructor(errors: ValidationError[]) {
    super(ERROR_MESSAGE, {
      extensions: {
        code: ERROR_CODE,
        validationErrors: errors.map(err => ({
          message: err.message,
          path: err.path,
        })),
      },
    })
    Object.defineProperty(this, "name", { value: "AggregateValidationError" })
  }
}
