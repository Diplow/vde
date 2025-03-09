import { describe, it, expect, beforeEach } from "vitest";
import { GenericAggregate } from "~/lib/domains/utils/entities";
import { GenericAggregateMemoryRepository } from "~/lib/infrastructure/common/generic-memory-repository";
import {
  MealAggregate,
  MealAttributes,
  OrganizerEntity,
  CourseEntity,
  FoodEntity,
  GuestAggregate,
} from "~/lib/infrastructure/common/test-entities";

describe("GenericAggregateMemoryRepository", () => {
  let repository: GenericAggregateMemoryRepository<
    MealAttributes,
    MealAggregate
  >;
  let mainOrganizer: OrganizerEntity;

  beforeEach(() => {
    // Create a repository with an adapter class for MealAggregate
    repository = new GenericAggregateMemoryRepository<
      MealAttributes,
      MealAggregate
    >(
      class extends MealAggregate {
        constructor(
          data: MealAttributes,
          relatedItems: Record<string, GenericAggregate>,
          relatedLists: Record<string, GenericAggregate[]>,
        ) {
          super(
            data,
            relatedItems.mainOrganizer as OrganizerEntity,
            relatedLists.courses as CourseEntity[],
            relatedLists.foods as FoodEntity[],
            relatedLists.guests as GuestAggregate[],
            relatedLists.assistantOrganizers as OrganizerEntity[],
          );
        }
      },
    );

    // Create a main organizer for all tests
    mainOrganizer = new OrganizerEntity({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "host",
    });

    repository.reset();
  });

  describe("create", () => {
    it("should create an aggregate with auto-generated id and timestamps", async () => {
      const meal = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner party",
          location: "123 Main St",
          date: new Date("2023-12-25"),
          startTime: "18:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
        { courses: [], foods: [], guests: [], assistantOrganizers: [] },
      );

      expect(meal).toBeInstanceOf(MealAggregate);
      expect(meal.data.id).toBe(1);
      expect(meal.data.title).toBe("Dinner Party");
      expect(meal.data.createdAt).toBeInstanceOf(Date);
      expect(meal.data.updatedAt).toBeInstanceOf(Date);
      expect(meal.mainOrganizer).toBe(mainOrganizer);
      expect(meal.courses).toEqual([]);
      expect(meal.foods).toEqual([]);
      expect(meal.guests).toEqual([]);
    });

    it("should increment ids for multiple aggregates", async () => {
      const meal1 = await repository.create(
        {
          title: "Breakfast",
          description: "Morning meal",
          location: "Kitchen",
          date: new Date(),
          startTime: "08:00",
          endTime: "09:00",
          maxGuests: 4,
          status: "planned",
        },
        { mainOrganizer },
      );

      const meal2 = await repository.create(
        {
          title: "Lunch",
          description: "Midday meal",
          location: "Dining Room",
          date: new Date(),
          startTime: "12:00",
          endTime: "13:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      const meal3 = await repository.create(
        {
          title: "Dinner",
          description: "Evening meal",
          location: "Patio",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 8,
          status: "planned",
        },
        { mainOrganizer },
      );

      expect(meal1.data.id).toBe(1);
      expect(meal2.data.id).toBe(2);
      expect(meal3.data.id).toBe(3);
    });
  });

  describe("getOne", () => {
    it("should retrieve an aggregate by id", async () => {
      const created = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
      );

      const retrieved = await repository.getOne(created.data.id);

      expect(retrieved).toBeInstanceOf(MealAggregate);
      expect(retrieved.data).toEqual(created.data);
      expect(retrieved.mainOrganizer.data).toEqual(mainOrganizer.data);
    });

    it("should throw an error if aggregate not found", async () => {
      await expect(repository.getOne(999)).rejects.toThrow("not found");
    });
  });

  describe("getMany", () => {
    it("should retrieve multiple aggregates with pagination", async () => {
      await repository.create(
        {
          title: "Breakfast",
          description: "Morning meal",
          location: "Kitchen",
          date: new Date(),
          startTime: "08:00",
          endTime: "09:00",
          maxGuests: 4,
          status: "planned",
        },
        { mainOrganizer },
      );

      await repository.create(
        {
          title: "Lunch",
          description: "Midday meal",
          location: "Dining Room",
          date: new Date(),
          startTime: "12:00",
          endTime: "13:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      await repository.create(
        {
          title: "Dinner",
          description: "Evening meal",
          location: "Patio",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 8,
          status: "planned",
        },
        { mainOrganizer },
      );

      const meals = await repository.getMany(2, 0);
      expect(meals).toHaveLength(2);
      expect(meals[0]?.data.title).toBe("Breakfast");
      expect(meals[1]?.data.title).toBe("Lunch");

      const nextPage = await repository.getMany(2, 2);
      expect(nextPage).toHaveLength(1);
      expect(nextPage[0]?.data.title).toBe("Dinner");
    });

    it("should return empty array if no aggregates", async () => {
      const meals = await repository.getMany();
      expect(meals).toEqual([]);
    });
  });

  describe("getByField", () => {
    it("should retrieve aggregates by field value", async () => {
      await repository.create(
        {
          title: "Dinner 1",
          description: "First dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      await repository.create(
        {
          title: "Lunch",
          description: "Midday meal",
          location: "Office",
          date: new Date(),
          startTime: "12:00",
          endTime: "13:00",
          maxGuests: 4,
          status: "completed",
        },
        { mainOrganizer },
      );

      await repository.create(
        {
          title: "Dinner 2",
          description: "Second dinner",
          location: "Restaurant",
          date: new Date(),
          startTime: "20:00",
          endTime: "22:00",
          maxGuests: 8,
          status: "planned",
        },
        { mainOrganizer },
      );

      const plannedMeals = await repository.getByField("status", "planned");
      expect(plannedMeals).toHaveLength(2);
      expect(plannedMeals[0]?.data.title).toBe("Dinner 1");
      expect(plannedMeals[1]?.data.title).toBe("Dinner 2");

      const completedMeals = await repository.getByField("status", "completed");
      expect(completedMeals).toHaveLength(1);
      expect(completedMeals[0]?.data.title).toBe("Lunch");
    });

    it("should return empty array if no matching aggregates", async () => {
      await repository.create(
        {
          title: "Dinner",
          description: "Evening meal",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      const cancelledMeals = await repository.getByField("status", "cancelled");
      expect(cancelledMeals).toEqual([]);
    });
  });

  describe("getByRelatedItem", () => {
    it("should retrieve aggregates by related item id", async () => {
      const organizer1 = new OrganizerEntity({
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "host",
      });

      const organizer2 = new OrganizerEntity({
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "chef",
      });

      // Create meals with explicitly different dates to ensure consistent ordering
      const breakfastDate = new Date("2023-01-01T08:00:00Z");
      const dinnerDate = new Date("2023-01-01T19:00:00Z"); // Same day but later time

      await repository.create(
        {
          title: "Breakfast",
          description: "Morning meal",
          location: "Kitchen",
          date: breakfastDate,
          startTime: "08:00",
          endTime: "09:00",
          maxGuests: 4,
          status: "planned",
        },
        { mainOrganizer: organizer1 },
      );

      await repository.create(
        {
          title: "Lunch",
          description: "Midday meal",
          location: "Dining Room",
          date: new Date("2023-01-01T12:00:00Z"),
          startTime: "12:00",
          endTime: "13:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer: organizer2 },
      );

      await repository.create(
        {
          title: "Dinner",
          description: "Evening meal",
          location: "Patio",
          date: dinnerDate,
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 8,
          status: "planned",
        },
        { mainOrganizer: organizer1 },
      );

      const organizer1Meals = await repository.getByRelatedItem(
        "mainOrganizer",
        1,
      );
      expect(organizer1Meals).toHaveLength(2);

      // Instead of relying on order, check that both meals are present
      const mealTitles = organizer1Meals.map((meal) => meal.data.title);
      expect(mealTitles).toContain("Breakfast");
      expect(mealTitles).toContain("Dinner");

      // If you need to verify specific ordering, sort the results yourself
      const sortedMeals = [...organizer1Meals].sort(
        (a, b) => b.data.date.getTime() - a.data.date.getTime(),
      );
      expect(sortedMeals[0]?.data.title).toBe("Dinner");
      expect(sortedMeals[1]?.data.title).toBe("Breakfast");

      const organizer2Meals = await repository.getByRelatedItem(
        "mainOrganizer",
        2,
      );
      expect(organizer2Meals).toHaveLength(1);
      expect(organizer2Meals[0]?.data.title).toBe("Lunch");
    });

    it("should return empty array if no matching related items", async () => {
      await repository.create(
        {
          title: "Dinner",
          description: "Evening meal",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      const nonExistentOrganizerMeals = await repository.getByRelatedItem(
        "mainOrganizer",
        999,
      );
      expect(nonExistentOrganizerMeals).toEqual([]);
    });
  });

  describe("update", () => {
    it("should update an aggregate's data", async () => {
      const meal = await repository.create(
        {
          title: "Original Title",
          description: "Original description",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      const updated = await repository.update(meal.data.id, {
        title: "Updated Title",
        description: "Updated description",
        maxGuests: 10,
      });

      expect(updated.data.title).toBe("Updated Title");
      expect(updated.data.description).toBe("Updated description");
      expect(updated.data.maxGuests).toBe(10);
      expect(updated.data.location).toBe("Home"); // Unchanged
      expect(updated.data.updatedAt).not.toEqual(meal.data.updatedAt);

      // Verify the update persisted
      const retrieved = await repository.getOne(meal.data.id);
      expect(retrieved.data).toEqual(updated.data);
    });

    it("should update only specified fields", async () => {
      const meal = await repository.create(
        {
          title: "Original Title",
          description: "Original description",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      const updated = await repository.update(meal.data.id, {
        title: "Updated Title",
      });

      expect(updated.data.title).toBe("Updated Title");
      expect(updated.data.description).toBe("Original description"); // Unchanged
      expect(updated.data.location).toBe("Home"); // Unchanged
    });

    it("should throw an error if aggregate not found", async () => {
      await expect(
        repository.update(999, { title: "Updated Title" }),
      ).rejects.toThrow("not found");
    });
  });

  describe("updateRelatedItem", () => {
    it("should update a related item", async () => {
      const meal = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
      );

      const newOrganizer = new OrganizerEntity({
        id: 2,
        name: "Jane Smith",
        email: "jane@example.com",
        role: "chef",
      });

      const updated = await repository.updateRelatedItem(
        meal.data.id,
        "mainOrganizer",
        newOrganizer,
      );

      expect(updated.mainOrganizer.data.id).toBe(2);
      expect(updated.mainOrganizer.data.name).toBe("Jane Smith");

      // Verify the update persisted
      const retrieved = await repository.getOne(meal.data.id);
      expect(retrieved.mainOrganizer.data).toEqual(newOrganizer.data);
    });
  });

  describe("addToRelatedList", () => {
    it("should add an item to a related list", async () => {
      const meal = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
        { courses: [], foods: [], guests: [], assistantOrganizers: [] },
      );

      const appetizer = new CourseEntity({
        id: 1,
        name: "Appetizer",
        order: 1,
        duration: 30,
      });

      const updated = await repository.addToRelatedList(
        meal.data.id,
        "courses",
        appetizer,
      );

      expect(updated.courses).toHaveLength(1);
      expect(updated.courses[0]?.data.name).toBe("Appetizer");

      // Add a second course
      const mainCourse = new CourseEntity({
        id: 2,
        name: "Main Course",
        order: 2,
        duration: 60,
      });

      const updatedAgain = await repository.addToRelatedList(
        meal.data.id,
        "courses",
        mainCourse,
      );

      expect(updatedAgain.courses).toHaveLength(2);
      expect(updatedAgain.courses[0]?.data.name).toBe("Appetizer");
      expect(updatedAgain.courses[1]?.data.name).toBe("Main Course");
    });
  });

  describe("removeFromRelatedList", () => {
    it("should remove an item from a related list", async () => {
      const appetizer = new CourseEntity({
        id: 1,
        name: "Appetizer",
        order: 1,
        duration: 30,
      });

      const mainCourse = new CourseEntity({
        id: 2,
        name: "Main Course",
        order: 2,
        duration: 60,
      });

      const dessert = new CourseEntity({
        id: 3,
        name: "Dessert",
        order: 3,
        duration: 30,
      });

      const meal = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
        {
          courses: [appetizer, mainCourse, dessert],
          foods: [],
          guests: [],
          assistantOrganizers: [],
        },
      );

      const updated = await repository.removeFromRelatedList(
        meal.data.id,
        "courses",
        2,
      );

      expect(updated.courses).toHaveLength(2);
      expect(updated.courses[0]?.data.name).toBe("Appetizer");
      expect(updated.courses[1]?.data.name).toBe("Dessert");

      // Verify the main course was removed
      const retrieved = await repository.getOne(meal.data.id);
      expect(retrieved.courses).toHaveLength(2);
      expect(
        retrieved.courses.find((course) => course.data.id === 2),
      ).toBeUndefined();
    });
  });

  describe("remove", () => {
    it("should remove an aggregate", async () => {
      const meal = await repository.create(
        {
          title: "Dinner Party",
          description: "A fancy dinner",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "22:00",
          maxGuests: 10,
          status: "planned",
        },
        { mainOrganizer },
      );

      await repository.remove(meal.data.id);

      // Verify the aggregate was removed
      await expect(repository.getOne(meal.data.id)).rejects.toThrow(
        "not found",
      );
    });

    it("should throw an error if aggregate not found", async () => {
      await expect(repository.remove(999)).rejects.toThrow("not found");
    });
  });

  describe("reset", () => {
    it("should clear all aggregates and reset id counter", async () => {
      await repository.create(
        {
          title: "Breakfast",
          description: "Morning meal",
          location: "Kitchen",
          date: new Date(),
          startTime: "08:00",
          endTime: "09:00",
          maxGuests: 4,
          status: "planned",
        },
        { mainOrganizer },
      );

      await repository.create(
        {
          title: "Lunch",
          description: "Midday meal",
          location: "Dining Room",
          date: new Date(),
          startTime: "12:00",
          endTime: "13:00",
          maxGuests: 6,
          status: "planned",
        },
        { mainOrganizer },
      );

      repository.reset();

      // Verify all aggregates are removed
      const meals = await repository.getMany();
      expect(meals).toEqual([]);

      // Verify id counter is reset
      const newMeal = await repository.create(
        {
          title: "New Meal",
          description: "Fresh start",
          location: "Home",
          date: new Date(),
          startTime: "19:00",
          endTime: "21:00",
          maxGuests: 8,
          status: "planned",
        },
        { mainOrganizer },
      );
      expect(newMeal.data.id).toBe(1);
    });
  });
});
