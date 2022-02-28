import { GraphQLError } from "graphql"

export default class ValidationError extends GraphQLError {
  constructor(errors: Error[]) {
    super("Validation Error", {
      extensions: {
        code: "CONSTRAINT_VIOLATION",
        errors: errors.map(err => err.message),
      },
    })
    Object.defineProperty(this, "name", { value: "ValidationError" })
  }
}
