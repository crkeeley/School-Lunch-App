import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  childFirstName: z.string().min(1, "Child's first name is required"),
  childLastName: z.string().min(1, "Child's last name is required"),
  teacherId: z.string().min(1, "Please select a homeroom teacher"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const orderItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().min(1).max(10),
});

export const createOrderSchema = z.object({
  childId: z.string(),
  teacherId: z.string(),
  deliveryDate: z.string(),
  items: z.array(orderItemSchema).min(1, "Please add at least one item"),
  notes: z.string().optional(),
});

export const recurringRuleSchema = z.object({
  childId: z.string(),
  startDate: z.string(),
  endDate: z.string().optional(),
  daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
  items: z.array(orderItemSchema).min(1),
});

export const childSchema = z.object({
  teacherId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  allergies: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export const teacherOrderSchema = z.object({
  deliveryDate: z.string(),
  notes: z.string().max(2000).optional(),
  items: z.array(orderItemSchema).min(1, "Please add at least one item"),
  schoolId: z.string().min(1).optional(),
});

export const teacherCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  grade: z.string().max(50).optional(),
  roomNumber: z.string().max(50).optional(),
  password: z.string().min(12, "Password must be at least 12 characters"),
  schoolId: z.string().min(1).optional(),
});

export const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(1),
  category: z.string(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isFamilySize: z.boolean().default(false),
  schoolId: z.string().min(1).optional(),
});
