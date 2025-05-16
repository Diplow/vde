import {
  GenericAggregate,
  GenericAggregateConstructorArgs,
} from "~/lib/domains/utils/generic-objects";

// Course Entity (e.g., appetizer, main course, dessert)
export interface CourseEntityAttributes {
  name: string;
  order: number;
  duration: number; // in minutes
}

export class CourseEntity extends GenericAggregate<CourseEntityAttributes> {}

// Food Entity (specific food items)
export interface FoodEntityAttributes {
  name: string;
  descr: string;
  dietaryRestrictions: string[]; // e.g., "vegetarian", "gluten-free", etc.
  preparationTime: number; // in minutes
}

export class FoodEntity extends GenericAggregate<FoodEntityAttributes> {}

// Organizer Entity (person organizing the meal)
export interface OrganizerEntityAttributes {
  name: string;
  email: string;
  phone?: string;
  role: string; // e.g., "host", "chef", "coordinator"
}

export class OrganizerEntity extends GenericAggregate<OrganizerEntityAttributes> {}

// Guest Aggregate (person attending the meal with prefs)
export interface GuestAttributes {
  name: string;
  email: string;
  phone?: string;
  dietaryRestrictions: string[];
  allergies: string[];
  confirmed: boolean;
}

export interface GuestAggregateConstructorArgs
  extends GenericAggregateConstructorArgs<GuestAttributes> {
  organizer: OrganizerEntity;
  preferredFoods: FoodEntity[];
}

export class GuestAggregate extends GenericAggregate<GuestAttributes> {
  readonly organizer: OrganizerEntity; // who invited this guest
  readonly preferredFoods: FoodEntity[]; // food prefs

  constructor(args: GuestAggregateConstructorArgs) {
    const { organizer, preferredFoods, ...rest } = args;
    super({
      ...rest,
      relatedItems: { organizer },
      relatedLists: { preferredFoods },
    });
    this.organizer = organizer;
    this.preferredFoods = preferredFoods;
  }
}

// Meal Aggregate (the entire meal event)
export interface MealAttributes {
  title: string;
  descr: string;
  location: string;
  date: Date;
  startTime: string; // e.g., "18:00"
  endTime: string; // e.g., "22:00"
  maxGuests: number;
  status: "planned" | "in-progress" | "completed" | "cancelled";
}

export interface MealAggregateConstructorArgs
  extends GenericAggregateConstructorArgs<MealAttributes> {
  mainOrganizer: OrganizerEntity;
  courses: CourseEntity[];
  foods: FoodEntity[];
  guests: GuestAggregate[];
  assistantOrganizers: OrganizerEntity[];
}

export class MealAggregate extends GenericAggregate<MealAttributes> {
  readonly mainOrganizer: OrganizerEntity;
  readonly courses: CourseEntity[];
  readonly foods: FoodEntity[];
  readonly guests: GuestAggregate[];
  readonly assistantOrganizers: OrganizerEntity[];

  constructor(args: MealAggregateConstructorArgs) {
    const {
      mainOrganizer,
      courses,
      foods,
      guests,
      assistantOrganizers,
      ...rest
    } = args;
    super({
      ...rest,
      relatedItems: { mainOrganizer },
      relatedLists: { courses, foods, guests, assistantOrganizers },
    });
    this.mainOrganizer = mainOrganizer;
    this.courses = courses;
    this.foods = foods;
    this.guests = guests;
    this.assistantOrganizers = assistantOrganizers;
  }
}
