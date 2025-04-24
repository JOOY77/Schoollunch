import MealApp from "@/components/meal-app"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#eeffef]">
      <div className="w-full max-w-md h-screen">
        <MealApp />
      </div>
    </main>
  )
}
