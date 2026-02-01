"use client"

import * as React from "react"
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  FileCode,
  Gauge,
  HardDrive,
  Radio,
  Info,
  BookOpen,
  PlayCircle,
  Link as LinkIcon
} from "lucide-react"
import * as LucideIcons from "lucide-react"
import {
  Feature,
  FeatureDetailDialogProps,
  CodeExample,
  FeatureStatus,
  FeatureComplexity
} from "@/lib/features/types"
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

/**
 * Get status badge color classes
 */
function getStatusBadgeColor(status: FeatureStatus): string {
  switch (status) {
    case "production":
      return "bg-green-500 text-white border-green-500"
    case "beta":
      return "bg-gray-500 text-white border-gray-500"
    case "experimental":
      return "bg-yellow-500 text-black border-yellow-500"
    case "planned":
      return "bg-gray-400 text-white border-gray-400"
    default:
      return "bg-gray-400 text-white border-gray-400"
  }
}

/**
 * Get complexity badge color classes
 */
function getComplexityBadgeColor(complexity?: FeatureComplexity): string {
  switch (complexity) {
    case "beginner":
      return "bg-emerald-500 text-white border-emerald-500"
    case "intermediate":
      return "bg-amber-500 text-white border-amber-500"
    case "advanced":
      return "bg-rose-500 text-white border-rose-500"
    default:
      return "bg-gray-400 text-white border-gray-400"
  }
}

/**
 * Get Lucide icon by name
 */
function getLucideIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) {return FileCode}

  const Icon = (LucideIcons as any)[iconName]
  return Icon || FileCode
}

/**
 * Code block component with syntax highlighting and copy button
 */
function CodeBlock({ example }: { example: CodeExample }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(example.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {example.language}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="h-7 w-7"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </Button>
      </div>
      {example.description && (
        <div className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground border-b border-border/50">
          {example.description}
        </div>
      )}
      <ScrollArea className="max-h-[400px]">
        <pre className="p-4 bg-black/90 text-green-400 overflow-x-auto">
          <code className="text-xs md:text-sm font-mono leading-relaxed">
            {example.code}
          </code>
        </pre>
      </ScrollArea>
    </div>
  )
}

/**
 * Technical spec item component
 */
function TechSpecItem({
  label,
  value,
  icon
}: {
  label: string
  value: string | string[]
  icon?: React.ReactNode
}) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <span className="text-sm font-mono text-foreground break-all">
        {displayValue}
      </span>
    </div>
  )
}

/**
 * Mini feature card for related features
 */
function MiniFeatureCard({
  feature,
  onClick
}: {
  feature: Feature
  onClick: () => void
}) {
  const Icon = getLucideIcon(feature.icon)

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 p-4 rounded-lg border border-border/50",
        "bg-card hover:bg-muted/50 transition-all duration-200",
        "text-left w-full group focus-visible:ring-2 focus-visible:ring-ring"
      )}
      aria-label={`View details for ${feature.title}`}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex items-center justify-center size-10 rounded-lg",
          "bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors"
        )}>
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1 truncate">{feature.title}</h4>
          <Badge
            className={cn("text-[10px] px-1.5 py-0", getStatusBadgeColor(feature.status))}
          >
            {feature.status}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2">
        {feature.description}
      </p>
    </button>
  )
}

/**
 * Feature Detail Dialog Component
 * Displays comprehensive feature information in a modal dialog
 */
