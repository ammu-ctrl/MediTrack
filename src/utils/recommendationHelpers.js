/**
 * Recommendation Helper Functions
 * Generates diet and exercise plans based on health conditions and metrics
 */

/**
 * Generate diet plan based on health data
 * @param {Object} healthData - User's health information
 * @returns {Object} - Diet recommendations
 */
export const generateDietPlan = (healthData) => {
  const { condition, fastingsugarLevel, postMealSugarLevel, bloodPressure, weight, age } = healthData;
  
  let recommendations = {
    title: "Personalized Diet Plan",
    items: [],
    priority: [],
    avoidFoods: [],
    includeFoods: [],
  };

  // Diabetes Logic
  if (condition === "Diabetes") {
    recommendations.items.push("Follow a low glycemic index (GI) diet");
    
    if (parseInt(fastingsugarLevel) > 130) {
      recommendations.priority.push("⚠️ Fasting sugar is HIGH - Reduce carbohydrate intake");
      recommendations.avoidFoods.push("White bread", "Sugary drinks", "Pastries", "Desserts", "White rice");
      recommendations.includeFoods.push("Whole grains", "Leafy greens", "Legumes", "Nuts", "Seeds");
    }
    
    if (parseInt(postMealSugarLevel) > 180) {
      recommendations.priority.push("⚠️ Post-meal sugar is HIGH - Add fiber-rich foods");
      recommendations.includeFoods.push("Oats", "Broccoli", "Spinach", "Chickpeas", "Beans", "Apples");
    }
    
    recommendations.items.push("Eat every 3-4 hours in small portions");
    recommendations.items.push("Drink water instead of sugary beverages");
    recommendations.items.push("Monitor portion sizes carefully");
  }

  // High Blood Pressure Logic
  if (condition === "High Blood Pressure") {
    recommendations.items.push("Follow a low sodium (DASH) diet");
    recommendations.items.push("Limit salt intake to less than 2,300mg per day");
    
    const BPparts = bloodPressure.split("/").map(Number);
    if (BPparts[0] > 160) {
      recommendations.priority.push("⚠️ Systolic BP is critically high - Strictly limit sodium");
    }
    
    recommendations.avoidFoods.push("Processed meats", "Canned foods", "Fried foods", "Salty snacks", "High-sodium sauces");
    recommendations.includeFoods.push("Fresh vegetables", "Fruits", "Low-fat dairy", "Whole grains", "Fish rich in omega-3");
    recommendations.items.push("Increase potassium intake (bananas, sweet potatoes)");
  }

  // Obesity Logic
  if (condition === "Obesity") {
    const BMI = calculateBMI(parseInt(weight), 170); // Assuming average height
    recommendations.items.push(`Your BMI is ${BMI.toFixed(1)} - Target weight loss of ${(parseInt(weight) * 0.1).toFixed(0)}kg`);
    recommendations.items.push("Create a calorie deficit of 500-750 calories per day");
    recommendations.items.push("Eat in smaller portions using smaller plates");
    recommendations.items.push("Drink water before meals");
    
    recommendations.avoidFoods.push("Sugary foods", "Fried foods", "Fast food", "Alcohol", "High-calorie snacks");
    recommendations.includeFoods.push("Lean proteins", "Whole grains", "Fruits", "Vegetables", "Nuts in moderation");
    
    if (parseInt(weight) > 90) {
      recommendations.priority.push("⚠️ Weight is high - Urgent lifestyle changes needed");
    }
  }

  // Thyroid Logic
  if (condition === "Thyroid") {
    recommendations.items.push("Maintain consistent iodine intake");
    recommendations.avoidFoods.push("Excess cruciferous vegetables (raw)", "Soy products (excess)", "Caffeine (limit)");
    recommendations.includeFoods.push("Iodized salt", "Sea fish", "Eggs", "Dairy products", "Selenium-rich foods");
  }

  return recommendations;
};

/**
 * Generate exercise plan based on health data
 * @param {Object} healthData - User's health information
 * @returns {Object} - Exercise recommendations
 */
