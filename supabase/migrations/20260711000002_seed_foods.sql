-- Seed ~100 staple foods, per 100 g. Values are USDA SR Legacy / FDC derived
-- (source 'usda'), AFCD-style Australian items (source 'afcd'), or
-- representative label values (source 'custom' — e.g. whey, where branded
-- data varies; replace with your brand via a custom food if needed).
-- Verified live against the FDC API on 2026-07-11: white rice (cooked),
-- chicken breast (cooked), egg (whole, raw), rolled oats (dry).
-- user_id stays null: global rows, read-only to the app user (RLS).

insert into public.foods
  (name, brand, source, kcal, protein_g, carbs_g, fat_g, fibre_g, sodium_mg, potassium_mg, iron_mg, calcium_mg)
values
  -- Proteins
  ('Chicken breast, cooked', null, 'usda', 165, 31.0, 0, 3.57, 0, 74, 256, 1.04, 15),
  ('Chicken thigh, cooked', null, 'usda', 209, 26.0, 0, 10.9, 0, 84, 222, 1.3, 12),
  ('Beef mince, lean, cooked', null, 'usda', 171, 26.1, 0, 6.6, 0, 72, 350, 2.4, 12),
  ('Beef steak, lean, grilled', null, 'usda', 187, 28.0, 0, 7.6, 0, 60, 330, 2.7, 10),
  ('Lamb, lean, cooked', null, 'usda', 206, 25.5, 0, 11.0, 0, 72, 310, 1.9, 12),
  ('Pork loin, lean, cooked', null, 'usda', 173, 27.0, 0, 6.5, 0, 55, 370, 0.9, 10),
  ('Salmon, cooked', null, 'usda', 206, 22.1, 0, 12.4, 0, 61, 384, 0.3, 15),
  ('Salmon, smoked', null, 'usda', 117, 18.3, 0, 4.3, 0, 784, 175, 0.85, 11),
  ('Tuna, canned in springwater, drained', null, 'usda', 116, 25.5, 0, 0.8, 0, 247, 237, 1.5, 11),
  ('White fish, cooked', null, 'usda', 121, 24.0, 0, 2.5, 0, 80, 400, 0.3, 20),
  ('Prawns, cooked', null, 'usda', 99, 21.0, 1.0, 0.3, 0, 200, 260, 0.5, 70),
  ('Egg, whole, raw', null, 'usda', 143, 12.6, 0.72, 9.51, 0, 142, 138, 1.75, 56),
  ('Egg, whole, boiled', null, 'usda', 155, 12.6, 1.12, 10.6, 0, 124, 126, 1.19, 50),
  ('Egg white, raw', null, 'usda', 52, 10.9, 0.73, 0.17, 0, 166, 163, 0.08, 7),
  ('Whey protein powder', null, 'custom', 397, 80.0, 7.5, 5.5, 0.5, 180, 500, 1.0, 450),
  ('Greek yogurt, plain, full fat', null, 'usda', 97, 9.0, 3.98, 5.0, 0, 35, 141, 0.04, 100),
  ('Greek yogurt, plain, nonfat', null, 'usda', 59, 10.2, 3.6, 0.39, 0, 36, 141, 0.07, 110),
  ('Cottage cheese', null, 'usda', 98, 11.1, 3.38, 4.3, 0, 364, 104, 0.07, 83),
  ('Tofu, firm', null, 'usda', 76, 8.1, 1.88, 4.78, 0.3, 7, 121, 1.61, 350),
  ('Tempeh', null, 'usda', 193, 20.3, 7.64, 10.8, 1.4, 9, 412, 2.7, 111),
  ('Bacon, cooked', null, 'usda', 541, 37.0, 1.35, 41.8, 0, 2310, 565, 1.44, 11),
  ('Ham, sliced', null, 'usda', 145, 20.9, 1.5, 5.5, 0, 1200, 287, 0.8, 7),
  ('Turkey breast, cooked', null, 'usda', 135, 30.1, 0, 0.7, 0, 99, 249, 0.7, 7),
  ('Protein bar', null, 'custom', 380, 30.0, 40.0, 12.0, 5.0, 300, 250, 3.0, 150),

  -- Grains & starches
  ('Rice, white, cooked', null, 'usda', 130, 2.69, 28.2, 0.28, 0.4, 1, 35, 1.2, 10),
  ('Rice, brown, cooked', null, 'usda', 123, 2.74, 25.6, 0.97, 1.6, 4, 86, 0.56, 3),
  ('Rice, basmati, cooked', null, 'usda', 121, 3.5, 25.2, 0.4, 0.6, 2, 40, 0.4, 10),
  ('Pasta, cooked', null, 'usda', 158, 5.8, 30.9, 0.93, 1.8, 1, 44, 1.28, 7),
  ('Pasta, wholemeal, cooked', null, 'usda', 124, 5.33, 26.5, 0.54, 3.9, 4, 62, 1.06, 15),
  ('Oats, rolled, dry', null, 'usda', 379, 13.2, 67.7, 6.52, 10.1, 6, 362, 4.25, 52),
  ('Weet-Bix', 'Sanitarium', 'afcd', 355, 12.4, 67.0, 1.4, 11.0, 270, 350, 10.0, 35),
  ('Bread, white', null, 'usda', 266, 8.9, 50.6, 3.33, 2.4, 490, 126, 3.6, 144),
  ('Bread, wholemeal', null, 'usda', 250, 12.3, 42.8, 3.5, 6.0, 450, 248, 2.3, 107),
  ('Wrap, plain flour', null, 'usda', 306, 8.2, 49.4, 7.99, 3.5, 736, 125, 3.63, 150),
  ('Potato, boiled', null, 'usda', 87, 1.87, 20.1, 0.1, 1.8, 4, 379, 0.31, 5),
  ('Sweet potato, boiled', null, 'usda', 76, 1.37, 17.7, 0.14, 2.5, 27, 230, 0.72, 27),
  ('Quinoa, cooked', null, 'usda', 120, 4.4, 21.3, 1.92, 2.8, 7, 172, 1.49, 17),
  ('Couscous, cooked', null, 'usda', 112, 3.79, 23.2, 0.16, 1.4, 5, 58, 0.38, 8),
  ('Rice cakes', null, 'usda', 387, 8.2, 81.5, 2.8, 4.2, 71, 428, 1.49, 11),
  ('Noodles, egg, cooked', null, 'usda', 138, 4.54, 25.2, 2.07, 1.2, 5, 38, 1.47, 12),
  ('Corn flakes', null, 'usda', 357, 7.5, 84.0, 0.4, 3.3, 729, 168, 8.0, 5),
  ('Muesli, untoasted', null, 'afcd', 340, 9.7, 66.0, 5.9, 7.3, 30, 390, 3.9, 50),
  ('Granola, toasted', null, 'usda', 471, 10.0, 64.0, 20.0, 7.0, 20, 400, 3.0, 60),

  -- Fruit
  ('Banana', null, 'usda', 89, 1.09, 22.8, 0.33, 2.6, 1, 358, 0.26, 5),
  ('Apple', null, 'usda', 52, 0.26, 13.8, 0.17, 2.4, 1, 107, 0.12, 6),
  ('Orange', null, 'usda', 47, 0.94, 11.8, 0.12, 2.4, 0, 181, 0.1, 40),
  ('Strawberries', null, 'usda', 32, 0.67, 7.68, 0.3, 2.0, 1, 153, 0.41, 16),
  ('Blueberries', null, 'usda', 57, 0.74, 14.5, 0.33, 2.4, 1, 77, 0.28, 6),
  ('Grapes', null, 'usda', 69, 0.72, 18.1, 0.16, 0.9, 2, 191, 0.36, 10),
  ('Mango', null, 'usda', 60, 0.82, 15.0, 0.38, 1.6, 1, 168, 0.16, 11),
  ('Watermelon', null, 'usda', 30, 0.61, 7.55, 0.15, 0.4, 1, 112, 0.24, 7),
  ('Kiwifruit', null, 'usda', 61, 1.14, 14.7, 0.52, 3.0, 3, 312, 0.31, 34),
  ('Avocado', null, 'usda', 160, 2.0, 8.53, 14.7, 6.7, 7, 485, 0.55, 12),

  -- Vegetables
  ('Broccoli, cooked', null, 'usda', 35, 2.38, 7.18, 0.41, 3.3, 41, 293, 0.67, 40),
  ('Carrot, raw', null, 'usda', 41, 0.93, 9.58, 0.24, 2.8, 69, 320, 0.3, 33),
  ('Spinach, raw', null, 'usda', 23, 2.86, 3.63, 0.39, 2.2, 79, 558, 2.71, 99),
  ('Lettuce', null, 'usda', 15, 1.36, 2.87, 0.15, 1.3, 28, 194, 0.86, 36),
  ('Tomato', null, 'usda', 18, 0.88, 3.89, 0.2, 1.2, 5, 237, 0.27, 10),
  ('Cucumber', null, 'usda', 15, 0.65, 3.63, 0.11, 0.5, 2, 147, 0.28, 16),
  ('Capsicum, red', null, 'usda', 31, 0.99, 6.03, 0.3, 2.1, 4, 211, 0.43, 7),
  ('Onion', null, 'usda', 40, 1.1, 9.34, 0.1, 1.7, 4, 146, 0.21, 23),
  ('Mushroom', null, 'usda', 22, 3.09, 3.26, 0.34, 1.0, 5, 318, 0.5, 3),
  ('Zucchini', null, 'usda', 17, 1.21, 3.11, 0.32, 1.0, 8, 261, 0.37, 16),
  ('Green beans', null, 'usda', 31, 1.83, 6.97, 0.22, 2.7, 6, 211, 1.03, 37),
  ('Peas, frozen', null, 'usda', 77, 5.15, 13.7, 0.4, 4.5, 3, 153, 1.52, 27),
  ('Corn kernels', null, 'usda', 86, 3.27, 18.7, 1.35, 2.0, 15, 270, 0.52, 2),
  ('Pumpkin', null, 'usda', 26, 1.0, 6.5, 0.1, 0.5, 1, 340, 0.8, 21),
  ('Cauliflower', null, 'usda', 25, 1.92, 4.97, 0.28, 2.0, 30, 299, 0.42, 22),
  ('Mixed vegetables, frozen', null, 'usda', 65, 3.3, 13.5, 0.5, 4.0, 35, 250, 1.2, 25),

  -- Legumes
  ('Chickpeas, canned, drained', null, 'usda', 139, 7.05, 22.5, 2.77, 6.4, 246, 172, 1.07, 45),
  ('Kidney beans, canned, drained', null, 'usda', 127, 8.67, 22.8, 0.5, 6.4, 231, 403, 1.17, 35),
  ('Lentils, cooked', null, 'usda', 116, 9.02, 20.1, 0.38, 7.9, 2, 369, 3.33, 19),
  ('Black beans, cooked', null, 'usda', 132, 8.86, 23.7, 0.54, 8.7, 1, 355, 2.1, 27),
  ('Baked beans, canned', null, 'afcd', 94, 4.8, 17.5, 0.5, 4.9, 422, 300, 1.4, 50),
  ('Hummus', null, 'usda', 166, 7.9, 14.3, 9.6, 6.0, 379, 228, 2.44, 38),

  -- Dairy & alternatives
  ('Milk, full cream', null, 'usda', 61, 3.15, 4.8, 3.25, 0, 43, 132, 0.03, 113),
  ('Milk, skim', null, 'usda', 34, 3.37, 4.96, 0.08, 0, 42, 156, 0.03, 122),
  ('Milk, soy', null, 'usda', 43, 3.1, 4.9, 1.5, 0.4, 44, 122, 0.42, 123),
  ('Milk, almond, unsweetened', null, 'usda', 15, 0.6, 0.6, 1.1, 0.4, 72, 67, 0.28, 184),
  ('Cheese, cheddar', null, 'usda', 404, 24.9, 1.28, 33.1, 0, 621, 98, 0.68, 721),
  ('Cheese, mozzarella', null, 'usda', 300, 22.2, 2.19, 22.4, 0, 627, 76, 0.44, 505),
  ('Cream, thickened', null, 'afcd', 340, 2.1, 3.0, 35.9, 0, 30, 80, 0.1, 60),
  ('Ice cream, vanilla', null, 'usda', 207, 3.5, 23.6, 11.0, 0.7, 80, 199, 0.09, 128),

  -- Fats, nuts & spreads
  ('Olive oil', null, 'usda', 884, 0, 0, 100, 0, 2, 1, 0.56, 1),
  ('Butter', null, 'usda', 717, 0.85, 0.06, 81.1, 0, 643, 24, 0.02, 24),
  ('Peanut butter', null, 'usda', 588, 25.1, 19.6, 50.4, 6.0, 476, 649, 1.74, 49),
  ('Almonds', null, 'usda', 579, 21.2, 21.6, 49.9, 12.5, 1, 733, 3.71, 269),
  ('Walnuts', null, 'usda', 654, 15.2, 13.7, 65.2, 6.7, 2, 441, 2.91, 98),
  ('Cashews', null, 'usda', 553, 18.2, 30.2, 43.9, 3.3, 12, 660, 6.68, 37),

  -- Condiments & extras
  ('Honey', null, 'usda', 304, 0.3, 82.4, 0, 0.2, 4, 52, 0.42, 6),
  ('Jam', null, 'usda', 278, 0.37, 68.9, 0.07, 1.1, 32, 77, 0.49, 20),
  ('Sugar, white', null, 'usda', 387, 0, 100, 0, 0, 1, 2, 0.05, 1),
  ('Maple syrup', null, 'usda', 260, 0.04, 67.0, 0.06, 0, 12, 212, 0.11, 102),
  ('Tomato sauce', null, 'usda', 101, 1.04, 27.4, 0.1, 0.3, 907, 281, 0.35, 15),
  ('BBQ sauce', null, 'usda', 172, 0.8, 40.8, 0.6, 0.9, 1027, 232, 0.64, 33),
  ('Soy sauce', null, 'usda', 53, 8.14, 4.93, 0.57, 0.8, 5493, 435, 1.45, 33),
  ('Mayonnaise', null, 'usda', 680, 0.96, 0.57, 74.9, 0, 635, 20, 0.21, 8),
  ('Dark chocolate, 70-85%', null, 'usda', 598, 7.79, 45.9, 42.6, 10.9, 20, 715, 11.9, 73),
  ('Milk chocolate', null, 'usda', 535, 7.65, 59.4, 29.7, 3.4, 79, 372, 2.35, 189),
  ('Potato chips', null, 'usda', 536, 7.0, 52.9, 34.6, 4.4, 525, 1196, 1.6, 24),
  ('Muesli bar', null, 'afcd', 401, 6.5, 66.0, 12.0, 5.5, 150, 250, 2.0, 50),

  -- Drinks
  ('Orange juice', null, 'usda', 45, 0.7, 10.4, 0.2, 0.2, 1, 200, 0.5, 11),
  ('Cola soft drink', null, 'afcd', 42, 0, 10.6, 0, 0, 4, 2, 0, 2),
  ('Beer', null, 'usda', 43, 0.46, 3.55, 0, 0, 4, 27, 0.02, 4),
  ('Wine, red', null, 'usda', 85, 0.07, 2.61, 0, 0, 4, 127, 0.46, 8);
