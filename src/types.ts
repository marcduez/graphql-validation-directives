import { GraphQLResolveInfo, GraphQLType } from "graphql"

export type ValidationTarget = "list" | "object" | "scalar"

export type ValidateFn = <TContext>(
  value: any,
  type: GraphQLType,
  path: string,
  source: any,
  args: Record<string, any>,
  context: TContext,
  info: GraphQLResolveInfo
) => void