export const generateExercisePlan = (healthData) => {
  const { condition, fastingsugarLevel, postMealSugarLevel, bloodPressure, weight, age } = healthData;
  
  let recommendations = {
    title: "Personalized Exercise Plan",
    weekly: [],
    intensity: "Moderate",
    precautions: [],
    targets: [],
  };

  const userAge = parseInt(age);

  // Diabetes Logic
  if (condition === "Diabetes") {
    recommendations.weekly.push("Walking: 30 minutes, 5 days per week");
    recommendations.weekly.push("Swimming: 2 days per week (low impact)");
    
    if (parseInt(fastingsugarLevel) > 130 || parseInt(postMealSugarLevel) > 180) {
      recommendations.weekly = ["Walking: 30 minutes AFTER meals, 5 days per week"];
      recommendations.precautions.push("Exercise 1-2 hours after eating to help control blood sugar");
    }
    
    recommendations.intensity = "Moderate (target 150 minutes/week)";
    recommendations.precautions.push("Check blood sugar before and after exercise");
    recommendations.precautions.push("Carry glucose tablets during exercise");
    recommendations.targets.push("Target heart rate: " + calculateHeartRate(userAge) + " bpm");
  }

  // High Blood Pressure Logic
  if (condition === "High Blood Pressure") {
    recommendations.weekly.push("Yoga: 4-5 days per week (30 minutes)");
    recommendations.weekly.push("Breathing exercises: Daily (10 minutes)");
    recommendations.weekly.push("Light walking: 30 minutes, 5 days per week");
    
    recommendations.intensity = "Light to Moderate (avoid intense cardio)";
    recommendations.precautions.push("AVOID: Heavy weightlifting, intense running, sudden movements");
    recommendations.precautions.push("Monitor BP before and after exercise");
    recommendations.targets.push("Target heart rate: " + Math.round(calculateHeartRate(userAge) * 0.6) + "-" + Math.round(calculateHeartRate(userAge) * 0.75) + " bpm");
  }

  // Obesity Logic
  if (condition === "Obesity") {
    recommendations.weekly.push("Cardio: 150 minutes spread over 5 days (30 min sessions)");
    recommendations.weekly.push("Strength training: 2 days per week (20 minutes)");
    recommendations.weekly.push("Walking: Daily, 10,000 steps minimum");
    
    recommendations.intensity = "Moderate to Vigorous";
    recommendations.precautions.push("Start slowly and gradually increase intensity");
    recommendations.precautions.push("Wear supportive footwear");
    recommendations.precautions.push("Stay hydrated throughout exercise");
    recommendations.targets.push("Target heart rate: " + calculateHeartRate(userAge) + " bpm");
    recommendations.targets.push("Weekly calorie burn target: 2500-3500 calories");
  }

  // Thyroid Logic
  if (condition === "Thyroid") {
    recommendations.weekly.push("Moderate exercise: 150 minutes per week");
    recommendations.weekly.push("Mix of cardio and strength training");
    recommendations.precautions.push("Consistency is more important than intensity");
    recommendations.precautions.push("Avoid overexertion if experiencing fatigue");
  }

  // Age-based precautions
  if (userAge > 50) {
    recommendations.precautions.push("Get medical clearance before starting new exercise program");
    recommendations.precautions.push("Warm up for 10 minutes before exercise");
    recommendations.precautions.push("Cool down for 10 minutes after exercise");
  }

  return recommendations;
};

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} - BMI value
 */
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

/**
 * Calculate target heart rate for exercise
 * Using Karvonen formula: ((220 - age) × 0.7)
 * @param {number} age - User's age
 * @returns {number} - Target heart rate in bpm
 */
const calculateHeartRate = (age) => {
  return Math.round((220 - age) * 0.7);
};

/**
 * Validate health data
 * @param {Object} healthData - Health data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateHealthData = (healthData) => {
  const errors = [];
  
  if (!healthData.condition) errors.push("Health condition is required");
  if (!healthData.age || parseInt(healthData.age) < 0 || parseInt(healthData.age) > 150) {
    errors.push("Age must be between 0 and 150");
  }
  if (!healthData.weight || parseInt(healthData.weight) < 0) {
    errors.push("Weight must be a positive number");
  }
  if (healthData.fastingsugarLevel && parseInt(healthData.fastingsugarLevel) < 0) {
    errors.push("Fasting sugar level cannot be negative");
  }
  if (healthData.postMealSugarLevel && parseInt(healthData.postMealSugarLevel) < 0) {
    errors.push("Post-meal sugar level cannot be negative");
  }
  if (healthData.bloodPressure) {
    const bp = healthData.bloodPressure.split("/");
    if (bp.length !== 2 || parseInt(bp[0]) < 0 || parseInt(bp[1]) < 0) {
      errors.push("Blood pressure format should be: Systolic/Diastolic (e.g., 120/80)");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
