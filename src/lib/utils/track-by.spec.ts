import {
  trackByIndex,
  trackByField,
  trackByAuto,
  trackByFieldThenAutoThenIndex,
} from "./track-by";

interface User {
  id?: number;
  _id?: string;
  name?: string;
}

interface Product {
  sku?: string;
  title?: string;
}

describe("TrackBy Utilities", () => {
  describe("trackByIndex", () => {
    it("should return the index for any item", () => {
      const fn = trackByIndex<any>();
      expect(fn(0, { a: 1 })).toBe(0);
      expect(fn(1, "x")).toBe(1);
      expect(fn(2, null)).toBe(2);
      expect(fn(3, undefined)).toBe(3);
    });
  });

  describe("trackByField", () => {
    it("should use the specified field value when present", () => {
      const fn = trackByField<User>("id");
      const u1: User = { id: 42, name: "Alice" };
      const u2: User = { id: 7, name: "Bob" };
      expect(fn(0, u1)).toBe(42);
      expect(fn(1, u2)).toBe(7);
    });

    it("should fall back to index when the field is missing", () => {
      const fn = trackByField<User>("id");
      const u1: User = { name: "No ID" };
      expect(fn(5, u1)).toBe(5);
    });

    it("should work with arbitrary field names", () => {
      const fn = trackByField<Product>("sku");
      const p1: Product = { sku: "ABC123", title: "Headphones" };
      const p2: Product = { title: "No SKU" };
      expect(fn(10, p1)).toBe("ABC123");
      expect(fn(11, p2)).toBe(11);
    });

    it("should accept string field names even if not typed", () => {
      const fn = trackByField<any>("customKey");
      const obj = { customKey: "KEY-1" };
      expect(fn(2, obj)).toBe("KEY-1");
    });
  });

  describe("trackByAuto", () => {
    it("should use 'id' when present", () => {
      const fn = trackByAuto<User>();
      const u: User = { id: 99, name: "Carol" };
      expect(fn(0, u)).toBe(99);
    });

    it("should use '_id' when 'id' is not present", () => {
      const fn = trackByAuto<User>();
      const u: User = { _id: "mongo-1", name: "Dave" };
      expect(fn(1, u)).toBe("mongo-1");
    });

    it("should fall back to index when neither id nor _id is present", () => {
      const fn = trackByAuto<User>();
      const u: User = { name: "Eve" };
      expect(fn(3, u)).toBe(3);
    });

    it("should fall back to index for primitives", () => {
      const fn = trackByAuto<any>();
      expect(fn(7, "a")).toBe(7);
      expect(fn(8, 123)).toBe(8);
      expect(fn(9, true)).toBe(9);
      expect(fn(10, null)).toBe(10);
      expect(fn(11, undefined)).toBe(11);
    });
  });

  describe("trackByFieldThenAutoThenIndex", () => {
    it("should prefer provided field value over auto and index", () => {
      const fn = trackByFieldThenAutoThenIndex<User>("id");
      const u: User = { id: 123, _id: "alt", name: "Frank" };
      expect(fn(0, u)).toBe(123);
    });

    it("should use auto id when field is missing", () => {
      const fn = trackByFieldThenAutoThenIndex<User>("id");
      const u: User = { _id: "mongo-9", name: "Grace" };
      // Field 'id' missing -> use auto '_id'
      expect(fn(5, u)).toBe("mongo-9");
    });

    it("should fall back to index when neither field nor auto id exists", () => {
      const fn = trackByFieldThenAutoThenIndex<User>("id");
      const u: User = { name: "Henry" };
      expect(fn(12, u)).toBe(12);
    });

    it("should behave like auto->index when no field is provided", () => {
      const fn = trackByFieldThenAutoThenIndex<User>(null);
      const withId: User = { id: 1 };
      const withMongoId: User = { _id: "m1" };
      const withoutId: User = { name: "No IDs" };
      expect(fn(2, withId)).toBe(1);
      expect(fn(3, withMongoId)).toBe("m1");
      expect(fn(4, withoutId)).toBe(4);
    });

    it("should treat undefined field the same as null (auto->index)", () => {
      const fn = trackByFieldThenAutoThenIndex<User>(undefined);
      const u1: User = { id: 50 };
      const u2: User = { name: "No IDs" };
      expect(fn(6, u1)).toBe(50);
      expect(fn(7, u2)).toBe(7);
    });

    it("should handle primitives by falling back to index", () => {
      const fn = trackByFieldThenAutoThenIndex<any>("id");
      expect(fn(0, "x")).toBe(0);
      expect(fn(1, 42)).toBe(1);
      expect(fn(2, true)).toBe(2);
    });
  });

  describe("composability and stability", () => {
    it("trackByField should return consistent keys across calls", () => {
      const fn = trackByField<{ code: string }>("code");
      const item = { code: "C-1" };
      expect(fn(0, item)).toBe("C-1");
      expect(fn(1, item)).toBe("C-1");
      expect(fn(2, item)).toBe("C-1");
    });

    it("trackByAuto should prefer 'id' over '_id' when both exist", () => {
      const fn = trackByAuto<any>();
      const item = { id: 10, _id: "X-10" };
      expect(fn(0, item)).toBe(10);
    });

    it("trackByFieldThenAutoThenIndex should be resilient to missing fields", () => {
      const fn = trackByFieldThenAutoThenIndex<Product>("sku");
      const p1: Product = { sku: "S-1", title: "One" };
      const p2: Product = { title: "No SKU" };
      expect(fn(0, p1)).toBe("S-1");
      expect(fn(1, p2)).toBe(1); // fallback to index
    });
  });
});
