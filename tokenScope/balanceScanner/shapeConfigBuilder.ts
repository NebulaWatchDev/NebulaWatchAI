export interface QueryDimension {
  field: string
  type: "string" | "number" | "boolean"
  required: boolean
  default?: any
}

export interface QueryShape {
  dimensions: QueryDimension[]
  validate(input: Record<string, unknown>): boolean
  buildDefaults(): Record<string, unknown>
}

export class ShapeConfigBuilder implements QueryShape {
  dimensions: QueryDimension[]

  constructor(dimensions: QueryDimension[]) {
    this.dimensions = dimensions
  }

  validate(input: Record<string, unknown>): boolean {
    return this.dimensions.every((dim) => {
      if (dim.required && !(dim.field in input)) return false
      if (dim.type && typeof input[dim.field] !== dim.type)
        return false
      return true
    })
  }

  buildDefaults(): Record<string, unknown> {
    const defaults: Record<string, unknown> = {}
    this.dimensions.forEach((dim) => {
      if (dim.default !== undefined) {
        defaults[dim.field] = dim.default
      }
    })
    return defaults
  }

  describe(): string[] {
    return this.dimensions.map(
      (d) => `${d.field} (${d.type})${d.required ? " *" : ""}`
    )
  }

  addField(field: QueryDimension): void {
    this.dimensions.push(field)
  }

  removeField(fieldName: string): void {
    this.dimensions = this.dimensions.filter((f) => f.field !== fieldName)
  }

  getFieldNames(): string[] {
    return this.dimensions.map((f) => f.field)
  }

  isFieldRequired(name: string): boolean {
    const found = this.dimensions.find((f) => f.field === name)
    return !!found?.required
  }
}
