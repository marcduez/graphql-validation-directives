// eslint-disable-next-line max-classes-per-file
import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLType,
} from "graphql"
import AggregateValidationError from "./aggregate-validation-error"
import { ValidateFn, ValidationTarget } from "./types"
import ValidationError from "./validation-error"

export { BaseValidationDirective } from "./base-validation-directive"
export { ListValidationDirective } from "./list-validation-directive"
export { ObjectValidationDirective } from "./object-validation-directive"
export { ValidationDirective } from "./validation-directive"

const unwrapType = (type: GraphQLType) => {
  let result = type
  if (result instanceof GraphQLNonNull) {
    result = result.ofType
  }

  if (result instanceof GraphQLList) {
    result = result.ofType
  }

  return result
}

const getFieldsWithArgumentsAndInputObjectTypes = (schema: GraphQLSchema) => {
  const fieldsWithArguments: GraphQLField<unknown, unknown>[] = []
  const inputObjectTypes: GraphQLInputObjectType[] = []

  Object.values(schema.getTypeMap()).forEach(type => {
    if (type instanceof GraphQLObjectType) {
      fieldsWithArguments.push(
        ...Object.values(type.getFields()).filter(field => !!field.args.length)
      )
    } else if (type instanceof GraphQLInputObjectType) {
      inputObjectTypes.push(type)
    }
  })

  return { fieldsWithArguments, inputObjectTypes }
}

function markValidateInputObjectRecursive(
  inputObjectType: GraphQLInputObjectType
) {
  const validate = Object.values(inputObjectType.getFields()).some(field => {
    const fieldType = unwrapType(field.type)
    if (fieldType === inputObjectType) {
      return false
    }
    if (fieldType instanceof GraphQLInputObjectType) {
      return markValidateInputObjectRecursive(fieldType)
    }
    return !!field.extensions.validations
  })

  if (validate) {
    Object.defineProperty(inputObjectType.extensions, "validate", {
      value: true,
      writable: false,
    })
  }

  return validate
}

const validateRecursive = <TSource, TContext>(
  source: TSource,
  args: Record<string, any>,
  context: TContext,
  info: GraphQLResolveInfo,
  path: string,
  value: any,
  type: GraphQLType,
  validations: {
    target: ValidationTarget
    listDepth: number
    fn: ValidateFn
  }[] = [],
  listDepth = 0
): ValidationError[] => {
  if (value === null || value === undefined) {
    return []
  }

  let valueType = type
  if (valueType instanceof GraphQLNonNull) {
    valueType = valueType.ofType
  }

  // If type is a list:
  // - First, validate list itself.
  // - Second, validate list items.
  if (valueType instanceof GraphQLList) {
    const listType = valueType as GraphQLList<GraphQLType>

    // Validate list itself.
    const listErrors = validations
      .filter(
        validation =>
          validation.target === "list" && validation.listDepth === listDepth
      )
      .reduce<ValidationError[]>((errors, { fn }) => {
        try {
          fn(value, listType, path, source, args, context, info)
          return errors
        } catch (e: unknown) {
          return [...errors, new ValidationError(e as Error, path)]
        }
      }, [])
    if (listErrors.length) {
      return listErrors
    }

    // Validate each list item.
    return (value as any[]).reduce<ValidationError[]>(
      (errors, item, index) => [
        ...errors,
        ...validateRecursive(
          source,
          args,
          context,
          info,
          `${path}[${index}]`,
          item,
          listType.ofType,
          validations,
          listDepth + 1
        ),
      ],
      []
    )
  }

  // If type is an input object:
  // - First, validate object itself.
  // - Second, validate object fields.
  if (valueType instanceof GraphQLInputObjectType) {
    const inputObjectType = valueType as GraphQLInputObjectType

    const objectErrors = validations
      .concat(
        (inputObjectType.extensions.validations ?? []) as {
          target: ValidationTarget
          listDepth: number
          fn: ValidateFn
        }[]
      )
      .filter(validation => validation.target === "object")
      .reduce<ValidationError[]>((errors, { fn }) => {
        try {
          fn(value, inputObjectType, path, source, args, context, info)
          return errors
        } catch (e: unknown) {
          return [...errors, new ValidationError(e as Error, path)]
        }
      }, [])
    if (objectErrors.length) {
      return objectErrors
    }

    if (inputObjectType.extensions.validate === true) {
      return Object.values(inputObjectType.getFields()).reduce<
        ValidationError[]
      >(
        (errors, field) => [
          ...errors,
          ...validateRecursive(
            source,
            args,
            context,
            info,
            `${path}.${field.name}`,
            value[field.name],
            field.type,
            field.extensions.validations as {
              target: ValidationTarget
              listDepth: number
              fn: ValidateFn
            }[]
          ),
        ],
        []
      )
    }

    return []
  }

  // Otherwise, object is a scalar. Run scalar validation functions on it.
  return validations
    .filter(validation => validation.target === "scalar")
    .reduce<ValidationError[]>((arr, { fn }) => {
      try {
        fn(value, valueType, path, source, args, context, info)
        return arr
      } catch (e: unknown) {
        return [...arr, new ValidationError(e as Error, path)]
      }
    }, [])
}

const validateFieldArguments = <TSource, TContext>(
  field: GraphQLField<unknown, TContext>,
  source: TSource,
  args: Record<string, any>,
  context: TContext,
  info: GraphQLResolveInfo
) => {
  const errors = Object.entries(args).reduce<ValidationError[]>(
    (errs, [argumentName, argumentValue]) => {
      const argument = field.args.find(arg => arg.name === argumentName)!
      const argumentValidations = ((field.extensions
        .argumentValidations as Record<
        string,
        { target: ValidationTarget; listDepth: number; fn: ValidateFn }[]
      >) ?? {})[argumentName]

      return [
        ...errs,
        ...validateRecursive(
          source,
          args,
          context,
          info,
          argumentName,
          argumentValue,
          argument.type,
          argumentValidations
        ),
      ]
    },
    []
  )

  if (errors.length) {
    throw new AggregateValidationError(errors)
  }
}

const wrapValidatedFieldResolvers = (
  fieldsWithArguments: GraphQLField<unknown, unknown>[]
) => {
  fieldsWithArguments
    // Filter to fields where one or more arguments have an argument validation directive, or a type with a field validation directive
    .filter(
      field =>
        !!field.extensions.argumentValidations ||
        field.args
          .map(arg => unwrapType(arg.type))
          .some(
            argType =>
              argType instanceof GraphQLInputObjectType &&
              argType.extensions.validate === true
          )
    )
    .forEach(field => {
      const { resolve: originalFieldResolver } = field
      if (originalFieldResolver) {
        // eslint-disable-next-line func-names, no-param-reassign
        field.resolve = function (source, args, context, info) {
          validateFieldArguments(field, source, args, context, info)
          return originalFieldResolver.apply(this, [
            source,
            args,
            context,
            info,
          ])
        }
      }
    })
}

export const addValidationToSchema = (schema: GraphQLSchema) => {
  const { fieldsWithArguments, inputObjectTypes } =
    getFieldsWithArgumentsAndInputObjectTypes(schema)

  inputObjectTypes.forEach(inputObjectType =>
    markValidateInputObjectRecursive(inputObjectType)
  )

  wrapValidatedFieldResolvers(fieldsWithArguments)

  return schema
}
