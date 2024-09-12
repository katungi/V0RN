"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusIcon, ClockIcon, RefreshCwIcon, ArrowUpIcon, MinimizeIcon, Paintbrush, Building2, Gamepad2, Shirt, Rocket } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { HexColorPicker } from "react-colorful"

const stylePreferences = [
  { name: "Minimalist", icon: MinimizeIcon, color: "bg-gray-100" },
  { name: "Colorful", icon: Paintbrush, color: "bg-pink-100" },
  { name: "Corporate", icon: Building2, color: "bg-blue-100" },
  { name: "Playful", icon: Gamepad2, color: "bg-green-100" },
  { name: "Elegant", icon: Shirt, color: "bg-purple-100" },
  { name: "Futuristic", icon: Rocket, color: "bg-cyan-100" }
]

export default function Component() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [step, setStep] = useState(1)
  const [projectName, setProjectName] = useState("")
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [primaryColor, setPrimaryColor] = useState("#000000")
  const [secondaryColor, setSecondaryColor] = useState("#ffffff")
  const [tertiaryColor, setTertiaryColor] = useState("#cccccc")

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const projects = [
    { name: "Project Alpha", color: "bg-blue-100" },
    { name: "Beta Build", color: "bg-green-100" },
    { name: "Gamma App", color: "bg-yellow-100" },
    { name: "Delta Dashboard", color: "bg-pink-100" },
    { name: "Epsilon Engine", color: "bg-purple-100" },
    { name: "Zeta Zone", color: "bg-indigo-100" },
  ]

  const handleStylePreferenceToggle = (style: string) => {
    setSelectedStyles(prev =>
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    )
  }

  const handleNextStep = () => {
    if (step === 1 && projectName) {
      setStep(2)
    } else if (step === 2 && selectedStyles.length > 0) {
      setStep(3)
    } else if (step === 3) {
      // Here you would typically save the new project
      console.log("New project:", { name: projectName, styles: selectedStyles, colors: { primary: primaryColor, secondary: secondaryColor, tertiary: tertiaryColor } })
      resetForm()
    }
  }

  const resetForm = () => {
    setStep(1)
    setProjectName("")
    setSelectedStyles([])
    setPrimaryColor("#000000")
    setSecondaryColor("#ffffff")
    setTertiaryColor("#cccccc")
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-16 bg-gray-100 flex flex-col items-center py-4 border-r">
        <div className="mb-8">
          <div className="mt-auto">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
              JD
            </div>
          </div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="mb-4">
              <PlusIcon className="h-4 w-4" />
              <span className="sr-only">Create new project</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                {step === 1 ? "Enter a name for your new project." :
                  step === 2 ? "Choose style preferences for your project." :
                    "Optionally select color scheme for your project."}
              </DialogDescription>
            </DialogHeader>
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <Button onClick={handleNextStep} disabled={!projectName}>Next</Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {stylePreferences.map((style) => {
                    const Icon = style.icon
                    return (
                      <Button
                        key={style.name}
                        variant="outline"
                        className={`flex items-center justify-start space-x-2 ${style.color} ${selectedStyles.includes(style.name) ? 'border-primary' : ''}`}
                        onClick={() => handleStylePreferenceToggle(style.name)}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{style.name}</span>
                      </Button>
                    )
                  })}
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={handleNextStep} disabled={selectedStyles.length === 0}>Next</Button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <HexColorPicker color={secondaryColor} onChange={setSecondaryColor} />
                </div>
                <div className="space-y-2">
                  <Label>Tertiary Color</Label>
                  <HexColorPicker color={tertiaryColor} onChange={setTertiaryColor} />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleNextStep}>Create Project</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Button variant="ghost" size="icon" className="mb-4">
          <ClockIcon className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center p-4 border-b">
          <div className="text-xl font-semibold">v0rn</div>
          <div className="text-sm text-gray-500">Private Beta</div>
        </header>

        {/* Content */}
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold mb-4">Build Mobile apps 10x Faster</h1>
          <p className="text-gray-600 mb-8">Generate UI, ask questions, debug, execute code, and much more.</p>

          <div className="w-full max-w-3xl mb-8">
            {/* <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Subscribe to Premium for higher message limits.</p>
              <Button variant="outline" size="sm">Upgrade Plan</Button>
            </div> */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Textarea
                placeholder="Ask v0rn a question..."
                className="pr-12 min-h-[120px]"
              />
              <Button size="sm" className="absolute right-2 bottom-2">
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-3xl">
            {projects.map((project, index) => (
              <div
                key={index}
                className={`${project.color} p-4 rounded-lg shadow-sm`}
              >
                <h3 className="font-semibold">{project.name}</h3>
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-center items-center p-4 border-t text-sm text-gray-500">
          Powered by{" "}
          <Link href="https://expo.dev" className="mx-2 flex items-center">
            Expo <ArrowUpIcon className="h-4 w-4 ml-1 transform rotate-45" />
          </Link>
        </footer>
      </div>
    </div>
  )
}