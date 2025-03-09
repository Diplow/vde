import {
  GenericAggregate,
  GenericEntity,
  GenericEntityData,
} from "~/lib/domains/utils/entities";

// Course Entity (e.g., appetizer, main course, dessert)
export interface CourseEntityAttributes extends GenericEntityData {
  name: string;
  order: number;
  duration: number; // in minutes
}

export class CourseEntity extends GenericEntity {
  readonly data: CourseEntityAttributes;

  constructor(data: CourseEntityAttributes) {
    super(data);
    this.data = data;
  }
}

// Food Entity (specific food items)
export interface FoodEntityAttributes extends GenericEntityData {
  name: string;
  description: string;
  dietaryRestrictions: string[]; // e.g., "vegetarian", "gluten-free", etc.
  preparationTime: number; // in minutes
}

export class FoodEntity extends GenericEntity {
  readonly data: FoodEntityAttributes;

  constructor(data: FoodEntityAttributes) {
    super(data);
    this.data = data;
  }
}

// Organizer Entity (person organizing the meal)
export interface OrganizerEntityAttributes extends GenericEntityData {
  name: string;
  email: string;
  phone?: string;
  role: string; // e.g., "host", "chef", "coordinator"
}

export class OrganizerEntity extends GenericEntity {
  readonly data: OrganizerEntityAttributes;

  constructor(data: OrganizerEntityAttributes) {
    super(data);
    this.data = data;
  }
}

// Guest Aggregate (person attending the meal with preferences)
export interface GuestAttributes extends GenericEntityData {
  name: string;
  email: string;
  phone?: string;
  dietaryRestrictions: string[];
  allergies: string[];
  confirmed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GuestAggregate extends GenericAggregate {
  readonly data: GuestAttributes;
  readonly organizer: OrganizerEntity; // who invited this guest
  readonly preferredFoods: FoodEntity[]; // food preferences

  constructor(
    data: GuestAttributes,
    organizer: OrganizerEntity,
    preferredFoods: FoodEntity[] = [],
  ) {
    super(data, { organizer }, { preferredFoods });
    this.data = data;
    this.organizer = organizer;
    this.preferredFoods = preferredFoods;
  }
}

// Meal Aggregate (the entire meal event)
export interface MealAttributes extends GenericEntityData {
  title: string;
  description: string;
  location: string;
  date: Date;
  startTime: string; // e.g., "18:00"
  endTime: string; // e.g., "22:00"
  maxGuests: number;
  status: "planned" | "in-progress" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export class MealAggregate extends GenericAggregate {
  readonly data: MealAttributes;
  readonly mainOrganizer: OrganizerEntity;
  readonly courses: CourseEntity[];
  readonly foods: FoodEntity[];
  readonly guests: GuestAggregate[];
  readonly assistantOrganizers: OrganizerEntity[];

  constructor(
    data: MealAttributes,
    mainOrganizer: OrganizerEntity,
    courses: CourseEntity[] = [],
    foods: FoodEntity[] = [],
    guests: GuestAggregate[] = [],
    assistantOrganizers: OrganizerEntity[] = [],
  ) {
    super(
      data,
      { mainOrganizer },
      {
        courses,
        foods,
        guests,
        assistantOrganizers,
      },
    );

    this.data = data;
    this.mainOrganizer = mainOrganizer;
    this.courses = courses;
    this.foods = foods;
    this.guests = guests;
    this.assistantOrganizers = assistantOrganizers;
  }
}
