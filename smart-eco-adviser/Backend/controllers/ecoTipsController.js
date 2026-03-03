const axios = require("axios");
const { rankTips } = require("../services/recommendationModel");

// @desc    Get dynamic eco tips based on weather and air quality
// @route   GET /api/eco-tips
// @access  Private
const getEcoTips = async (req, res) => {
  try {
    const { lat, lon, city, commuteKm, dietType, budget, goals } = req.query;

    const modelContext = {
      temperature: 22,
      windSpeed: 1,
      airQuality: 70,
      commuteKm: Number(commuteKm || 8),
      dietType: dietType || "mixed",
      budget: budget || "medium",
      goals: goals ? goals.split(",").filter(Boolean) : ["lower_emissions", "reduce_cost"],
    };
    
    const tips = [];
    
    // Get weather data from OpenWeatherMap
    if (process.env.OPENWEATHER_API_KEY) {
      try {
        let weatherUrl;
        if (lat && lon) {
          weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
        } else if (city) {
          weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`;
        }

        if (weatherUrl) {
          const weatherResponse = await axios.get(weatherUrl);
          const weather = weatherResponse.data;
          modelContext.temperature = weather.main.temp;
          modelContext.windSpeed = weather.wind.speed;
          
          // Generate tips based on weather
          if (weather.main.temp > 25) {
            tips.push({
              category: "energy",
              title: "Hot Weather Energy Saving",
              description: `It's ${weather.main.temp}°C outside. Use natural ventilation instead of AC when possible. Open windows during cooler evening hours.`,
              impact: "medium",
              co2Reduction: 0.5,
              costSaving: 180,
              difficulty: "easy"
            });
          } else if (weather.main.temp < 10) {
            tips.push({
              category: "energy",
              title: "Cold Weather Energy Saving",
              description: `Temperature is ${weather.main.temp}°C. Wear warmer clothes indoors and lower your thermostat by 2°C to save energy.`,
              impact: "medium",
              co2Reduction: 0.6,
              costSaving: 120,
              difficulty: "easy"
            });
          }

          if (weather.weather[0].main === "Clear" || weather.weather[0].main === "Clouds") {
            tips.push({
              category: "transportation",
              title: "Perfect Weather for Active Transport",
              description: `Weather conditions are ideal (${weather.weather[0].description}). Consider walking or cycling instead of driving today!`,
              impact: "high",
              co2Reduction: 2.3,
              costSaving: 240,
              difficulty: "easy"
            });
          }

          if (weather.wind.speed > 5) {
            tips.push({
              category: "energy",
              title: "Natural Drying Opportunity",
              description: `Wind speed is ${weather.wind.speed} m/s. Skip the dryer and air-dry your laundry outside to save energy.`,
              impact: "low",
              co2Reduction: 0.3,
              costSaving: 90,
              difficulty: "easy"
            });
          }
        }
      } catch (error) {
        console.error("Weather API error:", error.message);
      }
    }

    // Get air quality data from AQI CN API
    if (process.env.AQICN_API_KEY && lat && lon) {
      try {
        const aqiUrl = `https://api.waqi.info/feed/geo:${lat};${lon}/?token=${process.env.AQICN_API_KEY}`;
        const aqiResponse = await axios.get(aqiUrl);
        
        if (aqiResponse.data.status === 'ok') {
          const aqi = aqiResponse.data.data.aqi;
          modelContext.airQuality = aqi;
          
          // Generate tips based on air quality
          if (aqi > 150) {
            tips.push({
              category: "general",
              title: "Poor Air Quality Alert",
              description: `Air quality is unhealthy (AQI: ${aqi}). Avoid outdoor activities and consider using air purifiers indoors.`,
              impact: "high",
              co2Reduction: 0,
              costSaving: 0,
              difficulty: "easy"
            });
          } else if (aqi > 100) {
            tips.push({
              category: "general",
              title: "Moderate Air Quality",
              description: `Air quality is moderate (AQI: ${aqi}). Sensitive groups should limit prolonged outdoor activities.`,
              impact: "medium",
              co2Reduction: 0,
              costSaving: 0,
              difficulty: "easy"
            });
          } else if (aqi <= 50) {
            tips.push({
              category: "transportation",
              title: "Great Air Quality - Go Outside!",
              description: `Air quality is excellent (AQI: ${aqi}). Perfect day for walking or cycling instead of driving!`,
              impact: "high",
              co2Reduction: 2.5,
              costSaving: 230,
              difficulty: "easy"
            });
          }
        }
      } catch (error) {
        console.error("AQI API error:", error.message);
      }
    }

    // Add general eco tips
    const generalTips = [
      {
        category: "diet",
        title: "Reduce Meat Consumption",
        description: "Try having one meat-free day per week. Plant-based meals have a significantly lower carbon footprint.",
        impact: "high",
        co2Reduction: 1.8,
        costSaving: 140,
        difficulty: "medium"
      },
      {
        category: "waste",
        title: "Start Composting",
        description: "Compost your organic waste to reduce methane emissions from landfills and create nutrient-rich soil.",
        impact: "medium",
        co2Reduction: 0.8,
        costSaving: 110,
        difficulty: "easy"
      },
      {
        category: "energy",
        title: "Switch to LED Bulbs",
        description: "Replace incandescent bulbs with LED lights. They use 75% less energy and last 25 times longer.",
        impact: "medium",
        co2Reduction: 0.5,
        costSaving: 160,
        difficulty: "easy"
      },
      {
        category: "transportation",
        title: "Carpool or Use Public Transit",
        description: "Share rides with colleagues or use public transportation to significantly reduce your carbon footprint.",
        impact: "high",
        co2Reduction: 2.0,
        costSaving: 220,
        difficulty: "easy"
      },
      {
        category: "energy",
        title: "Unplug Devices",
        description: "Unplug electronics when not in use to eliminate phantom power consumption.",
        impact: "low",
        co2Reduction: 0.3,
        costSaving: 70,
        difficulty: "easy"
      }
    ];

    tips.push(...generalTips);

    const rankedTips = rankTips(tips, modelContext).slice(0, 10);

    res.json({
      tips: rankedTips,
      model: {
        name: "EcoRank-LR-v1",
        context: modelContext,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getEcoTips
};
