export default class ValidationError extends Error {
  constructor(public innerError: Error, public path: string) {
    super(innerError.message)
  }
}
