export class MappingUtils {
  static validatePaginationParameters(limit?: number, offset?: number) {
    return {
      limit: limit && limit > 0 ? Math.min(limit, 100) : 50,
      offset: offset && offset >= 0 ? offset : 0,
    };
  }
}
