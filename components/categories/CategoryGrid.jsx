"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sofa,
  Utensils,
  Bed,
  Monitor,
  Armchair,
  Table,
  Lamp,
  Tv,
  BookOpen,
  Shirt,
  Coffee,
  Home,
  Palette,
  Wrench,
} from "lucide-react"

const categoryIcons = {
  "Living Room Set": Sofa,
  "Dining Table": Utensils,
  "Bedroom Set": Bed,
  "Office Desk": Monitor,
  "Sofa/Couch/Bean": Armchair,
  "Center Table": Table,
  "End Table": Table,
  "Arm Chair": Armchair,
  "TV Cabinet": Tv,
  "Display Cabinet": BookOpen,
  Shelf: BookOpen,
  "Carpet/Rug": Home,
  "Lamp/Light/Chandelier": Lamp,
  "Dining Chair": Armchair,
  "Dinner Wagon": Utensils,
  Bed: Bed,
  "Murphy Bed": Bed,
  "Bed Side Table": Table,
  "Dressing Table": Table,
  "Study Table": Monitor,
  "Conference Table": Table,
  "Modular Work Station": Monitor,
  "Visitor Chair": Armchair,
  "Break Room Furniture": Coffee,
  "Cabinet/Almira": BookOpen,
  "Book Shelf": BookOpen,
  "Shoe Rack": Shirt,
  "Store Cabinet": BookOpen,
  "Fine Dining Furniture": Utensils,
  "Reception Furniture": Monitor,
  "Bar Stool": Armchair,
  "Cash Counter": Monitor,
  "PU Flooring": Home,
  "Lab Clear Coat": Palette,
  "Interior Consultation": Home,
  "Project Execution": Wrench,
  "Epoxy Services": Palette,
  "Portable Partition": Home,
  "Kitchen Counter Top": Utensils,
  "Wooden Wash Basin": Home,
}

const categories = [
  "Living Room Set",
  "Dining Table",
  "Bedroom Set",
  "Office Desk",
  "Sofa/Couch/Bean",
  "Center Table",
  "End Table",
  "Arm Chair",
  "TV Cabinet",
  "Display Cabinet",
  "Shelf",
  "Carpet/Rug",
  "Lamp/Light/Chandelier",
  "Dining Chair",
  "Dinner Wagon",
  "Bed",
  "Murphy Bed",
  "Bed Side Table",
  "Dressing Table",
  "Study Table",
  "Conference Table",
  "Modular Work Station",
  "Visitor Chair",
  "Break Room Furniture",
  "Cabinet/Almira",
  "Book Shelf",
  "Shoe Rack",
  "Store Cabinet",
  "Fine Dining Furniture",
  "Reception Furniture",
  "Bar Stool",
  "Cash Counter",
  "PU Flooring",
  "Lab Clear Coat",
  "Interior Consultation",
  "Project Execution",
  "Epoxy Services",
  "Portable Partition",
  "Kitchen Counter Top",
  "Wooden Wash Basin",
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {categories.map((category) => {
        const IconComponent = categoryIcons[category] || Home

        return (
          <Link key={category} href={`/products?category=${encodeURIComponent(category)}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors">
                    <IconComponent className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-amber-600 transition-colors line-clamp-2">
                    {category}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

// Named export for compatibility
export { CategoryGrid }
