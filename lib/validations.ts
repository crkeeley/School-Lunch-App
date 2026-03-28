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

export const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(1),
  category: z.string(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  isFamilySize: z.boolean().default(false),
});
