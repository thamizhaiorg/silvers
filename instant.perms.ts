// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react-native";

const rules = {
  /**
   * Welcome to Instant's permission system!
   * Right now your rules are empty. To start filling them in, check out the docs:
   * https://www.instantdb.com/docs/permissions
   *
   * Here's an example to give you a feel:
   * posts: {
   *   allow: {
   *     view: "true",
   *     create: "isOwner",
   *     update: "isOwner",
   *     delete: "isOwner",
   *   },
   *   bind: ["isOwner", "auth.id != null && auth.id == data.ownerId"],
   * },
   */
  
  // Favorites permissions - users can only manage their own favorites
  favorites: {
    allow: {
      view: "isOwner",
      create: "isAuthenticated",
      update: "isOwner",
      delete: "isOwner",
    },
    bind: [
      "isOwner", "auth.id != null && auth.id == data.userId",
      "isAuthenticated", "auth.id != null"
    ],
  },
  
  // Products should be viewable by everyone
  products: {
    allow: {
      view: "true",
      create: "false", // Only admins should create products
      update: "false", // Only admins should update products
      delete: "false", // Only admins should delete products
    },
  },
} satisfies InstantRules;

export default rules;
