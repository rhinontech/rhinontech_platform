"use client"

import { useMemo, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type React from "react"

interface FeatureItem {
  id: number
  title: string
  image?: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

interface Feature197Props {
  features: FeatureItem[]
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Ready-to-Use UI Blocks",
    image: "/images/block/placeholder-1.svg",
    description:
      "Browse through our extensive collection of pre-built UI blocks designed with shadcn/ui. Each block is carefully crafted to be responsive, accessible, and easily customizable. Simply copy and paste the code into your project.",
  },
  {
    id: 2,
    title: "Tailwind CSS & TypeScript",
    image: "/images/block/placeholder-2.svg",
    description:
      "Built with Tailwind CSS for rapid styling and TypeScript for type safety. Our blocks leverage the full power of Tailwind's utility classes while maintaining clean, type-safe code that integrates seamlessly with your Next.js projects.",
  },
  {
    id: 3,
    title: "Dark Mode & Customization",
    image: "/images/block/placeholder-3.svg",
    description:
      "Every block supports dark mode out of the box and can be customized to match your brand. Modify colors, spacing, and typography using Tailwind's configuration. The shadcn/ui theming system makes it easy to maintain consistency across your site.",
  },
  {
    id: 4,
    title: "Accessibility First",
    image: "/images/block/placeholder-4.svg",
    description:
      "All blocks are built with accessibility in mind, following WCAG guidelines. They include proper ARIA labels, keyboard navigation support, and semantic HTML structure. Ensure your website is usable by everyone without extra effort.",
  },
  {
    id: 5,
    title: "Modern Development Stack",
    image: "/images/block/placeholder-5.svg",
    description:
      "Built for modern web development with React 18, Next.js 14, and the latest shadcn/ui components. Take advantage of React Server Components, TypeScript strict mode, and other cutting-edge features while maintaining excellent performance.",
  },
]

const Feature197 = ({ features = defaultFeatures }: Feature197Props) => {
  const hasImages = useMemo(() => features.some((f) => !!f.image), [features])
  const [activeTabId, setActiveTabId] = useState<number | null>(features[0]?.id ?? null)

  const initialImage = useMemo(
    () => (hasImages ? (features.find((f) => !!f.image)?.image ?? null) : null),
    [features, hasImages],
  )
  const [activeImage, setActiveImage] = useState<string | null>(initialImage)

  return (
    <section className="">
      <div className="container mx-auto">
        <div className="flex w-full items-start justify-between gap-12">
          <div className="w-full md:w-1/2">
            <Accordion type="single" className="w-full" defaultValue="item-1">
              {features.map((tab) => {
                const Icon = tab.icon
                const isActive = tab.id === activeTabId

                return (
                  <AccordionItem key={tab.id} value={`item-${tab.id}`}>
                    <AccordionTrigger
                      onClick={() => {
                        setActiveTabId(tab.id)
                        if (hasImages) {
                          setActiveImage(tab.image ?? null)
                        }
                      }}
                      className="cursor-pointer py-5 !no-underline transition"
                    >
                      <div className="flex w-full items-center gap-3 text-left">
                        {Icon && (
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? "bg-primary/10" : "bg-muted"}`}
                            aria-hidden="true"
                          >
                            <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                        )}

                        <div className="flex-1">
                          <h6
                            className={`text-xl font-semibold ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                          >
                            {tab.title}
                          </h6>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mt-3 text-muted-foreground">{tab.description}</p>

                      {tab.image && (
                        <div className="mt-4 md:hidden">
                          <img
                            src={tab.image || "/placeholder.svg"}
                            alt={tab.title}
                            className="h-full max-h-80 w-full rounded-md object-cover"
                          />
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>

          {hasImages && activeImage ? (
            <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-xl bg-muted md:block">
              <img
                src={activeImage || "/placeholder.svg"}
                alt="Feature preview"
                className="aspect-[4/3] rounded-md object-cover pl-4"
              />
            </div>
          ) : (
            <div className="relative m-auto hidden w-1/2 md:block" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  )
}

export { Feature197 }
