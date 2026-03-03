"use client"

import { useState, useEffect } from "react"
import { ecoTipsAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Car,
  Home,
  Utensils,
  Trash2,
  Bookmark,
  BookmarkCheck,
  Search,
  TrendingDown,
  Clock,
  DollarSign,
  CheckCircle,
  Sparkles,
  Brain,
  Target,
} from "lucide-react"

interface Recommendation {
  id: string
  title: string
  description: string
  category: "transportation" | "energy" | "diet" | "waste" | "general"
  difficulty: "easy" | "medium" | "hard"
  impact: "low" | "medium" | "high"
  co2Reduction: number
  costSaving?: number
  timeToImplement: string
  steps: string[]
  tips: string[]
  aiScore?: number
  confidence?: number
  reasoning?: string[]
  saved: boolean
  completed: boolean
}

interface PersonalizationProfile {
  commuteKm: number
  dietType: string
  budget: string
  goals: string[]
}

export function EcoRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [location, setLocation] = useState<{ lat: number; lon: number; city: string } | null>(null)
  const [locationError, setLocationError] = useState<string>("")
  const [profile, setProfile] = useState<PersonalizationProfile>({
    commuteKm: 12,
    dietType: "mixed",
    budget: "medium",
    goals: ["lower_emissions", "reduce_cost"],
  })

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          
          // If frontend OpenWeather API key is available, try reverse geocoding for city name.
          // Otherwise, skip reverse geocoding and proceed with generic city label.
          const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
          if (openWeatherKey) {
            try {
              const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${openWeatherKey}`
              )
              const data = await response.json()
              const city = data?.[0]?.name || "Your Location"
              setLocation({ lat, lon, city })
              loadEcoTips(lat, lon, city)
            } catch (error) {
              console.error("Error getting city name:", error)
              setLocation({ lat, lon, city: "Your Location" })
              loadEcoTips(lat, lon, "Your Location")
            }
          } else {
            setLocation({ lat, lon, city: "Your Location" })
            loadEcoTips(lat, lon, "Your Location")
          }
        },
        (error) => {
          console.error("Geolocation error:", error)
          setLocationError("Location access denied. Using Bengaluru as default.")
          // Fallback to Bengaluru
          const BENGALURU_LAT = 12.9716
          const BENGALURU_LON = 77.5946
          setLocation({ lat: BENGALURU_LAT, lon: BENGALURU_LON, city: "Bengaluru" })
          loadEcoTips(BENGALURU_LAT, BENGALURU_LON, "Bengaluru")
        }
      )
    } else {
      setLocationError("Geolocation not supported. Using Bengaluru as default.")
      // Fallback to Bengaluru
      const BENGALURU_LAT = 12.9716
      const BENGALURU_LON = 77.5946
      setLocation({ lat: BENGALURU_LAT, lon: BENGALURU_LON, city: "Bengaluru" })
      loadEcoTips(BENGALURU_LAT, BENGALURU_LON, "Bengaluru")
    }
  }

  useEffect(() => {
    if (location) {
      loadEcoTips(location.lat, location.lon, location.city)
    }
  }, [profile])

  const loadEcoTips = async (lat: number, lon: number, city: string) => {
    try {
      setLoading(true)
      const response = await ecoTipsAPI.getTips(lat, lon, city, profile)
      
      // Map API tips to recommendation format
      const mappedTips: Recommendation[] = response.tips.map((tip: any, index: number) => ({
        id: `tip-${index}`,
        title: tip.title,
        description: tip.description,
        category: tip.category as any,
        difficulty: tip.impact === "high" ? "easy" : tip.impact === "medium" ? "medium" : "hard",
        impact: tip.impact,
        co2Reduction: tip.co2Reduction || 0,
        aiScore: tip.aiScore,
        confidence: tip.confidence,
        reasoning: tip.reasoning,
        costSaving: tip.costSaving || 0,
        timeToImplement: "1-2 weeks",
        steps: [
          "Research and plan your approach",
          "Gather necessary resources",
          "Implement the change gradually",
          "Track your progress"
        ],
        tips: [
          "Start small and build momentum",
          "Share your journey with others",
          "Celebrate small wins"
        ],
        saved: false,
        completed: false
      }))

      // Add location-specific recommendations
      const locationTips: Recommendation[] = []
      
      // Bengaluru-specific tips
      if (city.toLowerCase().includes('bengaluru') || city.toLowerCase().includes('bangalore')) {
        locationTips.push({
          id: "blr-1",
          title: "Use Namma Metro for Daily Commute",
          description: "Bengaluru Metro is an eco-friendly alternative to driving. Reduce traffic congestion and carbon emissions.",
          category: "transportation",
          difficulty: "easy",
          impact: "high",
          co2Reduction: 2.5,
          costSaving: 150,
          timeToImplement: "Immediate",
          steps: [
            "Get a Namma Metro smart card",
            "Plan your route using metro map",
            "Combine with last-mile connectivity (bus/auto)",
            "Track your monthly savings"
          ],
          tips: [
            "Peak hours: 8-10 AM and 6-8 PM",
            "Monthly pass available for regular commuters",
            "Connect to BMTC buses for extended reach"
          ],
          saved: false,
          completed: false
        })
        
        locationTips.push({
          id: "blr-2",
          title: "Rainwater Harvesting (Mandatory in Bengaluru)",
          description: "Install rainwater harvesting system as per BWSSB guidelines. Save water and reduce dependency on borewells.",
          category: "energy",
          difficulty: "medium",
          impact: "high",
          co2Reduction: 1.2,
          costSaving: 300,
          timeToImplement: "2-4 weeks",
          steps: [
            "Contact BWSSB approved contractors",
            "Get site assessment done",
            "Install collection and filtration system",
            "Regular maintenance every 6 months"
          ],
          tips: [
            "Mandatory for all buildings in Bengaluru",
            "Can recharge borewells effectively",
            "BWSSB provides guidelines and subsidies"
          ],
          saved: false,
          completed: false
        })
        
        locationTips.push({
          id: "blr-3",
          title: "Compost Kitchen Waste (BBMP Initiative)",
          description: "Join BBMP's waste segregation program. Convert wet waste into compost at home.",
          category: "waste",
          difficulty: "easy",
          impact: "medium",
          co2Reduction: 0.8,
          costSaving: 50,
          timeToImplement: "1 week",
          steps: [
            "Get a composting bin (available at BBMP offices)",
            "Segregate wet and dry waste daily",
            "Add kitchen waste to compost bin",
            "Use compost for plants after 45 days"
          ],
          tips: [
            "BBMP provides free composting bins",
            "Avoid adding meat, dairy, or oily food",
            "Turn the compost weekly for faster decomposition"
          ],
          saved: false,
          completed: false
        })
        
        locationTips.push({
          id: "blr-4",
          title: "Solar Water Heater Installation",
          description: "Utilize Bengaluru's abundant sunshine. Reduce electricity bills and carbon footprint.",
          category: "energy",
          difficulty: "medium",
          impact: "high",
          co2Reduction: 1.5,
          costSaving: 400,
          timeToImplement: "1-2 weeks",
          steps: [
            "Get quotes from MNRE approved vendors",
            "Choose appropriate capacity (100-300 liters)",
            "Professional installation on rooftop",
            "Avail government subsidy (up to 30%)"
          ],
          tips: [
            "Bengaluru receives 300+ sunny days",
            "Payback period: 3-4 years",
            "BESCOM offers net metering for solar panels"
          ],
          saved: false,
          completed: false
        })
      }

      setRecommendations([...locationTips, ...mappedTips])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load eco tips",
        variant: "destructive"
      })
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const toggleSave = (id: string) => {
    setRecommendations(prev =>
      prev.map(rec => rec.id === id ? { ...rec, saved: !rec.saved } : rec)
    )
  }

  const toggleComplete = (id: string) => {
    setRecommendations(prev =>
      prev.map(rec => rec.id === id ? { ...rec, completed: !rec.completed } : rec)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-muted-foreground">Detecting your location and loading eco tips...</p>
        </div>
      </div>
    )
  }

  // Filter and search logic
  const filteredRecommendations = recommendations.filter((rec) => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || rec.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === "all" || rec.difficulty === selectedDifficulty
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const totalCO2Reduction = recommendations
    .filter((rec) => rec.completed)
    .reduce((sum, rec) => sum + rec.co2Reduction, 0)

  const totalCostSaving = recommendations
    .filter((rec) => rec.completed && rec.costSaving)
    .reduce((sum, rec) => sum + (rec.costSaving || 0), 0)

  const categoryIcons = {
    transportation: Car,
    energy: Home,
    diet: Utensils,
    waste: Trash2,
    general: Sparkles,
  }

  const difficultyColors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
  }

  const impactColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-purple-100 text-purple-800",
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          AI Eco Recommendations for {location?.city || "Your Location"}
        </h1>
        <p className="text-muted-foreground mb-6">
          Personalized by EcoRank-LR model using your location, weather, and lifestyle profile
        </p>
        {locationError && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            📍 {locationError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalCO2Reduction.toFixed(1)}t</div>
                <p className="text-sm text-muted-foreground">CO₂ Reduced</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">₹{totalCostSaving}</div>
                <p className="text-sm text-muted-foreground">Money Saved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {recommendations.filter((rec) => rec.completed).length}
                </div>
                <p className="text-sm text-muted-foreground">Actions Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Brain className="h-5 w-5 text-primary" /> Personalization Controls</CardTitle>
          <CardDescription>Adjust your lifestyle profile to retrain recommendation ranking instantly.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Daily commute (km)</label>
            <Input
              type="number"
              min={0}
              value={profile.commuteKm}
              onChange={(e) => setProfile((prev) => ({ ...prev, commuteKm: Number(e.target.value || 0) }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Diet type</label>
            <Select value={profile.dietType} onValueChange={(v) => setProfile((prev) => ({ ...prev, dietType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                <SelectItem value="non-vegetarian">Non-vegetarian</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Monthly sustainability budget</label>
            <Select value={profile.budget} onValueChange={(v) => setProfile((prev) => ({ ...prev, budget: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Primary goal</label>
            <Select
              value={profile.goals[0]}
              onValueChange={(v) => setProfile((prev) => ({ ...prev, goals: [v] }))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lower_emissions">Lower emissions</SelectItem>
                <SelectItem value="reduce_cost">Reduce cost</SelectItem>
                <SelectItem value="save_time">Save time</SelectItem>
                <SelectItem value="health">Improve health</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="energy">Energy</SelectItem>
            <SelectItem value="diet">Diet</SelectItem>
            <SelectItem value="waste">Waste</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredRecommendations.map((rec) => {
          // Fallback to a valid icon if an unknown category is received from API
          const Icon = (categoryIcons as any)[rec.category] || Car
          return (
            <Card key={rec.id} className={`shadow-sm hover:shadow-md transition-all ${rec.completed ? "border-green-200 bg-green-50/50" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <Badge className={difficultyColors[rec.difficulty]}>{rec.difficulty}</Badge>
                      <Badge className={impactColors[rec.impact]}>{rec.impact} impact</Badge>
                      {rec.aiScore && (
                        <Badge variant="secondary" className="flex items-center gap-1"><Sparkles className="h-3 w-3" />AI {rec.aiScore}%</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                    <CardDescription className="mt-2">{rec.description}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSave(rec.id)}
                    >
                      {rec.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComplete(rec.id)}
                    >
                      <CheckCircle className={`h-4 w-4 ${rec.completed ? "text-green-600" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        <span>{rec.co2Reduction}t CO₂</span>
                      </div>
                      {rec.costSaving && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span>₹{rec.costSaving}/year</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span>{rec.timeToImplement}</span>
                      </div>
                    </div>
                  </div>

                  {rec.reasoning && rec.reasoning.length > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                      <p className="text-xs font-semibold mb-1 flex items-center gap-1"><Target className="h-3.5 w-3.5" />Why this is recommended</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        {rec.reasoning.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                      {rec.confidence && <p className="text-xs mt-2 text-primary">Model confidence: {rec.confidence}%</p>}
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {rec.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2">Tips:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {rec.tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <p>No recommendations found matching your filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