export function FeatureDetailDialog({
  feature,
  open,
  onOpenChange,
  relatedFeatures = []
}: FeatureDetailDialogProps) {
  const [activeTab, setActiveTab] = React.useState("overview")
  const [copiedUrl, setCopiedUrl] = React.useState(false)
  const Icon = getLucideIcon(feature.icon)

  // Get technical spec icon
  const getSpecIcon = (key: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      protocol: <Radio className="size-4" />,
      performance: <Gauge className="size-4" />,
      maxFileSize: <HardDrive className="size-4" />,
      chunkSize: <HardDrive className="size-4" />,
    }
    return iconMap[key] || <Info className="size-4" />
  }

  // Handle copy feature URL
  const handleCopyUrl = async () => {
    const url = `${window.location.origin}/features/${feature.id}`
    await navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: feature.title,
          text: feature.description,
          url: `${window.location.origin}/features/${feature.id}`
        })
      } catch (_error) {
        // User cancelled or share failed, fall back to copy
        handleCopyUrl()
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent
          className="max-w-4xl min-h-[600px] p-0 gap-0 flex flex-col"
          showCloseButton={false}
          aria-modal="true"
          role="dialog"
          aria-labelledby="feature-dialog-title"
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-8 border-b border-border/50">
            <div className={cn(
              "flex items-center justify-center size-20 rounded-2xl shrink-0",
              "bg-gradient-to-br from-primary/20 to-primary/5",
              "border-2 border-primary/20"
            )}>
              <Icon className="size-10 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h2
                id="feature-dialog-title"
                className="text-2xl md:text-3xl font-bold mb-3 tracking-tight"
              >
                {feature.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn("text-xs", getStatusBadgeColor(feature.status))}>
                  {feature.status}
                </Badge>
                {feature.complexity && (
                  <Badge className={cn("text-xs", getComplexityBadgeColor(feature.complexity))}>
                    {feature.complexity}
                  </Badge>
                )}
                {feature.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
              aria-label="Close dialog"
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="sticky top-0 z-10 bg-background border-b border-border/50">
              <ScrollArea className="w-full">
                <TabsList className="w-full justify-start rounded-none border-0 bg-transparent p-0 h-auto">
                  <div className="flex px-8 gap-1">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                    >
                      Overview
                    </TabsTrigger>
                    {feature.techSpecs && (
                      <TabsTrigger
                        value="specs"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        Technical Specs
                      </TabsTrigger>
                    )}
                    {feature.codeExamples && feature.codeExamples.length > 0 && (
                      <TabsTrigger
                        value="code"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        Code Examples
                      </TabsTrigger>
                    )}
                    <TabsTrigger
                      value="integration"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                    >
                      Integration
                    </TabsTrigger>
                    {relatedFeatures.length > 0 && (
                      <TabsTrigger
                        value="related"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
                      >
                        Related
                      </TabsTrigger>
                    )}
                  </div>
                </TabsList>
              </ScrollArea>
            </div>

            {/* Tab Content */}
            <ScrollArea className="flex-1">
              <div className="p-8 min-h-[400px]">
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Location</h3>
                    <code className="block px-4 py-3 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                      {feature.location}
                    </code>
                  </div>

                  {feature.metadata && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {feature.metadata.linesOfCode !== undefined && (
                          <TechSpecItem
                            label="Lines of Code"
                            value={feature.metadata.linesOfCode.toLocaleString()}
                            icon={<FileCode className="size-4" />}
                          />
                        )}
                        {feature.metadata.testCoverage !== undefined && (
                          <TechSpecItem
                            label="Test Coverage"
                            value={`${feature.metadata.testCoverage}%`}
                            icon={<Gauge className="size-4" />}
                          />
                        )}
                        {feature.metadata.lastUpdated && (
                          <TechSpecItem
                            label="Last Updated"
                            value={new Date(feature.metadata.lastUpdated).toLocaleDateString()}
                            icon={<Info className="size-4" />}
                          />
                        )}
                        {feature.metadata.contributors && feature.metadata.contributors.length > 0 && (
                          <TechSpecItem
                            label="Contributors"
                            value={feature.metadata.contributors}
                            icon={<Info className="size-4" />}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Technical Specs Tab */}
                {feature.techSpecs && (
                  <TabsContent value="specs" className="mt-0">
                    <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(feature.techSpecs).map(([key, value]) => {
                        if (!value) {return null}
                        return (
                          <TechSpecItem
                            key={key}
                            label={key.replace(/([A-Z])/g, ' $1').trim()}
                            value={value}
                            icon={getSpecIcon(key)}
                          />
                        )
                      })}
                    </div>
                  </TabsContent>
                )}

                {/* Code Examples Tab */}
                {feature.codeExamples && feature.codeExamples.length > 0 && (
                  <TabsContent value="code" className="mt-0 space-y-6">
                    <h3 className="text-lg font-semibold mb-4">Code Examples</h3>
                    {feature.codeExamples.map((example, index) => (
                      <CodeBlock key={index} example={example} />
                    ))}
                  </TabsContent>
                )}

                {/* Integration Tab */}
                <TabsContent value="integration" className="mt-0 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">How to Integrate</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                        <h4 className="font-semibold mb-2 text-sm">Import the Feature</h4>
                        <code className="block px-3 py-2 bg-black/90 text-green-400 rounded text-xs font-mono">
                          import &#123; {feature.title.replace(/\s+/g, '')} &#125; from '{feature.location}'
                        </code>
                      </div>

                      {feature.techSpecs?.dependencies && (
                        <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                          <h4 className="font-semibold mb-2 text-sm">Prerequisites</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {feature.techSpecs.dependencies.map((dep, i) => (
                              <li key={i}>{dep}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                        <h4 className="font-semibold mb-2 text-sm">Quick Start</h4>
                        <p className="text-sm text-muted-foreground">
                          This feature is located at <code className="px-1 py-0.5 bg-black/90 text-green-400 rounded text-xs">{feature.location}</code>.
                          {feature.documentation && (
                            <> Refer to the documentation for detailed integration instructions.</>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Related Features Tab */}
                {relatedFeatures.length > 0 && (
                  <TabsContent value="related" className="mt-0">
                    <h3 className="text-lg font-semibold mb-4">Related Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {relatedFeatures.map((relatedFeature) => (
                        <MiniFeatureCard
                          key={relatedFeature.id}
                          feature={relatedFeature}
                          onClick={() => {
                            // This would ideally trigger opening a new dialog for the related feature
                            // For now, we'll just keep it as a placeholder
                            console.log('Open related feature:', relatedFeature.id)
                          }}
                        />
                      ))}
                    </div>
                  </TabsContent>
                )}
              </div>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-8 border-t border-border/50 bg-muted/30">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {feature.documentation && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={feature.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View documentation"
                  >
                    <BookOpen className="size-4" />
                    <span>Documentation</span>
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="gap-2"
                aria-label={copiedUrl ? "URL copied" : "Copy feature URL"}
              >
                {copiedUrl ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="size-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
                aria-label="Share feature"
              >
                <Share2 className="size-4" />
                <span>Share</span>
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                size="sm"
                className="gap-2 flex-1 sm:flex-initial"
                aria-label="Try interactive demo"
              >
                <PlayCircle className="size-4" />
                <span>Try Demo</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
