import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create school
  const school = await prisma.school.upsert({
    where: { id: "school-1" },
    update: {},
    create: {
      id: "school-1",
      name: "Maplewood Elementary School",
      address: "123 School Lane, Springfield, IL 62701",
      timezone: "America/Chicago",
      cutoffMinutes: 480,
      settings: {
        create: {
          allowRecurringOrders: true,
          maxItemsPerOrder: 10,
          taxRate: 0.0,
        },
      },
    },
  });

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@maplewood.edu" },
    update: {},
    create: {
      email: "admin@maplewood.edu",
      name: "School Admin",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });

  // Create teacher users
  const teacherData = [
    { email: "j.smith@maplewood.edu", firstName: "Jennifer", lastName: "Smith", grade: "Kindergarten", roomNumber: "101" },
    { email: "m.johnson@maplewood.edu", firstName: "Michael", lastName: "Johnson", grade: "1st Grade", roomNumber: "102" },
    { email: "s.williams@maplewood.edu", firstName: "Sarah", lastName: "Williams", grade: "2nd Grade", roomNumber: "201" },
    { email: "r.brown@maplewood.edu", firstName: "Robert", lastName: "Brown", grade: "3rd Grade", roomNumber: "202" },
    { email: "l.davis@maplewood.edu", firstName: "Lisa", lastName: "Davis", grade: "4th Grade", roomNumber: "301" },
    { email: "t.miller@maplewood.edu", firstName: "Thomas", lastName: "Miller", grade: "5th Grade", roomNumber: "302" },
  ];

  const teacherHash = await bcrypt.hash("teacher123", 12);
  const teachers = [];

  for (const t of teacherData) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        name: `${t.firstName} ${t.lastName}`,
        passwordHash: teacherHash,
        role: "TEACHER",
      },
    });

    const teacher = await prisma.teacher.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        schoolId: school.id,
        firstName: t.firstName,
        lastName: t.lastName,
        grade: t.grade,
        roomNumber: t.roomNumber,
      },
    });

    teachers.push(teacher);
  }

  // Create menu items
  const menuItems = [
    // Entrees
    { name: "Cheese Pizza Slice", description: "Classic tomato sauce with mozzarella on fresh-baked crust", price: 325, category: "ENTREE", sortOrder: 1 },
    { name: "Pepperoni Pizza Slice", description: "Tomato sauce, mozzarella, and pepperoni", price: 350, category: "ENTREE", sortOrder: 2 },
    { name: "Chicken Nuggets (6pc)", description: "Golden-baked chicken nuggets with dipping sauce", price: 375, category: "ENTREE", sortOrder: 3 },
    { name: "Mac & Cheese", description: "Creamy cheddar macaroni and cheese", price: 300, category: "ENTREE", sortOrder: 4 },
    { name: "Turkey & Cheese Sandwich", description: "Whole-grain bread with turkey, cheese, and lettuce", price: 325, category: "ENTREE", sortOrder: 5 },
    { name: "Grilled Cheese", description: "Buttery grilled whole wheat with cheddar", price: 275, category: "ENTREE", sortOrder: 6 },
    // Family size entrees (teachers only)
    { name: "Family Pizza (4 slices)", description: "Four slices of cheese or pepperoni pizza", price: 1100, category: "ENTREE", sortOrder: 7, isFamilySize: true },
    { name: "Family Mac & Cheese Bowl", description: "Large serving of mac and cheese for the family", price: 950, category: "ENTREE", sortOrder: 8, isFamilySize: true },
    // Sides
    { name: "Apple Slices", description: "Fresh apple slices with caramel dip", price: 100, category: "SIDE", sortOrder: 1 },
    { name: "Baby Carrots & Ranch", description: "Fresh baby carrots with ranch dressing", price: 100, category: "SIDE", sortOrder: 2 },
    { name: "Side Salad", description: "Mixed greens with choice of dressing", price: 150, category: "SIDE", sortOrder: 3 },
    { name: "Fruit Cup", description: "Seasonal fresh fruit mix", price: 125, category: "SIDE", sortOrder: 4 },
    // Drinks
    { name: "Milk (1%)", description: "Cold 1% white milk carton", price: 75, category: "DRINK", sortOrder: 1 },
    { name: "Chocolate Milk", description: "Cold chocolate milk carton", price: 75, category: "DRINK", sortOrder: 2 },
    { name: "Water Bottle", description: "Filtered water bottle (16oz)", price: 75, category: "DRINK", sortOrder: 3 },
    { name: "Apple Juice Box", description: "100% apple juice box", price: 100, category: "DRINK", sortOrder: 4 },
    // Desserts
    { name: "Chocolate Chip Cookie", description: "Freshly baked chocolate chip cookie", price: 75, category: "DESSERT", sortOrder: 1 },
    { name: "Brownie", description: "Fudgy chocolate brownie", price: 100, category: "DESSERT", sortOrder: 2 },
    { name: "Fruit Popsicle", description: "All-natural fruit popsicle", price: 100, category: "DESSERT", sortOrder: 3 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.create({
      data: {
        schoolId: school.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: true,
        isFamilySize: item.isFamilySize ?? false,
        sortOrder: item.sortOrder,
      },
    });
  }

  // Create sample parent
  const parentHash = await bcrypt.hash("parent123", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      email: "parent@example.com",
      name: "Jane Smith",
      passwordHash: parentHash,
      role: "PARENT",
    },
  });

  await prisma.child.create({
    data: {
      parentId: parent.id,
      teacherId: teachers[2].id,
      firstName: "Alex",
      lastName: "Smith",
    },
  });

  console.log("Seed completed!");
  console.log("\nTest accounts:");
  console.log("  Admin:   admin@maplewood.edu / admin123");
  console.log("  Teacher: j.smith@maplewood.edu / teacher123");
  console.log("  Parent:  parent@example.com / parent123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
